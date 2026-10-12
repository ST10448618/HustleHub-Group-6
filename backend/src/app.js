const express = require('express'); //OpenJS Foundation. (2017). Express - node.Js web application framework. Expressjs.Com. https://expressjs.com/
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

//Mozilla. (2025, March 13). Content security policy (CSP) - HTTP | MDN. MDN Web Docs. 
// https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CSP

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
// unrelated test failures.
if (process.env.NODE_ENV !== 'test') {
  app.use(generalLimiter);
  app.use('/api/v1/auth', authLimiter);
}

// Body parsing with size limits.
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