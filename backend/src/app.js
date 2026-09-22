const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const config = require('./config');
const logger = require('./utils/logger');

// Import routes
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const gigRoutes = require('./routes/gigRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const incomeRoutes = require('./routes/incomeRoutes');

// Import error handler
const { errorHandler } = require('./middleware/errorHandler');
const { generalLimiter, authLimiter } = require('./middleware/rateLimiter');

const app = express();

// ====================
// SECURITY MIDDLEWARE
// ====================

// Helmet - sets various security headers.
// CSP is configured explicitly rather than left as an unexplained
// default: this server is a pure JSON API. It never serves HTML, CSS,
// JavaScript, or images of its own, so there is nothing a browser
// should ever be allowed to load "from" this API. default-src 'none'
// is therefore both the strictest AND the correct policy here - it
// isn't a compromise, since a JSON API has no legitimate resources to
// permit in the first place. frame-ancestors 'none' additionally
// blocks this API from ever being embedded in an iframe anywhere
// (defence against clickjacking-style attacks). Helmet's other
// defaults (X-Content-Type-Options: nosniff, X-Frame-Options: DENY,
// Strict-Transport-Security, hiding X-Powered-By, etc.) remain active
// alongside this - passing contentSecurityPolicy here only overrides
// that one directive set, not the rest of Helmet's protections.
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'none'"],
        frameAncestors: ["'none'"]
      }
    },
    referrerPolicy: { policy: 'no-referrer' },
    crossOriginResourcePolicy: { policy: 'same-origin' }
  })
);

// CORS - restrict to allowed origins
app.use(cors({
  origin: process.env.CLIENT_ORIGIN || 'http://localhost:3000',
  credentials: true,
  optionsSuccessStatus: 200
}));

// Rate limiting.
// generalLimiter applies a generous baseline across the entire API.
// authLimiter and bookingLimiter (the latter applied directly in
// bookingRoutes.js) then layer stricter limits on top for their
// specific sensitive endpoints - this is defence in depth, not a
// replacement for one another.
// Skipped in the test environment: the automated suite makes many
// calls per run and would otherwise trip these limiters, causing
// unrelated test failures.
if (process.env.NODE_ENV !== 'test') {
  app.use(generalLimiter);
  app.use('/api/v1/auth', authLimiter);
}

// Body parsing with size limits.
// This API only ever handles small JSON payloads (text fields, IDs,
// numbers, dates) - there are no file uploads. 100kb is generous for
// every real payload in this app while meaningfully bounding the
// attack surface a 10mb limit would otherwise leave open.
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));

// ====================
// LOGGING MIDDLEWARE
// ====================

// Request logging
app.use((req, res, next) => {
  logger.debug('Incoming request', {
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.get('user-agent')
  });
  next();
});

// ====================
// API ROUTES
// ====================

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'HustleHub+ API is running',
    environment: config.nodeEnv
  });
});

// API v1 routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/gigs', gigRoutes);
app.use('/api/v1/bookings', bookingRoutes);
app.use('/api/v1/transactions', transactionRoutes);
app.use('/api/v1/income', incomeRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.path} not found`
  });
});

// ====================
// ERROR HANDLING
// ====================

// Global error handler
app.use(errorHandler);

module.exports = app;