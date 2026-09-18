const { validationResult } = require('express-validator');

/**
 * Shared validation-error handler middleware.
 *
 * Any route that uses express-validator rules (body(...), param(...), etc.)
 * should place this middleware right after those rules. It inspects the
 * validation result collected by express-validator and, if anything failed,
 * returns a consistent 400 response shape. If validation passed, it calls
 * next() to let the request continue to the controller.
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map((err) => ({
        field: err.path,
        message: err.msg
      }))
    });
  }

  next();
};

module.exports = { handleValidationErrors };