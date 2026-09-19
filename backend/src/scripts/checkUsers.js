const User = require('../models/User');
const { connectDB, disconnectDB } = require('../config/database');

/**
 * Diagnostic script: lists every user currently in the database.
 * Run with: npm run check-users
 *
 * This is a local developer convenience only - it is never part of
 * the running application or exposed via any API route.
 */
async function checkUsers() {
  await connectDB();

  console.log('\n📋 ALL USERS IN SYSTEM:');
  console.log('='.repeat(40));

  const users = await User.findAllUsers();

  if (users.length === 0) {
    console.log('⚠️  No users found!');
  } else {
    users.forEach((user, i) => {
      console.log(`\nUser ${i + 1}:`);
      console.log(`  ID: ${user.id}`);
      console.log(`  Name: ${user.name}`);
      console.log(`  Email: ${user.email}`);
      console.log(`  Role: ${user.role}`);
      console.log(`  PasswordHash exists: ${user.passwordHash ? '✅ YES' : '❌ NO'}`);
    });
  }

  console.log('\n' + '='.repeat(40));

  // Check specifically for the configured admin email, if set
  if (process.env.ADMIN_EMAIL) {
    const admin = await User.findByEmail(process.env.ADMIN_EMAIL);
    if (admin) {
      console.log('\n✅ Admin user found:');
      console.log(`   Role: ${admin.role}`);
      console.log(`   PasswordHash: ${admin.passwordHash ? '✅ Set' : '❌ MISSING'}`);
    } else {
      console.log('\n❌ Admin user NOT found for ADMIN_EMAIL in .env!');
    }
  }

  await disconnectDB();
  process.exit(0);
}

checkUsers().catch(async (err) => {
  console.error('Failed to check users:', err.message);
  await disconnectDB();
  process.exit(1);
});