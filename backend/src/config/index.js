const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

/**
 * Validates required environment configuration at startup.
 * The application must fail fast and loudly if critical security
 * configuration is missing, rather than running in a silently
 * insecure state (e.g. signing JWTs with an empty/undefined secret).
 */
function validateEnv() {
  const errors = [];

  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.trim().length < 16) {
    errors.push(
      'JWT_SECRET is missing or too short (minimum 16 characters). ' +
      'Set a strong, random secret in your .env file before starting the server.'
    );
  }

  if (process.env.PORT && Number.isNaN(parseInt(process.env.PORT, 10))) {
    errors.push('PORT must be a valid number if provided in .env.');
  }

  // MONGODB_URI is required for the real running app, but not for
  // automated tests: tests use an isolated in-memory database instead
  // (introduced in Phase B3) and must never depend on a real Atlas
  // connection to run.
  if (process.env.NODE_ENV !== 'test' && !process.env.MONGODB_URI) {
    errors.push(
      'MONGODB_URI is missing. Set your MongoDB Atlas connection string in .env.'
    );
  }

  if (errors.length > 0) {
    // eslint-disable-next-line no-console
    console.error('FATAL: Invalid environment configuration:');
    errors.forEach((err) => console.error(`  - ${err}`));
    console.error('Server startup aborted.');
    process.exit(1);
  }
}

validateEnv();

module.exports = {
  // Server
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',

  // JWT
  jwtSecret: process.env.JWT_SECRET,
  jwtExpire: process.env.JWT_EXPIRE || '7d',

  // Security
  bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS, 10) || 10,

  // Rate limiting
  rateLimitWindow: 15 * 60 * 1000, // 15 minutes
  rateLimitMax: 100, // 100 requests per window

  // CORS
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:3000',

  // Database
  mongoUri: process.env.MONGODB_URI
};