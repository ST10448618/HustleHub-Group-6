const Transaction = require('../models/Transaction');
const ApiError = require('../utils/ApiError');

const POPULATE_FIELDS = 'name';

class TransactionService {

  static async createDepositTransaction(booking) {
    return Transaction.create({
      bookingId: booking._id,
      clientId: booking.clientId,
      freelancerId: booking.freelancerId,
      type: 'DEPOSIT',
      amount: booking.depositAmount,
      status: 'PAID'
    });
  }

  static async createRemainderTransaction(booking) {
    return Transaction.create({
      bookingId: booking._id,
      clientId: booking.clientId,
      freelancerId: booking.freelancerId,
      type: 'REMAINDER',
      amount: booking.remainingAmount,
      status: 'PAID'
    });
  }

  static async listForUser(user) {
    let query = {};

    if (user.role === 'CLIENT') {
      query = { clientId: user.id };
    } else if (user.role === 'FREELANCER') {
      query = { freelancerId: user.id };
    }
    // ADMIN: no filter, sees everything.

    const transactions = await Transaction.find(query)
      .populate('clientId', POPULATE_FIELDS)
      .populate('freelancerId', POPULATE_FIELDS)
      .sort({ createdAt: -1 });

    return transactions.map((t) => t.toSafeObject());
  }

  static async getByIdForUser(id, user) {
    const transaction = await Transaction.findById(id)
      .populate('clientId', POPULATE_FIELDS)
      .populate('freelancerId', POPULATE_FIELDS);

    if (!transaction) {
      throw new ApiError(404, 'Transaction not found');
    }

    const isClient = transaction.clientId._id.toString() === user.id;
    const isFreelancer = transaction.freelancerId._id.toString() === user.id;
    const isAdmin = user.role === 'ADMIN';

    if (!isClient && !isFreelancer && !isAdmin) {
      throw new ApiError(403, 'You do not have permission to view this transaction');
    }

    return transaction.toSafeObject();
  }
}

module.exports = TransactionService;