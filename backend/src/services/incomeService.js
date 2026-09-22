const Transaction = require('../models/Transaction');
const Booking = require('../models/Booking');

class IncomeService {
  /**
   * Computes a freelancer's income summary, derived live from
   * authoritative Transaction and Booking records rather than a
   * separately-stored running total. This guarantees the number
   * shown is always consistent with the underlying financial history,
   * with nothing to fall out of sync.
   *
   *  - depositIncome:   sum of PAID DEPOSIT transactions
   *  - remainingIncome: sum of PAID REMAINDER transactions
   *  - totalIncome:     depositIncome + remainingIncome
   *  - pendingIncome:   remainingAmount of bookings that are still
   *                     CONFIRMED (work not yet marked complete, so
   *                     the remainder hasn't been released yet).
   *                     A CANCELLED booking's remainder is correctly
   *                     excluded here - it will never be paid.
   */
  static async getSummaryForFreelancer(freelancerId) {
    const paidTransactions = await Transaction.find({
      freelancerId,
      status: 'PAID'
    });

    let depositIncome = 0;
    let remainingIncome = 0;

    paidTransactions.forEach((transaction) => {
      if (transaction.type === 'DEPOSIT') {
        depositIncome += transaction.amount;
      } else if (transaction.type === 'REMAINDER') {
        remainingIncome += transaction.amount;
      }
    });

    const totalIncome = depositIncome + remainingIncome;

    const upcomingBookings = await Booking.find({
      freelancerId,
      status: 'CONFIRMED'
    });

    const pendingIncome = upcomingBookings.reduce(
      (sum, booking) => sum + booking.remainingAmount,
      0
    );

    return {
      totalIncome,
      depositIncome,
      remainingIncome,
      pendingIncome
    };
  }
}

module.exports = IncomeService;