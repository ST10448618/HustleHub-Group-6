const express = require('express');
const router = express.Router();
const TransactionController = require('../controllers/transactionController');
const { authenticate } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validate');
const { param } = require('express-validator');

const validateTransactionIdParam = [
  param('id').isMongoId().withMessage('Invalid transaction id')
];

// Transactions are never created directly by a client request - only
// as a consequence of booking creation/completion inside
// bookingService. These routes are read-only by design.
router.use(authenticate);

router.get('/', TransactionController.listTransactions);

router.get(
  '/:id',
  validateTransactionIdParam,
  handleValidationErrors,
  TransactionController.getTransaction
);

module.exports = router;