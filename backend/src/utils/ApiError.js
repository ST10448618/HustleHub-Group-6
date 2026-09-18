/**
 * ApiError
 *
 * A small, deliberate Error subclass that carries an HTTP status code
 * alongside a safe, user-facing message. Services throw this instead of
 * a plain Error so that the central error handler (middleware/errorHandler.js)
 * can respond with the correct status code without controllers needing to
 * match on error message strings.
 *
 * Example:
 *   throw new ApiError(404, 'Gig not found');
 *   throw new ApiError(403, 'You do not own this gig');
 */
class ApiError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = ApiError;