const bcrypt = require('bcrypt');
const config = require('../config');
const User = require('../models/User');
const { connectDB, disconnectDB } = require('../config/database');

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
 * As of Phase B3, this creates a real, persistent admin user in your
 * MongoDB Atlas database - it connects to the same database your
 * running server uses, so the admin account it creates is immediately
 * usable for login against "npm run dev".
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

  await connectDB();

  const existing = await User.findByEmail(email);
  if (existing) {
    console.log('A user with this email already exists:');
    console.log(JSON.stringify(existing.toSafeObject(), null, 2));
    await disconnectDB();
    process.exit(0);
  }

  const passwordHash = await bcrypt.hash(password, config.bcryptRounds);

  const admin = await User.create({
    name,
    email,
    passwordHash,
    role: 'ADMIN'
  });

  console.log('Admin user created successfully!');
  console.log(JSON.stringify(admin.toSafeObject(), null, 2));

  await disconnectDB();
  process.exit(0);
}

createAdmin().catch(async (err) => {
  console.error('Failed to create admin:', err.message);
  await disconnectDB();
  process.exit(1);
});