const crypto = require('crypto');
const logger = require('../utils/logger');

// Health probes (Docker/CI) fire constantly and would drown real traffic.
const SKIPPED_PATHS = new Set(['/health']);

function requestLogger(req, res, next) {
  if (SKIPPED_PATHS.has(req.path)) {
    return next();
  }

  const requestId = crypto.randomUUID();
  req.id = requestId;
  res.setHeader('X-Request-Id', requestId);

  const startedAt = process.hrtime.bigint();

  res.on('finish', () => {
    const durationMs = Math.round(Number(process.hrtime.bigint() - startedAt) / 1e5) / 10;
    const status = res.statusCode;
    const level = status >= 500 ? 'error' : status >= 400 ? 'warn' : 'info';

    logger[level]('HTTP request completed', {
      event: 'HTTP_REQUEST',
      requestId,
      method: req.method,
      path: req.originalUrl.split('?')[0],
      status,
      durationMs,
      ip: req.ip,
      userId: req.user ? req.user.id : undefined,
      userAgent: req.get('user-agent')
    });
  });

  return next();
}

module.exports = requestLogger;