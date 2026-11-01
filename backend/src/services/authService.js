const crypto = require('crypto');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const config = require('../config');
const User = require('../models/User');
const RevokedToken = require('../models/RevokedToken');
const logger = require('../utils/logger');
const ApiError = require('../utils/ApiError');

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
      event: 'USER_REGISTERED',
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
      logger.warn('Login attempt with non-existent email', {
        event: 'LOGIN_FAILED',
        reason: 'unknown_email',
        email
      });
      throw new Error('Invalid email or password');
    }

    // Brute-force protection: while the account is locked, refuse BEFORE
    // looking at the password. Checking the password first would let an
    // attacker keep guessing and learn when they hit the right one.
    if (user.isLocked()) {
      const minutesLeft = Math.max(
        1,
        Math.ceil((user.lockUntil.getTime() - Date.now()) / 60000)
      );
      logger.warn('Login blocked: account is temporarily locked', {
        event: 'LOGIN_BLOCKED',
        userId: user.id,
        email,
        minutesLeft
      });
      throw new ApiError(
        423,
        `Too many failed login attempts. This account is locked for another ${minutesLeft} minute${minutesLeft === 1 ? '' : 's'}.`
      );
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      logger.warn('Login attempt with invalid password', {
        event: 'LOGIN_FAILED',
        reason: 'invalid_password',
        email
      });
      await AuthService.recordFailedLogin(user);
      throw new Error('Invalid email or password');
    }

    await AuthService.clearFailedLogins(user);

    const token = jwt.sign(
      {
        id: user.id,
        role: user.role
      },
      config.jwtSecret,
      {
        expiresIn: config.jwtExpire,
        // Unique token id ("jti"): lets a single token be revoked on logout.
        jwtid: crypto.randomUUID()
      }
    );

    logger.info('User logged in successfully', {
      event: 'LOGIN_SUCCESS',
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
   * Counts a failed login and locks the account when the limit is hit.
   * Uses atomic database updates ($inc), so concurrent failed attempts
   * cannot overwrite each other's count.
   */
  static async recordFailedLogin(user) {
    const now = new Date();

    // A lock that has already expired starts the count again from zero.
    await User.updateOne(
      { _id: user._id, lockUntil: { $lte: now } },
      { $set: { failedLoginAttempts: 0, lockUntil: null } }
    );

    const updated = await User.findOneAndUpdate(
      { _id: user._id },
      { $inc: { failedLoginAttempts: 1 } },
      { new: true }
    );

    if (updated && updated.failedLoginAttempts >= config.maxFailedLogins) {
      const lockUntil = new Date(now.getTime() + config.lockoutMinutes * 60 * 1000);
      await User.updateOne({ _id: user._id }, { $set: { lockUntil } });

      logger.warn('Account locked after repeated failed logins', {
        event: 'ACCOUNT_LOCKED',
        userId: user.id,
        email: user.email,
        attempts: updated.failedLoginAttempts,
        lockMinutes: config.lockoutMinutes
      });
    }
  }

  /**
   * A successful login clears the failed-attempt counter and any
   * expired lock. Skips the database write when there is nothing to clear.
   */
  static async clearFailedLogins(user) {
    if (user.failedLoginAttempts > 0 || user.lockUntil) {
      await User.updateOne(
        { _id: user._id },
        { $set: { failedLoginAttempts: 0, lockUntil: null } }
      );
    }
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
   * Logout: add the token's id to the denylist until it would have
   * expired anyway. Idempotent. Tokens issued before this feature have
   * no jti and cannot be tracked individually - they simply expire.
   */
  static async revokeToken(decoded) {
    if (!decoded || !decoded.jti) {
      return;
    }

    await RevokedToken.updateOne(
      { jti: decoded.jti },
      {
        $setOnInsert: {
          userId: decoded.id,
          expiresAt: new Date(decoded.exp * 1000)
        }
      },
      { upsert: true }
    );
  }

  /**
   * True when this token id has been logged out.
   */
  static async isTokenRevoked(jti) {
    if (!jti) {
      return false;
    }
    return Boolean(await RevokedToken.exists({ jti }));
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