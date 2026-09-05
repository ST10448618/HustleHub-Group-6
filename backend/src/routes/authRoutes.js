const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');
const { 
  validateRegister, 
  validateLogin, 
  handleValidationErrors 
} = require('../validation/authValidation');
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

module.exports = router;