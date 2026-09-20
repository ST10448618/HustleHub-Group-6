const Booking = require('../models/Booking');
const Gig = require('../models/Gig');
const ApiError = require('../utils/ApiError');
const TransactionService = require('./transactionService');
const logger = require('../utils/logger');

const POPULATE_FIELDS = 'name';

class BookingService {
  /**
   * Creates a booking for the given gig, on behalf of the given client.
   *
   * Business flow:
   *   validate request (done by bookingValidation.js before this runs)
   *   -> load gig, confirm it exists and is bookable
   *   -> confirm the client is not the gig's own freelancer
   *   -> derive authoritative amounts from the gig (never from the request)
   *   -> create the booking
   *   -> create the matching DEPOSIT transaction
   *
   * Atomicity note: MongoDB multi-document transactions require a
   * replica set, which the in-memory database used by our automated
   * tests does not run by default (a real Atlas cluster does support
   * them). Rather than depend on infrastructure that differs between
   * test and production, this uses a simple, explicit compensating
   * action instead: if creating the deposit transaction fails after
   * the booking was already created, the booking is deleted before
   * the error is re-thrown, so the system never ends up with a
   * "booking with no deposit transaction" left behind. This is a
   * documented, deliberate trade-off - not full ACID atomicity, but
   * safe for the two-step operation actually being performed here.
   */
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
      { path: 'gigId' },
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

  /**
   * Returns bookings scoped to the requesting user's role:
   *  - CLIENT: their own bookings
   *  - FREELANCER: bookings made against their gigs
   *  - ADMIN: every booking, system-wide
   * The frontend never gets to choose whose bookings are returned -
   * scope is entirely derived from the authenticated identity.
   */
  static async listForUser(user) {
    let query = {};

    if (user.role === 'CLIENT') {
      query = { clientId: user.id };
    } else if (user.role === 'FREELANCER') {
      query = { freelancerId: user.id };
    }

    const bookings = await Booking.find(query)
      .populate('clientId', POPULATE_FIELDS)
      .populate('freelancerId', POPULATE_FIELDS)
      .sort({ createdAt: -1 });

    return bookings.map((b) => b.toSafeObject());
  }

  /**
   * Returns a single booking, but only to the client who made it, the
   * freelancer who owns the gig, or an admin.
   */
  static async getByIdForUser(id, user) {
    const booking = await Booking.findById(id)
      .populate('clientId', POPULATE_FIELDS)
      .populate('freelancerId', POPULATE_FIELDS);

    if (!booking) {
      throw new ApiError(404, 'Booking not found');
    }

    BookingService.assertParticipantOrAdmin(booking, user);

    return booking.toSafeObject();
  }

  /**
   * Cancels a booking. Only the owning client or an admin may do this,
   * and only while the booking is still CONFIRMED.
   *
   * Business rule: the deposit is retained (its transaction is never
   * modified or removed) and the remaining payment is simply never
   * scheduled, since a CANCELLED booking can no longer be completed.
   */
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
    await booking.populate('clientId', POPULATE_FIELDS);
    await booking.populate('freelancerId', POPULATE_FIELDS);

    logger.info('Booking cancelled', { bookingId: booking.id, cancelledBy: user.id });

    return booking.toSafeObject();
  }

  /**
   * Marks a booking complete once the gig date has arrived, and
   * releases the remaining payment by creating a REMAINDER
   * transaction. Only the owning freelancer or an admin may do this.
   */
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

    await booking.populate('clientId', POPULATE_FIELDS);
    await booking.populate('freelancerId', POPULATE_FIELDS);

    logger.info('Booking completed', { bookingId: booking.id, completedBy: user.id });

    return booking.toSafeObject();
  }

  /**
   * Whether the booking's scheduled date has arrived. Kept as one
   * clear, named function rather than an inline date comparison, so
   * Part 3's financial presentation can reuse the same definition of
   * "has this booking's work date passed" if needed.
   */
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