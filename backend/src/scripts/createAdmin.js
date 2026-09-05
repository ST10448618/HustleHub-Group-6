const bcrypt = require('bcrypt');
const config = require('../config');
const User = require('../models/User');

async function createAdmin() {
    // Check if admin already exists
    const existing = User.findByEmail('admin@example.com');
    if (existing) {
        console.log('Admin already exists:', existing.toSafeObject());
        return;
    }
    
    // Hash password
    const passwordHash = await bcrypt.hash('AdminPass123!', 10);
    
    // Create admin user
    const admin = User.create({
        name: 'Admin User',
        email: 'admin@example.com',
        passwordHash: passwordHash,
        role: 'ADMIN'
    });
    
    console.log('Admin user created successfully!');
    console.log('Admin details:');
    console.log(JSON.stringify(admin.toSafeObject(), null, 2));
}

// Run the script
createAdmin();