const TransactionService = require('../services/transactionService');

class TransactionController {
  /**
   * GET /api/v1/transactions
   * Role-scoped: CLIENT sees transactions where they paid, FREELANCER
   * sees transactions where they were paid, ADMIN sees everything.
   */
  static async listTransactions(req, res, next) {
    try {
      const transactions = await TransactionService.listForUser(req.user);

      res.status(200).json({
        success: true,
        message: 'Transactions retrieved successfully',
        data: { transactions }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/transactions/:id
   */
  static async getTransaction(req, res, next) {
    try {
      const transaction = await TransactionService.getByIdForUser(req.params.id, req.user);

      res.status(200).json({
        success: true,
        message: 'Transaction retrieved successfully',
        data: { transaction }
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = TransactionController;