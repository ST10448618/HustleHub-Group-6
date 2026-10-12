const rateLimit = require('express-rate-limit');
const config = require('../config');

const generalLimiter = rateLimit({
  windowMs: config.rateLimitWindow,
  max: 300, // 300 requests per 15 minutes per IP, across the whole API
  message: {
    success: false,
    message: 'Too many requests, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Rate limiter for authentication endpoints (register/login).
 * Protects against brute-force credential guessing and registration
 * spam.
 */
const authLimiter = rateLimit({
  windowMs: config.rateLimitWindow,
  max: config.rateLimitMax,
  message: {
    success: false,
    message: 'Too many requests, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false
});

const bookingLimiter = rateLimit({
  windowMs: config.rateLimitWindow,
  max: 30, // 30 booking attempts per 15 minutes per IP
  message: {
    success: false,
    message: 'Too many booking attempts, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

module.exports = { generalLimiter, authLimiter, bookingLimiter };