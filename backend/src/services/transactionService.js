const Transaction = require('../models/Transaction');
const ApiError = require('../utils/ApiError');

const POPULATE_FIELDS = 'name';

class TransactionService {
  /**
   * Creates a DEPOSIT transaction for a newly created booking.
   * Called only from bookingService.createBooking - there is no
   * public "create transaction" endpoint, since transactions must
   * always be a direct consequence of a real booking event, never
   * something a client can fabricate directly.
   */
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

  /**
   * Creates a REMAINDER transaction when a booking is marked complete.
   * Called only from bookingService.completeBooking.
   */
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

  /**
   * Returns transactions scoped to the requesting user's role:
   *  - CLIENT: transactions where they are the payer
   *  - FREELANCER: transactions where they are the payee
   *  - ADMIN: every transaction, system-wide
   */
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

  /**
   * Returns a single transaction, but only if the requesting user is
   * the client, the freelancer, or an admin. Anyone else gets a 403 -
   * we deliberately don't leak whether the transaction exists at all
   * to an unrelated user by returning 404 instead of 403 in that case.
   */
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