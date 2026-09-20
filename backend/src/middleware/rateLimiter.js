const rateLimit = require('express-rate-limit');
const config = require('../config');

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

/**
 * Rate limiter for booking creation specifically. Kept separate and
 * stricter than the general auth limiter, since repeated automated
 * booking creation could be used to spam a freelancer's gigs with
 * fake bookings/transactions.
 */
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

module.exports = { authLimiter, bookingLimiter };