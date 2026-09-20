const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const config = require('../config');
const User = require('../models/User');
const logger = require('../utils/logger');
const ApiError = require('../utils/ApiError');

// The only roles a person may select for themselves at registration.
// ADMIN is deliberately excluded - it can only be created through the
// controlled create-admin script (see scripts/createAdmin.js).
const SELF_REGISTERABLE_ROLES = ['CLIENT', 'FREELANCER'];

class AuthService {
  /**
   * Register a new user
   */
  static async register(userData) {
    const { name, email, password, role } = userData;

    // Default to CLIENT if no role was sent at all.
    const requestedRole = role || 'CLIENT';

    if (!SELF_REGISTERABLE_ROLES.includes(requestedRole)) {
      logger.warn('Registration attempt with disallowed role', {
        email,
        requestedRole
      });
      throw new ApiError(
        400,
        `Invalid role. You may register as one of: ${SELF_REGISTERABLE_ROLES.join(', ')}`
      );
    }

    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      logger.warn('Registration attempt with existing email', { email });
      throw new Error('Email already registered');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, config.bcryptRounds);

    // Create user
    const user = await User.create({
      name,
      email,
      passwordHash,
      role: requestedRole
    });

    logger.info('User registered successfully', {
      userId: user.id,
      email: user.email,
      role: user.role
    });

    return user.toSafeObject();
  }

  /**
   * Login user and generate JWT
   */
  static async login(email, password) {
    // Find user by email
    const user = await User.findByEmail(email);
    if (!user) {
      logger.warn('Login attempt with non-existent email', { email });
      throw new Error('Invalid email or password');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      logger.warn('Login attempt with invalid password', { email });
      throw new Error('Invalid email or password');
    }

    // Generate JWT
    // Payload is intentionally minimal: only what's needed to identify
    // the authenticated user and check their role. Email and other
    // personal information are never placed inside the token.
    const token = jwt.sign(
      {
        id: user.id,
        role: user.role
      },
      config.jwtSecret,
      { expiresIn: config.jwtExpire }
    );

    logger.info('User logged in successfully', {
      userId: user.id,
      email: user.email,
      role: user.role
    });

    return {
      token,
      user: user.toSafeObject()
    };
  }

  /**
   * Verify JWT token
   */
  static verifyToken(token) {
    try {
      const decoded = jwt.verify(token, config.jwtSecret);
      return decoded;
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new Error('Token expired');
      }
      if (error.name === 'JsonWebTokenError') {
        throw new Error('Invalid token');
      }
      throw error;
    }
  }

  /**
   * Get user by ID (used by middleware)
   */
  static async getUserById(id) {
    const user = await User.findByIdSafe(id);
    if (!user) return null;
    return user.toSafeObject();
  }
}

module.exports = AuthService;