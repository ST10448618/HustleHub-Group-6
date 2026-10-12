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

router.get('/gigs', AdminController.listGigs);

module.exports = router;