const mongoose = require('mongoose');

// PENDING is deliberately not included: a booking is considered
// confirmed the moment it's created (the deposit is "paid" immediately
// as part of that same request), so there is no intermediate waiting
// state in this system's business rules.
const BOOKING_STATUSES = ['CONFIRMED', 'COMPLETED', 'CANCELLED'];

const bookingSchema = new mongoose.Schema(
  {
    gigId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Gig',
      required: true
    },
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    freelancerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    bookingDate: {
      type: Date,
      required: [true, 'Booking date is required']
    },
    // amount, depositAmount and remainingAmount are always copied from
    // the gig at the moment of booking (see bookingService.createBooking).
    // They are never taken directly from the request body, so a change
    // to the gig's price later never retroactively changes an existing
    // booking's financial record.
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    depositAmount: {
      type: Number,
      required: true,
      min: 0
    },
    remainingAmount: {
      type: Number,
      required: true,
      min: 0
    },
    status: {
      type: String,
      enum: BOOKING_STATUSES,
      default: 'CONFIRMED'
    }
  },
  {
    timestamps: true
  }
);

/**
 * Returns a plain object safe to send to the client.
 */
bookingSchema.methods.toSafeObject = function toSafeObject() {
  return {
    id: this.id,
    gigId: this.gigId._id ? this.gigId._id.toString() : this.gigId.toString(),
    clientId: this.clientId._id ? this.clientId._id.toString() : this.clientId.toString(),
    freelancerId: this.freelancerId._id
      ? this.freelancerId._id.toString()
      : this.freelancerId.toString(),
    bookingDate: this.bookingDate,
    amount: this.amount,
    depositAmount: this.depositAmount,
    remainingAmount: this.remainingAmount,
    status: this.status,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
};

const Booking = mongoose.model('Booking', bookingSchema);
Booking.STATUSES = BOOKING_STATUSES;

module.exports = Booking;