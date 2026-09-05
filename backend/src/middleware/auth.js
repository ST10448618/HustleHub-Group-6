const AuthService = require('../services/authService');
const logger = require('../utils/logger');

/**
 * JWT Authentication Middleware
 * 
 * This middleware:
 * 1. Extracts JWT from Authorization header
 * 2. Verifies the token
 * 3. Attaches authenticated user to req.user
 * 4. Handles missing/invalid/expired tokens gracefully
 */
const authenticate = (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      logger.warn('Protected route accessed without token', {
        path: req.path,
        method: req.method,
        ip: req.ip
      });
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please provide a valid JWT token.'
      });
    }
    
    // Check Bearer scheme
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      logger.warn('Invalid Authorization header format', {
        path: req.path,
        ip: req.ip
      });
      return res.status(401).json({
        success: false,
        message: 'Invalid token format. Use: Bearer <token>'
      });
    }
    
    const token = parts[1];
    
    // Verify token
    const decoded = AuthService.verifyToken(token);
    
    // Get user from storage
    const user = AuthService.getUserById(decoded.userId);
    if (!user) {
      logger.warn('Valid token but user not found', {
        userId: decoded.userId,
        path: req.path
      });
      return res.status(401).json({
        success: false,
        message: 'User associated with this token no longer exists.'
      });
    }
    
    // Attach user to request
    req.user = user;
    req.token = token;
    req.userId = user.id;
    req.userRole = user.role;
    
    logger.debug('Authenticated request', {
      userId: user.id,
      role: user.role,
      path: req.path,
      method: req.method
    });
    
    next();
  } catch (error) {
    // Token verification failed
    let message = 'Authentication failed';
    let status = 401;
    
    if (error.message === 'Token expired') {
      message = 'Session expired. Please login again.';
    } else if (error.message === 'Invalid token') {
      message = 'Invalid token. Please login again.';
    }
    
    logger.warn('Authentication failed', {
      error: error.message,
      path: req.path,
      ip: req.ip
    });
    
    return res.status(status).json({
      success: false,
      message
    });
  }
};

/**
 * Role-based authorization middleware
 * @param {...string} roles - Allowed roles
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    // Ensure user is authenticated first
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    // Check if user role is allowed
    if (!roles.includes(req.user.role)) {
      logger.warn('Authorization failed - insufficient role', {
        userId: req.user.id,
        role: req.user.role,
        requiredRoles: roles,
        path: req.path
      });
      
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions. This action requires one of these roles: ' + roles.join(', ')
      });
    }
    
    next();
  };
};

module.exports = {
  authenticate,
  authorize
};