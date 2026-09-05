const config = require('../config');

console.log('\n📋 ALL USERS IN SYSTEM:');
console.log('='.repeat(40));

const users = config.tempStorage.users;

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
        console.log(`  PasswordHash preview: ${user.passwordHash ? user.passwordHash.substring(0, 30) + '...' : 'NONE'}`);
    });
}

console.log('\n' + '='.repeat(40));

// Check specifically for admin
const admin = users.find(u => u.email === 'admin@example.com');
if (admin) {
    console.log('\n✅ Admin user found:');
    console.log(`   Role: ${admin.role}`);
    console.log(`   PasswordHash: ${admin.passwordHash ? '✅ Set' : '❌ MISSING'}`);
} else {
    console.log('\n❌ Admin user NOT found!');
}