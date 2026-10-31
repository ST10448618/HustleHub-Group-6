const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const app = require('./src/app');
const config = require('./src/config');
const logger = require('./src/utils/logger');
const { connectDB, disconnectDB } = require('./src/config/database');

const PORT = config.port;

// Locate SSL certificates
const certPath = path.join(__dirname, 'certificates');
const keyPath = path.join(certPath, 'key.pem');
const certFilePath = path.join(certPath, 'cert.pem');
const certsExist = fs.existsSync(keyPath) && fs.existsSync(certFilePath);

let server;

if (certsExist) {
  const httpsOptions = {
    key: fs.readFileSync(keyPath),
    cert: fs.readFileSync(certFilePath)
  };
  server = https.createServer(httpsOptions, app);
  logger.info('SSL certificates loaded successfully');
} else if (config.nodeEnv === 'production') {
  logger.error('='.repeat(60));
  logger.error('FATAL: SSL certificates not found.');
  logger.error('HustleHub+ must not run over plain HTTP in production.');
  logger.error(`Expected files at: ${keyPath}`);
  logger.error(`               and: ${certFilePath}`);
  logger.error('Generate them with:');
  logger.error('  openssl req -x509 -newkey rsa:2048 -keyout certificates/key.pem -out certificates/cert.pem -days 365 -nodes');
  logger.error('='.repeat(60));
  process.exit(1);
} else {
  logger.warn('='.repeat(60));
  logger.warn('SSL certificates not found. Falling back to HTTP.');
  logger.warn('This is for LOCAL DEVELOPMENT/TESTING ONLY and is not secure.');
  logger.warn('Run: openssl req -x509 -newkey rsa:2048 -keyout certificates/key.pem -out certificates/cert.pem -days 365 -nodes');
  logger.warn('='.repeat(60));
  server = http.createServer(app);
}

async function maybeSeedDevAdmin() {
  if (config.nodeEnv === 'production') {
    return;
  }

  if (process.env.SEED_ADMIN_ON_BOOT !== 'true') {
    return;
  }

  const { ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;
  if (!ADMIN_NAME || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
    logger.warn(
      'SEED_ADMIN_ON_BOOT is true but ADMIN_NAME/ADMIN_EMAIL/ADMIN_PASSWORD ' +
      'are not fully set in .env. Skipping dev admin seed.'
    );
    return;
  }

  const User = require('./src/models/User');
  const bcrypt = require('bcrypt');

  const existingAdmin = await User.findByEmail(ADMIN_EMAIL);
  if (existingAdmin) {
    return;
  }

  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, config.bcryptRounds);
  await User.create({
    name: ADMIN_NAME,
    email: ADMIN_EMAIL,
    passwordHash,
    role: 'ADMIN'
  });

  logger.warn('='.repeat(60));
  logger.warn('DEV-ONLY: Seeded an ADMIN account from environment variables.');
  logger.warn(`DEV-ONLY: Email: ${ADMIN_EMAIL}`);
  logger.warn('DEV-ONLY: This only happens because SEED_ADMIN_ON_BOOT=true.');
  logger.warn('DEV-ONLY: Normal public registration can never create an ADMIN.');
  logger.warn('='.repeat(60));
}

async function start() {
  await connectDB();
  await maybeSeedDevAdmin();

  server.listen(PORT, () => {
    const protocol = server instanceof https.Server ? 'https' : 'http';

    // Structured boot event - the first entry to appear in the cloud logs.
    logger.info('Server started', {
      event: 'SERVER_STARTED',
      port: PORT,
      environment: config.nodeEnv
    });

    logger.info('='.repeat(60));
    logger.info('HUSTLEHUB+ API SERVER');
    logger.info('='.repeat(60));
    logger.info(`Server running at: ${protocol}://localhost:${PORT}`);
    logger.info(`Environment: ${config.nodeEnv}`);
    logger.info(`Health check: ${protocol}://localhost:${PORT}/health`);
    logger.info('='.repeat(60));

    // Log available endpoints
    logger.info('Available endpoints:');
    logger.info('  POST   /api/v1/auth/register  - Register new user');
    logger.info('  POST   /api/v1/auth/login     - Login user');
    logger.info('  GET    /api/v1/auth/me        - Get current user (Protected)');
    logger.info('  GET    /api/v1/admin/users    - List all users (Admin only)');
    logger.info('  GET    /health                - Health check');
    logger.info('='.repeat(60));
  });
}

start();

// Errors that escape every try/catch must still be logged.
process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled promise rejection', {
    event: 'UNHANDLED_REJECTION',
    detail: reason instanceof Error ? reason.message : String(reason),
    stack: reason instanceof Error ? reason.stack : undefined
  });
});

process.on('uncaughtException', async (error) => {
  logger.error('Uncaught exception - shutting down', {
    event: 'UNCAUGHT_EXCEPTION',
    detail: error.message,
    stack: error.stack
  });
  await logger.flush();
  process.exit(1);
});

// Graceful shutdown. Flushing before exit makes sure the last log
// entries reach the cloud logging platform instead of being lost.
function shutdown(signal) {
  logger.info(`${signal} received, shutting down gracefully...`, { event: 'SERVER_SHUTDOWN' });
  server.close(async () => {
    await disconnectDB();
    logger.info('Server closed');
    await logger.flush();
    process.exit(0);
  });
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));