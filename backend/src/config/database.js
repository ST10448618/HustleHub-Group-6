const mongoose = require('mongoose');
const config = require('./index');
const logger = require('../utils/logger');

/**
 * Connects to MongoDB using the connection string from config.
 *
 * This is called once, explicitly, from server.js when the real
 * application boots. It is deliberately NOT called from app.js,
 * so that requiring app.js (as our Jest/Supertest tests do) never
 * triggers a real network connection to MongoDB.
 *
 * If the connection fails, this is treated as fatal: the app cannot
 * do anything useful without its database, so we log a clear error
 * and exit rather than starting a server that would fail on every
 * request.
 */
async function connectDB() {
  try {
    await mongoose.connect(config.mongoUri);
    logger.info('MongoDB connected successfully');
  } catch (error) {
    logger.error('FATAL: Failed to connect to MongoDB', {
      message: error.message
    });
    process.exit(1);
  }

  mongoose.connection.on('error', (err) => {
    logger.error('MongoDB connection error', { message: err.message });
  });

  mongoose.connection.on('disconnected', () => {
    logger.warn('MongoDB disconnected');
  });
}

/**
 * Cleanly closes the MongoDB connection. Used during graceful shutdown.
 */
async function disconnectDB() {
  await mongoose.disconnect();
}

module.exports = { connectDB, disconnectDB };