const express = require('express');
const router = express.Router();
const TransactionController = require('../controllers/transactionController');
const { authenticate } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validate');
const { param } = require('express-validator');

const validateTransactionIdParam = [
  param('id').isMongoId().withMessage('Invalid transaction id')
];

router.use(authenticate);

router.get('/', TransactionController.listTransactions);

router.get(
  '/:id',
  validateTransactionIdParam,
  handleValidationErrors,
  TransactionController.getTransaction
);

module.exports = router;