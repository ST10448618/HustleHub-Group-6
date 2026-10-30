const IncomeService = require('../services/incomeService');

class IncomeController {
  /**
   * GET /api/v1/income/me
   * FREELANCER only
   */
  static async getMyIncome(req, res, next) {
    try {
      const summary = await IncomeService.getSummaryForFreelancer(req.user.id);

      res.status(200).json({
        success: true,
        message: 'Income summary retrieved successfully',
        data: summary
      });
    } catch (error) {
      next(error);
    }
  }

    static async getMyTax(req, res, next) {
    try {
      const estimate = await IncomeService.getTaxEstimateForFreelancer(req.user.id);

      res.status(200).json({
        success: true,
        message: 'Tax estimate retrieved successfully',
        data: estimate
      });
    } catch (error) {
      next(error);
    }
}
}
module.exports = IncomeController;