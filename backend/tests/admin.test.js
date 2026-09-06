// backend/tests/admin.test.js
const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/User');
const bcrypt = require('bcrypt');

describe('Admin Routes API', () => {
    let clientToken;
    let adminToken;

    beforeEach(async () => {
        // Clear users
        User.deleteAll();

        // Create regular CLIENT user
        const clientHash = await bcrypt.hash('ClientPass123!', 10);
        User.create({
            name: 'Client User',
            email: 'client@example.com',
            passwordHash: clientHash,
            role: 'CLIENT'
        });

        // Create ADMIN user
        const adminHash = await bcrypt.hash('AdminPass123!', 10);
        User.create({
            name: 'Admin User',
            email: 'admin@example.com',
            passwordHash: adminHash,
            role: 'ADMIN'
        });

        // Login as client
        const clientLogin = await request(app)
            .post('/api/v1/auth/login')
            .send({
                email: 'client@example.com',
                password: 'ClientPass123!'
            });
        clientToken = clientLogin.body.data.token;

        // Login as admin
        const adminLogin = await request(app)
            .post('/api/v1/auth/login')
            .send({
                email: 'admin@example.com',
                password: 'AdminPass123!'
            });
        adminToken = adminLogin.body.data.token;
    });

    describe('GET /api/v1/admin/users', () => {
        it('should return 401 if no token provided', async () => {
            const response = await request(app)
                .get('/api/v1/admin/users');
            
            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('Authentication required');
        });

        it('should return 401 if invalid token provided', async () => {
            const response = await request(app)
                .get('/api/v1/admin/users')
                .set('Authorization', 'Bearer invalid.token.here');
            
            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('Invalid token');
        });

        it('should return 403 for CLIENT role (unauthorized)', async () => {
            const response = await request(app)
                .get('/api/v1/admin/users')
                .set('Authorization', `Bearer ${clientToken}`);
            
            expect(response.status).toBe(403);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('Insufficient permissions');
        });

        it('should return 200 for ADMIN role (authorized)', async () => {
            const response = await request(app)
                .get('/api/v1/admin/users')
                .set('Authorization', `Bearer ${adminToken}`);
            
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeInstanceOf(Array);
            
            // Should not contain password hashes
            if (response.body.data.length > 0) {
                expect(response.body.data[0]).not.toHaveProperty('passwordHash');
            }
        });

        it('should return all users for admin', async () => {
            const response = await request(app)
                .get('/api/v1/admin/users')
                .set('Authorization', `Bearer ${adminToken}`);
            
            expect(response.body.data.length).toBeGreaterThanOrEqual(2);
            
            // Check both users exist
            const emails = response.body.data.map(u => u.email);
            expect(emails).toContain('client@example.com');
            expect(emails).toContain('admin@example.com');
        });

        it('should not return password hashes in user list', async () => {
            const response = await request(app)
                .get('/api/v1/admin/users')
                .set('Authorization', `Bearer ${adminToken}`);
            
            response.body.data.forEach(user => {
                expect(user).not.toHaveProperty('passwordHash');
                expect(user).not.toHaveProperty('password');
            });
        });
    });
});