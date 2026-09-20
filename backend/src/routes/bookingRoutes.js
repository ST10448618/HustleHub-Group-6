const express = require('express');
const router = express.Router();
const BookingController = require('../controllers/bookingController');
const { authenticate, authorize } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validate');
const { bookingLimiter } = require('../middleware/rateLimiter');
const {
  validateCreateBooking,
  validateBookingIdParam
} = require('../validation/bookingValidation');

// Every booking route requires authentication.
router.use(authenticate);

/**
 * POST /api/v1/bookings
 * CLIENT only. Rate limited (skipped in test env - see rateLimiter
 * usage in app.js for the same reasoning as the auth limiter).
 */
router.post(
  '/',
  ...(process.env.NODE_ENV !== 'test' ? [bookingLimiter] : []),
  authorize('CLIENT'),
  validateCreateBooking,
  handleValidationErrors,
  BookingController.createBooking
);

/**
 * GET /api/v1/bookings
 * Role-scoped list - see bookingService.listForUser.
 */
router.get('/', BookingController.listBookings);

/**
 * GET /api/v1/bookings/:id
 */
router.get(
  '/:id',
  validateBookingIdParam,
  handleValidationErrors,
  BookingController.getBooking
);

/**
 * PATCH /api/v1/bookings/:id/cancel
 * Owning CLIENT or ADMIN only (enforced in bookingService).
 */
router.patch(
  '/:id/cancel',
  validateBookingIdParam,
  handleValidationErrors,
  BookingController.cancelBooking
);

/**
 * PATCH /api/v1/bookings/:id/complete
 * Owning FREELANCER or ADMIN only (enforced in bookingService).
 */
router.patch(
  '/:id/complete',
  validateBookingIdParam,
  handleValidationErrors,
  BookingController.completeBooking
);

module.exports = router;