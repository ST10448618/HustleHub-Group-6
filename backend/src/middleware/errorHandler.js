const logger = require('../utils/logger');

// Fields that must never appear in logs, even internally. (The logger
// also redacts these at any depth - this keeps the body shallow-safe.)
const SENSITIVE_BODY_FIELDS = ['password', 'passwordHash', 'confirmPassword', 'token'];

function redactBody(body) {
  if (!body || typeof body !== 'object') {
    return body;
  }

  const redacted = { ...body };
  SENSITIVE_BODY_FIELDS.forEach((field) => {
    if (field in redacted) {
      redacted[field] = '[REDACTED]';
    }
  });

  return redacted;
}

const errorHandler = (err, req, res, next) => {
  // Work out the status first so the log severity matches it.
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';

  // Special handling for known error types
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = err.message;
  }

  if (err.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid ID format';
  }

  // 5xx = something in OUR system broke (page someone).
  // 4xx = the caller sent something we rejected (expected, just record it).
  const isServerError = statusCode >= 500;
  logger[isServerError ? 'error' : 'warn'](
    isServerError ? 'Unhandled server error' : 'Request rejected',
    {
      event: isServerError ? 'SERVER_ERROR' : 'REQUEST_REJECTED',
      requestId: req.id,
      detail: err.message,
      errorName: err.name,
      statusCode,
      // Stack traces stay in server-side logs; they are never sent to clients.
      stack: isServerError ? err.stack : undefined,
      path: req.path,
      method: req.method,
      ip: req.ip,
      userId: req.user?.id,
      body: redactBody(req.body)
    }
  );

  // Don't expose stack traces in production
  const response = {
    success: false,
    message: statusCode === 500 && process.env.NODE_ENV === 'production'
      ? 'An unexpected error occurred'
      : message
  };

  // Add validation details if available
  if (err.errors) {
    response.errors = err.errors;
  }

  // Add stack trace in development only
  if (process.env.NODE_ENV === 'development' && err.stack) {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
};

module.exports = { errorHandler };