const bcrypt = require('bcrypt');
const config = require('../config');
const User = require('../models/User');

/**
 * Controlled admin creation script.
 *
 * Run with: npm run create-admin
 *
 * Credentials come from ADMIN_NAME, ADMIN_EMAIL and ADMIN_PASSWORD in
 * your .env file - never hardcoded in source. Normal public registration
 * (POST /api/v1/auth/register) can never create an ADMIN account; this
 * script is the only deliberate way to create one.
 *
 * NOTE: while user storage is in-memory (Part 1/2 transition), this
 * script runs in its own process and its result does not persist into
 * a separately-running "npm run dev" server. For local testing right
 * now, use SEED_ADMIN_ON_BOOT=true in .env instead (see server.js).
 * Once MongoDB is introduced, this script will create a real, persistent
 * admin account that the running server can authenticate.
 */
async function createAdmin() {
  const name = process.env.ADMIN_NAME;
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!name || !email || !password) {
    console.error(
      'ADMIN_NAME, ADMIN_EMAIL and ADMIN_PASSWORD must all be set in your ' +
      '.env file before running this script.'
    );
    process.exit(1);
  }

  const existing = User.findByEmail(email);
  if (existing) {
    console.log('A user with this email already exists:');
    console.log(JSON.stringify(existing.toSafeObject(), null, 2));
    process.exit(0);
  }

  const passwordHash = await bcrypt.hash(password, config.bcryptRounds);

  const admin = User.create({
    name,
    email,
    passwordHash,
    role: 'ADMIN'
  });

  console.log('Admin user created successfully!');
  console.log(JSON.stringify(admin.toSafeObject(), null, 2));
  process.exit(0);
}

createAdmin().catch((err) => {
  console.error('Failed to create admin:', err.message);
  process.exit(1);
});