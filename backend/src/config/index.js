const dotenv = require('dotenv');

//Get started with JSON web tokens. (n.d.). Auth0. Retrieved October 12, 2026, 
// from https://auth0.com/learn/json-web-tokens

// Load environment variables
dotenv.config();

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