const https = require('https');
const fs = require('fs');
const path = require('path');
const app = require('./src/app');
const config = require('./src/config');
const logger = require('./src/utils/logger');

const PORT = config.port;

// Load SSL certificates
let server;

try {
  // Path to certificate files
  const certPath = path.join(__dirname, 'certificates');
  const keyPath = path.join(certPath, 'key.pem');
  const certPathFile = path.join(certPath, 'cert.pem');
  
  // Check if certificates exist
  if (fs.existsSync(keyPath) && fs.existsSync(certPathFile)) {
    const httpsOptions = {
      key: fs.readFileSync(keyPath),
      cert: fs.readFileSync(certPathFile)
    };
    
    // Create HTTPS server
    server = https.createServer(httpsOptions, app);
    
    logger.info('SSL certificates loaded successfully');
  } else {
    logger.warn('SSL certificates not found. Falling back to HTTP.');
    logger.warn('Run: openssl req -x509 -newkey rsa:2048 -keyout certificates/key.pem -out certificates/cert.pem -days 365 -nodes');
    
    // Fallback to HTTP (for development only)
    const http = require('http');
    server = http.createServer(app);
  }
} catch (error) {
  logger.error('Failed to load SSL certificates', { error: error.message });
  // Fallback to HTTP
  const http = require('http');
  server = http.createServer(app);
}

// Start server
server.listen(PORT, () => {
  const protocol = server instanceof https.Server ? 'https' : 'http';
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

  const User = require('./src/models/User');
  const bcrypt = require('bcrypt');
  
  // Check if any users exist
  const existingUsers = User.findAll();
  if (existingUsers.length === 0) {
    console.log('\nNo users found. Creating default admin...');
    
    // Hash password
    bcrypt.hash('AdminPass123!', 10, (err, hash) => {
      if (err) {
        console.error('Failed to hash password:', err);
        return;
      }
      
      // Create admin
      const admin = User.create({
        name: 'Admin User',
        email: 'admin@example.com',
        passwordHash: hash,
        role: 'ADMIN'
      });
      
      console.log('   Default admin created:');
      console.log(`   Email: admin@example.com`);
      console.log(`   Password: AdminPass123!`);
      console.log(`   Role: ADMIN`);
    });
  } else {
    console.log(`\nUsers in system: ${existingUsers.length}`);
  }

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully...');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});