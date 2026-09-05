const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const config = require('./config');
const logger = require('./utils/logger');

// Import routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');

// Import error handler
const { errorHandler } = require('./middleware/errorHandler');

const app = express();

// ====================
// SECURITY MIDDLEWARE
// ====================

// Helmet - sets various security headers
app.use(helmet());

// CORS - restrict to allowed origins
app.use(cors({
  origin: process.env.CLIENT_ORIGIN || 'http://localhost:3000',
  credentials: true,
  optionsSuccessStatus: 200
}));

// Rate limiting - prevent brute force attacks
const limiter = rateLimit({
  windowMs: config.rateLimitWindow,
  max: config.rateLimitMax,
  message: {
    success: false,
    message: 'Too many requests, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
});

// Apply rate limiting to sensitive endpoints
app.use('/api/v1/auth', limiter);

// Body parsing with size limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

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
app.use('/api/v1', userRoutes);

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