const SERVICE_NAME = 'hustlehub-api';

const LEVELS = { debug: 10, info: 20, warn: 30, error: 40 };

const MAX_BATCH_SIZE = 50;
const FLUSH_INTERVAL_MS = 2000;
const MAX_QUEUE_SIZE = 1000;
const SHIP_TIMEOUT_MS = 5000;
const SHIPPING_WARNING_INTERVAL_MS = 60 * 1000;

const REDACTED_KEYS = new Set([
  'password',
  'passwordhash',
  'confirmpassword',
  'token',
  'authorization',
  'jwt',
  'secret',
  'jwt_secret',
  'betterstack_source_token'
]);

let queue = [];
let flushTimer = null;
let inFlight = Promise.resolve();
let lastShippingWarning = 0;

function activeLevel() {
  const configured = (process.env.LOG_LEVEL || '').toLowerCase();
  if (LEVELS[configured]) {
    return configured;
  }
  return process.env.NODE_ENV === 'development' ? 'debug' : 'info';
}

function isSilent() {
  return process.env.NODE_ENV === 'test' && process.env.LOG_IN_TESTS !== 'true';
}

function shippingEnabled() {
  return Boolean(
    process.env.BETTERSTACK_SOURCE_TOKEN && process.env.BETTERSTACK_INGESTING_HOST
  );
}

/**
 * Returns a copy of `value` with every sensitive key replaced by
 * "[REDACTED]", at any depth. Depth is capped so a circular structure
 * can never cause unbounded recursion.
 */
function redact(value, depth = 0) {
  if (value === null || typeof value !== 'object') {
    return value;
  }
  if (depth > 4) {
    return '[TRUNCATED]';
  }
  if (typeof value.toJSON === 'function') {
    return redact(value.toJSON(), depth + 1);
  }
  if (Array.isArray(value)) {
    return value.map((item) => redact(item, depth + 1));
  }

  const clean = {};
  for (const [key, child] of Object.entries(value)) {
    clean[key] = REDACTED_KEYS.has(key.toLowerCase()) ? '[REDACTED]' : redact(child, depth + 1);
  }
  return clean;
}

// Logging problems are reported on the console only (never through the
// logger itself, which would recurse) and at most once a minute.
function reportShippingProblem(reason) {
  const now = Date.now();
  if (now - lastShippingWarning < SHIPPING_WARNING_INTERVAL_MS) {
    return;
  }
  lastShippingWarning = now;
  // eslint-disable-next-line no-console
  console.error(`[logger] Could not ship logs to Better Stack: ${reason}`);
}

async function send(batch) {
  const token = process.env.BETTERSTACK_SOURCE_TOKEN;
  const host = (process.env.BETTERSTACK_INGESTING_HOST || '')
    .replace(/^https?:\/\//, '')
    .replace(/\/+$/, '');

  try {
    const response = await fetch(`https://${host}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(batch),
      signal: AbortSignal.timeout(SHIP_TIMEOUT_MS)
    });

    if (!response.ok) {
      reportShippingProblem(`HTTP ${response.status}`);
    }
  } catch (error) {
    reportShippingProblem(error.message);
  }
}

/**
 * Sends everything queued so far. Resolves when the network call
 * finishes and never rejects. Call it before the process exits.
 */
function flush() {
  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }

  if (queue.length > 0) {
    const batch = queue;
    queue = [];
    inFlight = inFlight.then(() => send(batch));
  }

  return inFlight;
}

function enqueue(entry) {
  if (queue.length >= MAX_QUEUE_SIZE) {
    queue.shift(); // if the platform is unreachable, drop the oldest entry
  }
  queue.push(entry);

  if (queue.length >= MAX_BATCH_SIZE) {
    flush();
    return;
  }

  if (!flushTimer) {
    flushTimer = setTimeout(flush, FLUSH_INTERVAL_MS);
    if (typeof flushTimer.unref === 'function') {
      flushTimer.unref(); // never keep the process alive just to flush logs
    }
  }
}

function write(level, message, meta = {}) {
  if (isSilent() || LEVELS[level] < LEVELS[activeLevel()]) {
    return;
  }

  // Existing call sites pass { message: err.message } as meta. That key
  // would clobber the log message, so it is kept as `detail` instead.
  const { message: detail, ...rest } = redact(meta) || {};
  if (detail !== undefined) {
    rest.detail = detail;
  }

  const timestamp = new Date().toISOString();
  const entry = {
    ...rest,
    level,
    timestamp,
    message,
    service: SERVICE_NAME,
    environment: process.env.NODE_ENV || 'development'
  };

  let line;
  try {
    line = JSON.stringify(entry);
  } catch {
    line = JSON.stringify({ level, timestamp, message, note: 'log metadata was not serialisable' });
  }

  const sink =
    level === 'error' ? console.error : level === 'warn' ? console.warn : level === 'debug' ? console.debug : console.log;
  sink(line);

  if (shippingEnabled()) {
    enqueue({ ...entry, dt: timestamp });
  }
}

const logger = {
  debug: (message, meta) => write('debug', message, meta),
  info: (message, meta) => write('info', message, meta),
  warn: (message, meta) => write('warn', message, meta),
  error: (message, meta) => write('error', message, meta),
  flush
};

module.exports = logger;