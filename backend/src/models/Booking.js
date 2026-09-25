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
 *
 * gigId, clientId and freelancerId are always included as plain id
 * strings, exactly as before - nothing existing changes shape.
 *
 * Additionally, whenever the caller has populated gigId/clientId/
 * freelancerId (see bookingService.js), this also attaches small
 * "gig" / "client" / "freelancer" objects (id + title, or id + name)
 * so the frontend never has to make a second request just to display
 * a gig title or a person's name next to a booking. This mirrors the
 * same populated-vs-raw detection pattern Gig.toSafeObject() already
 * uses for its "freelancer" field.
 */
bookingSchema.methods.toSafeObject = function toSafeObject() {
  const isGigPopulated = this.gigId && this.gigId.title !== undefined;
  const isClientPopulated = this.clientId && this.clientId.name !== undefined;
  const isFreelancerPopulated = this.freelancerId && this.freelancerId.name !== undefined;

  const obj = {
    id: this.id,
    gigId: isGigPopulated ? this.gigId._id.toString() : this.gigId.toString(),
    clientId: isClientPopulated ? this.clientId._id.toString() : this.clientId.toString(),
    freelancerId: isFreelancerPopulated
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

  if (isGigPopulated) {
    obj.gig = { id: this.gigId._id.toString(), title: this.gigId.title };
  }

  if (isClientPopulated) {
    obj.client = { id: this.clientId._id.toString(), name: this.clientId.name };
  }

  if (isFreelancerPopulated) {
    obj.freelancer = { id: this.freelancerId._id.toString(), name: this.freelancerId.name };
  }

  return obj;
};

const Booking = mongoose.model('Booking', bookingSchema);
Booking.STATUSES = BOOKING_STATUSES;

module.exports = Booking;