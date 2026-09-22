const rateLimit = require('express-rate-limit');
const config = require('../config');

/**
 * General baseline rate limiter, applied across the entire API.
 * This is deliberately generous - its job is only to bound overall
 * abuse/scraping traffic, not to restrict normal use. The stricter
 * authLimiter and bookingLimiter below layer additional, tighter
 * restriction on top of this for their specific sensitive endpoints.
 */
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

module.exports = { generalLimiter, authLimiter, bookingLimiter };