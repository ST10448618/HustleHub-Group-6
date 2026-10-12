const mongoose = require('mongoose');

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