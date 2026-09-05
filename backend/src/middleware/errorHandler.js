const logger = require('../utils/logger');

/**
 * Global error handler middleware
 * 
 * This middleware:
 * 1. Logs errors with appropriate details
 * 2. Sends safe error responses to clients
 * 3. Never exposes stack traces or internal details in production
 */
const errorHandler = (err, req, res, next) => {
  // Log the error
  logger.error('Error occurred', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    path: req.path,
    method: req.method,
    ip: req.ip,
    userId: req.user?.id,
    body: req.body
  });
  
  // Default error response
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