// backend/tests/admin.test.js
const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/User');
const bcrypt = require('bcrypt');
const { connectTestDB, clearTestDB, closeTestDB } = require('./setup');

describe('Admin Routes API', () => {
    let clientToken;
    let clientId;
    let adminToken;

    beforeAll(async () => {
        await connectTestDB();
    });

    afterAll(async () => {
        await closeTestDB();
    });

    beforeEach(async () => {
        await clearTestDB();

        const clientHash = await bcrypt.hash('ClientPass123!', 10);
        const clientUser = await User.create({
            name: 'Client User',
            email: 'client@example.com',
            passwordHash: clientHash,
            role: 'CLIENT'
        });
        clientId = clientUser.id;

        const adminHash = await bcrypt.hash('AdminPass123!', 10);
        await User.create({
            name: 'Admin User',
            email: 'admin@example.com',
            passwordHash: adminHash,
            role: 'ADMIN'
        });

        const clientLogin = await request(app)
            .post('/api/v1/auth/login')
            .send({ email: 'client@example.com', password: 'ClientPass123!' });
        clientToken = clientLogin.body.data.token;

        const adminLogin = await request(app)
            .post('/api/v1/auth/login')
            .send({ email: 'admin@example.com', password: 'AdminPass123!' });
        adminToken = adminLogin.body.data.token;
    });

    describe('GET /api/v1/admin/users', () => {
        it('should return 401 if no token provided', async () => {
            const response = await request(app).get('/api/v1/admin/users');
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
            expect(response.body.data.users).toBeInstanceOf(Array);
            if (response.body.data.users.length > 0) {
                expect(response.body.data.users[0]).not.toHaveProperty('passwordHash');
            }
        });

        it('should return all users for admin', async () => {
            const response = await request(app)
                .get('/api/v1/admin/users')
                .set('Authorization', `Bearer ${adminToken}`);
            expect(response.body.data.users.length).toBeGreaterThanOrEqual(2);
            const emails = response.body.data.users.map(u => u.email);
            expect(emails).toContain('client@example.com');
            expect(emails).toContain('admin@example.com');
        });

        it('should not return password hashes in user list', async () => {
            const response = await request(app)
                .get('/api/v1/admin/users')
                .set('Authorization', `Bearer ${adminToken}`);
            response.body.data.users.forEach(user => {
                expect(user).not.toHaveProperty('passwordHash');
                expect(user).not.toHaveProperty('password');
            });
        });
    });

    describe('GET /api/v1/admin/users/:id', () => {
        it('should return a single user with related-record counts', async () => {
            const res = await request(app)
                .get(`/api/v1/admin/users/${clientId}`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(200);
            expect(res.body.data.user).toHaveProperty('email', 'client@example.com');
            expect(res.body.data.user).toHaveProperty('gigsCount', 0);
            expect(res.body.data.user).toHaveProperty('bookingsCount', 0);
            expect(res.body.data.user).toHaveProperty('transactionsCount', 0);
        });

        it('should return 404 for a non-existent user', async () => {
            const res = await request(app)
                .get('/api/v1/admin/users/64b64b64b64b64b64b64b64b')
                .set('Authorization', `Bearer ${adminToken}`);
            expect(res.status).toBe(404);
        });

        it('should reject a CLIENT', async () => {
            const res = await request(app)
                .get(`/api/v1/admin/users/${clientId}`)
                .set('Authorization', `Bearer ${clientToken}`);
            expect(res.status).toBe(403);
        });
    });

    describe('PUT /api/v1/admin/users/:id', () => {
        it('should allow an admin to change a CLIENT to FREELANCER', async () => {
            const res = await request(app)
                .put(`/api/v1/admin/users/${clientId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ role: 'FREELANCER' });

            expect(res.status).toBe(200);
            expect(res.body.data.user.role).toBe('FREELANCER');
        });

        it('should reject setting role to ADMIN through this endpoint', async () => {
            const res = await request(app)
                .put(`/api/v1/admin/users/${clientId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ role: 'ADMIN' });

            expect(res.status).toBe(400);
        });

        it('should reject modifying an existing admin account', async () => {
            const usersRes = await request(app)
                .get('/api/v1/admin/users')
                .set('Authorization', `Bearer ${adminToken}`);
            const adminUser = usersRes.body.data.users.find((u) => u.role === 'ADMIN');

            const res = await request(app)
                .put(`/api/v1/admin/users/${adminUser.id}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ name: 'Renamed Admin' });

            expect(res.status).toBe(400);
        });

        it('should reject a CLIENT trying to use this endpoint', async () => {
            const res = await request(app)
                .put(`/api/v1/admin/users/${clientId}`)
                .set('Authorization', `Bearer ${clientToken}`)
                .send({ name: 'Hacked Name' });

            expect(res.status).toBe(403);
        });
    });

    describe('DELETE /api/v1/admin/users/:id', () => {
        it('should allow deleting a user with no gigs or bookings', async () => {
            const res = await request(app)
                .delete(`/api/v1/admin/users/${clientId}`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(200);

            const usersRes = await request(app)
                .get('/api/v1/admin/users')
                .set('Authorization', `Bearer ${adminToken}`);
            const emails = usersRes.body.data.users.map((u) => u.email);
            expect(emails).not.toContain('client@example.com');
        });

        it('should refuse to delete a freelancer who has an existing gig', async () => {
            const freelancerReg = await request(app)
                .post('/api/v1/auth/register')
                .send({
                    name: 'Busy Freelancer',
                    email: 'busy@example.com',
                    password: 'Test123456!',
                    role: 'FREELANCER'
                });
            const freelancerLogin = await request(app)
                .post('/api/v1/auth/login')
                .send({ email: 'busy@example.com', password: 'Test123456!' });

            await request(app)
                .post('/api/v1/gigs')
                .set('Authorization', `Bearer ${freelancerLogin.body.data.token}`)
                .send({
                    title: 'A Gig',
                    description: 'Some work.',
                    category: 'Software',
                    price: 100,
                    depositAmount: 10
                });

            const res = await request(app)
                .delete(`/api/v1/admin/users/${freelancerReg.body.data.id}`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(400);
        });

        it('should reject deleting an admin account through this endpoint', async () => {
            const usersRes = await request(app)
                .get('/api/v1/admin/users')
                .set('Authorization', `Bearer ${adminToken}`);
            const adminUser = usersRes.body.data.users.find((u) => u.role === 'ADMIN');

            const res = await request(app)
                .delete(`/api/v1/admin/users/${adminUser.id}`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(400);
        });
    });

    describe('GET /api/v1/admin/gigs', () => {
        it('should include INACTIVE gigs, unlike the public gig listing', async () => {
            const freelancerReg = await request(app)
                .post('/api/v1/auth/register')
                .send({
                    name: 'A Freelancer',
                    email: 'af@example.com',
                    password: 'Test123456!',
                    role: 'FREELANCER'
                });
            const freelancerLogin = await request(app)
                .post('/api/v1/auth/login')
                .send({ email: 'af@example.com', password: 'Test123456!' });

            const gigRes = await request(app)
                .post('/api/v1/gigs')
                .set('Authorization', `Bearer ${freelancerLogin.body.data.token}`)
                .send({
                    title: 'A Gig',
                    description: 'Some work.',
                    category: 'Software',
                    price: 100,
                    depositAmount: 10
                });

            await request(app)
                .delete(`/api/v1/gigs/${gigRes.body.data.gig.id}`)
                .set('Authorization', `Bearer ${freelancerLogin.body.data.token}`);

            const res = await request(app)
                .get('/api/v1/admin/gigs')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(200);
            expect(res.body.data.gigs).toHaveLength(1);
            expect(res.body.data.gigs[0].status).toBe('INACTIVE');
        });

        it('should reject a CLIENT', async () => {
            const res = await request(app)
                .get('/api/v1/admin/gigs')
                .set('Authorization', `Bearer ${clientToken}`);

            expect(res.status).toBe(403);
        });
    });
});