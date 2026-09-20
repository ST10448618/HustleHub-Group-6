const { body, param } = require('express-validator');

/**
 * Returns the start of today (00:00:00) so a booking date of "today"
 * is always accepted regardless of what time it currently is - only
 * genuinely past dates are rejected.
 */
function startOfToday() {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return now;
}

/**
 * Validation for creating a booking.
 */
const validateCreateBooking = [
  body('gigId')
    .notEmpty().withMessage('gigId is required')
    .isMongoId().withMessage('gigId must be a valid id'),

  body('bookingDate')
    .notEmpty().withMessage('Booking date is required')
    .isISO8601().withMessage('Booking date must be a valid date')
    .custom((value) => {
      const date = new Date(value);
      if (date < startOfToday()) {
        throw new Error('Booking date cannot be in the past');
      }
      return true;
    })
];

/**
 * Validates that :id in the URL is a well-formed MongoDB id.
 */
const validateBookingIdParam = [
  param('id').isMongoId().withMessage('Invalid booking id')
];

module.exports = {
  validateCreateBooking,
  validateBookingIdParam
};