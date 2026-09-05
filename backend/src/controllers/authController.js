const AuthService = require('../services/authService');
const logger = require('../utils/logger');

/**
 * Auth Controller
 * Handles registration and login operations
 */
class AuthController {
  /**
   * Register a new user
   * POST /api/v1/auth/register
   */
  static async register(req, res, next) {
    try {
      const { name, email, password } = req.body;
      
      // Register user
      const user = await AuthService.register({
        name,
        email,
        password
      });
      
      logger.info('User registration successful', {
        userId: user.id,
        email: user.email,
        role: user.role
      });
      
      return res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: user
      });
    } catch (error) {
      // Handle specific errors
      if (error.message === 'Email already registered') {
        return res.status(409).json({
          success: false,
          message: 'Email already registered. Please login or use a different email.'
        });
      }
      
      // Pass other errors to error handler
      next(error);
    }
  }
  
  /**
   * Login user and return JWT
   * POST /api/v1/auth/login
   */
  static async login(req, res, next) {
    try {
      const { email, password } = req.body;
      
      // Login and get token
      const result = await AuthService.login(email, password);
      
      logger.info('User login successful', {
        userId: result.user.id,
        email: result.user.email,
        role: result.user.role
      });
      
      return res.status(200).json({
        success: true,
        message: 'Login successful',
        data: {
          token: result.token,
          user: result.user
        }
      });
    } catch (error) {
      if (error.message === 'Invalid email or password') {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
      }
      
      next(error);
    }
  }
  
  /**
   * Get current authenticated user
   * GET /api/v1/users/me
   */
  static async getMe(req, res, next) {
    try {
      // User is attached by authenticate middleware
      return res.status(200).json({
        success: true,
        data: req.user
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = AuthController;