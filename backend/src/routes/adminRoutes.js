const express = require('express');
const router = express.Router();
const { param, body } = require('express-validator');
const AdminController = require('../controllers/adminController');
const { authenticate, authorize } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validate');

const validateUserIdParam = [
  param('id').isMongoId().withMessage('Invalid user id')
];

const validateUpdateUser = [
  body('name')
    .optional()
    .trim()
    .notEmpty().withMessage('Name cannot be empty')
    .isLength({ max: 100 }).withMessage('Name must be 100 characters or fewer'),
  body('role')
    .optional()
    .trim()
    .isIn(['CLIENT', 'FREELANCER'])
    .withMessage('Role must be CLIENT or FREELANCER')
];

// Every admin route requires authentication AND the ADMIN role.
router.use(authenticate, authorize('ADMIN'));

router.get('/users', AdminController.listUsers);

router.get(
  '/users/:id',
  validateUserIdParam,
  handleValidationErrors,
  AdminController.getUser
);

router.put(
  '/users/:id',
  validateUserIdParam,
  validateUpdateUser,
  handleValidationErrors,
  AdminController.updateUser
);

router.delete(
  '/users/:id',
  validateUserIdParam,
  handleValidationErrors,
  AdminController.deleteUser
);

/**
 * System-wide gig visibility (including INACTIVE gigs). Admin
 * management of an individual gig (PUT/DELETE) is deliberately NOT
 * duplicated here - the existing /api/v1/gigs/:id routes already
 * allow an ADMIN to update or deactivate any gig (see
 * gigService.assertOwnerOrAdmin), so a second admin-only path would
 * be redundant.
 */
router.get('/gigs', AdminController.listGigs);

module.exports = router;