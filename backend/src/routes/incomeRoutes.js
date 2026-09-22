const express = require('express');
const router = express.Router();
const IncomeController = require('../controllers/incomeController');
const { authenticate, authorize } = require('../middleware/auth');

/**
 * GET /api/v1/income/me
 * FREELANCER only
 */
router.get('/me', authenticate, authorize('FREELANCER'), IncomeController.getMyIncome);

module.exports = router;