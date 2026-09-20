const mongoose = require('mongoose');

const TRANSACTION_TYPES = ['DEPOSIT', 'REMAINDER'];
const TRANSACTION_STATUSES = ['PAID', 'CANCELLED'];

const transactionSchema = new mongoose.Schema(
  {
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
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
    type: {
      type: String,
      enum: TRANSACTION_TYPES,
      required: true
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    status: {
      type: String,
      enum: TRANSACTION_STATUSES,
      required: true
    }
  },
  {
    timestamps: true
  }
);

/**
 * Transactions are the authoritative financial record. They are only
 * ever created as a direct consequence of a valid booking/completion
 * flow inside bookingService - never directly from a client request
 * (there is deliberately no "POST /transactions" endpoint).
 */
transactionSchema.methods.toSafeObject = function toSafeObject() {
  return {
    id: this.id,
    bookingId: this.bookingId._id ? this.bookingId._id.toString() : this.bookingId.toString(),
    clientId: this.clientId._id ? this.clientId._id.toString() : this.clientId.toString(),
    freelancerId: this.freelancerId._id
      ? this.freelancerId._id.toString()
      : this.freelancerId.toString(),
    type: this.type,
    amount: this.amount,
    status: this.status,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
};

const Transaction = mongoose.model('Transaction', transactionSchema);
Transaction.TYPES = TRANSACTION_TYPES;
Transaction.STATUSES = TRANSACTION_STATUSES;

module.exports = Transaction;