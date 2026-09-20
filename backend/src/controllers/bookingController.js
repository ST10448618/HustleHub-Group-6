const BookingService = require('../services/bookingService');

class BookingController {
  /**
   * POST /api/v1/bookings
   * CLIENT only
   */
  static async createBooking(req, res, next) {
    try {
      const { gigId, bookingDate } = req.body;
      const result = await BookingService.createBooking(req.user, gigId, bookingDate);

      res.status(201).json({
        success: true,
        message: 'Booking created successfully',
        data: { booking: result }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/bookings
   * Role-scoped: CLIENT sees their own, FREELANCER sees bookings on
   * their gigs, ADMIN sees everything.
   */
  static async listBookings(req, res, next) {
    try {
      const bookings = await BookingService.listForUser(req.user);

      res.status(200).json({
        success: true,
        message: 'Bookings retrieved successfully',
        data: { bookings }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/bookings/:id
   */
  static async getBooking(req, res, next) {
    try {
      const booking = await BookingService.getByIdForUser(req.params.id, req.user);

      res.status(200).json({
        success: true,
        message: 'Booking retrieved successfully',
        data: { booking }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/v1/bookings/:id/cancel
   * Owning CLIENT or ADMIN only
   */
  static async cancelBooking(req, res, next) {
    try {
      const booking = await BookingService.cancelBooking(req.params.id, req.user);

      res.status(200).json({
        success: true,
        message: 'Booking cancelled successfully',
        data: { booking }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/v1/bookings/:id/complete
   * Owning FREELANCER or ADMIN only
   */
  static async completeBooking(req, res, next) {
    try {
      const booking = await BookingService.completeBooking(req.params.id, req.user);

      res.status(200).json({
        success: true,
        message: 'Booking marked as completed',
        data: { booking }
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = BookingController;