const Transaction = require('../models/Transaction');
const Booking = require('../models/Booking');
const { TAX_TABLE } = require('../config/taxConfig');
const { calculateIncomeTax, getTaxYearBounds } = require('../utils/taxCalculator');

class IncomeService {
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

    static async getTaxEstimateForFreelancer(freelancerId, now = new Date()) {
    const { label, start, end } = getTaxYearBounds(now);

    const paidTransactions = await Transaction.find({
      freelancerId,
      status: 'PAID',
      createdAt: { $gte: start, $lt: end }
    });

    const taxableIncome = paidTransactions.reduce(
      (sum, transaction) => sum + transaction.amount,
      0
    );

    return {
      taxYear: label,
      taxTable: TAX_TABLE.yearLabel,
      periodStart: start.toISOString(),
      periodEnd: new Date(end.getTime() - 24 * 60 * 60 * 1000).toISOString(),
      ...calculateIncomeTax(taxableIncome),
      disclaimer:
        'This is an estimate based on your recorded income for the tax year. It does not ' +
        'include deductible expenses, other income or provisional tax payments, and is not ' +
        'tax advice. Always confirm your liability with SARS or a tax practitioner.'
    };
}
}
module.exports = IncomeService;