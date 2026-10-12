const Booking = require('../models/Booking');
const Gig = require('../models/Gig');
const ApiError = require('../utils/ApiError');
const TransactionService = require('./transactionService');
const logger = require('../utils/logger');

const POPULATE_FIELDS = 'name';
const GIG_POPULATE_FIELDS = 'title';

class BookingService {
  static async createBooking(client, gigId, bookingDate) {
    const gig = await Gig.findById(gigId);

    if (!gig) {
      throw new ApiError(404, 'Gig not found');
    }

    if (gig.status !== 'ACTIVE') {
      throw new ApiError(400, 'This gig is not currently available for booking');
    }

    if (gig.freelancerId.toString() === client.id) {
      throw new ApiError(403, 'You cannot book your own gig');
    }

    // Authoritative amounts always come from the gig, never the request.
    const amount = gig.price;
    const depositAmount = gig.depositAmount;
    const remainingAmount = amount - depositAmount;

    const booking = await Booking.create({
      gigId: gig._id,
      clientId: client.id,
      freelancerId: gig.freelancerId,
      bookingDate,
      amount,
      depositAmount,
      remainingAmount,
      status: 'CONFIRMED'
    });

    try {
      await TransactionService.createDepositTransaction(booking);
    } catch (error) {
      // Compensating rollback: don't leave an orphaned booking with
      // no corresponding deposit transaction.
      await Booking.findByIdAndDelete(booking._id);
      logger.error('Failed to create deposit transaction, booking rolled back', {
        bookingId: booking.id,
        message: error.message
      });
      throw new ApiError(500, 'Failed to complete booking. Please try again.');
    }

    await booking.populate([
      { path: 'gigId', select: GIG_POPULATE_FIELDS },
      { path: 'clientId', select: POPULATE_FIELDS },
      { path: 'freelancerId', select: POPULATE_FIELDS }
    ]);

    logger.info('Booking created', {
      bookingId: booking.id,
      gigId: gig.id,
      clientId: client.id,
      freelancerId: gig.freelancerId.toString()
    });

    return booking.toSafeObject();
  }

  static async listForUser(user) {
    let query = {};

    if (user.role === 'CLIENT') {
      query = { clientId: user.id };
    } else if (user.role === 'FREELANCER') {
      query = { freelancerId: user.id };
    }

    const bookings = await Booking.find(query)
      .populate('gigId', GIG_POPULATE_FIELDS)
      .populate('clientId', POPULATE_FIELDS)
      .populate('freelancerId', POPULATE_FIELDS)
      .sort({ createdAt: -1 });

    return bookings.map((b) => b.toSafeObject());
  }

  static async getByIdForUser(id, user) {
    const booking = await Booking.findById(id)
      .populate('gigId', GIG_POPULATE_FIELDS)
      .populate('clientId', POPULATE_FIELDS)
      .populate('freelancerId', POPULATE_FIELDS);

    if (!booking) {
      throw new ApiError(404, 'Booking not found');
    }

    BookingService.assertParticipantOrAdmin(booking, user);

    return booking.toSafeObject();
  }

  static async cancelBooking(id, user) {
    const booking = await Booking.findById(id);

    if (!booking) {
      throw new ApiError(404, 'Booking not found');
    }

    const isOwningClient = booking.clientId.toString() === user.id && user.role === 'CLIENT';
    const isAdmin = user.role === 'ADMIN';

    if (!isOwningClient && !isAdmin) {
      throw new ApiError(403, 'You do not have permission to cancel this booking');
    }

    if (booking.status !== 'CONFIRMED') {
      throw new ApiError(400, `This booking cannot be cancelled because it is already ${booking.status}`);
    }

    booking.status = 'CANCELLED';
    await booking.save();
    await booking.populate('gigId', GIG_POPULATE_FIELDS);
    await booking.populate('clientId', POPULATE_FIELDS);
    await booking.populate('freelancerId', POPULATE_FIELDS);

    logger.info('Booking cancelled', { bookingId: booking.id, cancelledBy: user.id });

    return booking.toSafeObject();
  }

  static async completeBooking(id, user) {
    const booking = await Booking.findById(id);

    if (!booking) {
      throw new ApiError(404, 'Booking not found');
    }

    const isOwningFreelancer =
      booking.freelancerId.toString() === user.id && user.role === 'FREELANCER';
    const isAdmin = user.role === 'ADMIN';

    if (!isOwningFreelancer && !isAdmin) {
      throw new ApiError(403, 'You do not have permission to complete this booking');
    }

    if (booking.status !== 'CONFIRMED') {
      throw new ApiError(400, `This booking cannot be completed because it is already ${booking.status}`);
    }

    if (!BookingService.hasBookingDatePassed(booking)) {
      throw new ApiError(
        400,
        `This booking cannot be marked complete until its scheduled date (${booking.bookingDate.toISOString().split('T')[0]}).`
      );
    }

    booking.status = 'COMPLETED';
    await booking.save();

    try {
      await TransactionService.createRemainderTransaction(booking);
    } catch (error) {
      // Revert the status change so the booking isn't left COMPLETED
      // with no corresponding remainder transaction.
      booking.status = 'CONFIRMED';
      await booking.save();
      logger.error('Failed to create remainder transaction, completion rolled back', {
        bookingId: booking.id,
        message: error.message
      });
      throw new ApiError(500, 'Failed to complete booking. Please try again.');
    }

    await booking.populate('gigId', GIG_POPULATE_FIELDS);
    await booking.populate('clientId', POPULATE_FIELDS);
    await booking.populate('freelancerId', POPULATE_FIELDS);

    logger.info('Booking completed', { bookingId: booking.id, completedBy: user.id });

    return booking.toSafeObject();
  }

  static hasBookingDatePassed(booking) {
    return new Date() >= new Date(booking.bookingDate);
  }

  static assertParticipantOrAdmin(booking, user) {
    const isClient = booking.clientId._id
      ? booking.clientId._id.toString() === user.id
      : booking.clientId.toString() === user.id;
    const isFreelancer = booking.freelancerId._id
      ? booking.freelancerId._id.toString() === user.id
      : booking.freelancerId.toString() === user.id;
    const isAdmin = user.role === 'ADMIN';

    if (!isClient && !isFreelancer && !isAdmin) {
      throw new ApiError(403, 'You do not have permission to view this booking');
    }
  }
}

module.exports = BookingService;