const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');
const { validateRegister, validateLogin } = require('../validation/authValidation');
const { handleValidationErrors } = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');

// Public routes
router.post(
  '/register',
  validateRegister,
  handleValidationErrors,
  AuthController.register
);

router.post(
  '/login',
  validateLogin,
  handleValidationErrors,
  AuthController.login
);

// Protected routes
router.get(
  '/me',
  authenticate,
  AuthController.getMe
);

// Ends the session: the presented token is added to the revocation list.
router.post(
  '/logout',
  authenticate,
  AuthController.logout
);

module.exports = router;