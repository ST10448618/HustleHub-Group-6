const { body, param } = require('express-validator');
const Gig = require('../models/Gig');

/**
 * Validation for creating a new gig. All fields are required.
 */
const validateCreateGig = [
  body('title')
    .trim()
    .notEmpty().withMessage('Title is required')
    .isLength({ max: 150 }).withMessage('Title must be 150 characters or fewer')
    .escape(),

  body('description')
    .trim()
    .notEmpty().withMessage('Description is required')
    .isLength({ max: 2000 }).withMessage('Description must be 2000 characters or fewer')
    .escape(),

  body('category')
    .trim()
    .notEmpty().withMessage('Category is required')
    .isIn(Gig.CATEGORIES).withMessage(`Category must be one of: ${Gig.CATEGORIES.join(', ')}`),

  body('price')
    .notEmpty().withMessage('Price is required')
    .isFloat({ gt: 0 }).withMessage('Price must be greater than 0'),

  body('depositAmount')
    .notEmpty().withMessage('Deposit amount is required')
    .isFloat({ min: 0 }).withMessage('Deposit amount cannot be negative')
    .custom((value, { req }) => {
      if (parseFloat(value) > parseFloat(req.body.price)) {
        throw new Error('Deposit amount cannot be greater than the price');
      }
      return true;
    })
];

/**
 * Validation for updating a gig. Every field is optional (a client
 * may send just one changed field), but whatever IS sent must still
 * be valid. Note: the deposit-vs-price cross-check for partial
 * updates is handled at the schema level (see models/Gig.js), since
 * that is the only place that reliably knows both the incoming and
 * currently-stored values together.
 */
const validateUpdateGig = [
  body('title')
    .optional()
    .trim()
    .notEmpty().withMessage('Title cannot be empty')
    .isLength({ max: 150 }).withMessage('Title must be 150 characters or fewer')
    .escape(),

  body('description')
    .optional()
    .trim()
    .notEmpty().withMessage('Description cannot be empty')
    .isLength({ max: 2000 }).withMessage('Description must be 2000 characters or fewer')
    .escape(),

  body('category')
    .optional()
    .trim()
    .isIn(Gig.CATEGORIES).withMessage(`Category must be one of: ${Gig.CATEGORIES.join(', ')}`),

  body('price')
    .optional()
    .isFloat({ gt: 0 }).withMessage('Price must be greater than 0'),

  body('depositAmount')
    .optional()
    .isFloat({ min: 0 }).withMessage('Deposit amount cannot be negative')
];

/**
 * Validates that :id in the URL is a well-formed MongoDB id, before
 * it ever reaches a database query. This is what protects
 * Gig.findById() from ever being called with a malformed string.
 */
const validateGigIdParam = [
  param('id').isMongoId().withMessage('Invalid gig id')
];

module.exports = {
  validateCreateGig,
  validateUpdateGig,
  validateGigIdParam
};