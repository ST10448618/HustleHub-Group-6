// backend/tests/gig.test.js
const request = require('supertest');
const app = require('../src/app');
const { connectTestDB, clearTestDB, closeTestDB } = require('./setup');

describe('Gig API', () => {
    let freelancerToken;
    let freelancerId;
    let secondFreelancerToken;
    let clientToken;
    let adminToken;

    beforeAll(async () => {
        await connectTestDB();
    });

    afterAll(async () => {
        await closeTestDB();
    });

    beforeEach(async () => {
        await clearTestDB();

        // Freelancer A - owns the gigs created in most tests
        const freelancerRes = await request(app)
            .post('/api/v1/auth/register')
            .send({
                name: 'Alex Freelancer',
                email: 'freelancer@example.com',
                password: 'Test123456!',
                role: 'FREELANCER'
            });
        freelancerId = freelancerRes.body.data.id;

        const freelancerLogin = await request(app)
            .post('/api/v1/auth/login')
            .send({ email: 'freelancer@example.com', password: 'Test123456!' });
        freelancerToken = freelancerLogin.body.data.token;

        // Freelancer B - used to prove non-owners can't modify A's gigs
        await request(app)
            .post('/api/v1/auth/register')
            .send({
                name: 'Sam OtherFreelancer',
                email: 'freelancer2@example.com',
                password: 'Test123456!',
                role: 'FREELANCER'
            });
        const secondLogin = await request(app)
            .post('/api/v1/auth/login')
            .send({ email: 'freelancer2@example.com', password: 'Test123456!' });
        secondFreelancerToken = secondLogin.body.data.token;

        // Client
        await request(app)
            .post('/api/v1/auth/register')
            .send({
                name: 'Casey Client',
                email: 'client@example.com',
                password: 'Test123456!',
                role: 'CLIENT'
            });
        const clientLogin = await request(app)
            .post('/api/v1/auth/login')
            .send({ email: 'client@example.com', password: 'Test123456!' });
        clientToken = clientLogin.body.data.token;

        // Admin (registration can never create ADMIN, so create directly)
        const User = require('../src/models/User');
        const bcrypt = require('bcrypt');
        const adminHash = await bcrypt.hash('AdminPass123!', 10);
        await User.create({
            name: 'The Admin',
            email: 'admin@example.com',
            passwordHash: adminHash,
            role: 'ADMIN'
        });
        const adminLogin = await request(app)
            .post('/api/v1/auth/login')
            .send({ email: 'admin@example.com', password: 'AdminPass123!' });
        adminToken = adminLogin.body.data.token;
    });

    const validGigPayload = () => ({
        title: 'Custom Business Website',
        description: 'A fully responsive website built with modern tools.',
        category: 'Software',
        price: 2500,
        depositAmount: 500
    });

    describe('POST /api/v1/gigs', () => {
        it('should allow a FREELANCER to create a gig', async () => {
            const res = await request(app)
                .post('/api/v1/gigs')
                .set('Authorization', `Bearer ${freelancerToken}`)
                .send(validGigPayload());

            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.data.gig).toHaveProperty('id');
            expect(res.body.data.gig.freelancerId).toBe(freelancerId);
            expect(res.body.data.gig.status).toBe('ACTIVE');
            expect(res.body.data.gig.freelancer).toHaveProperty('name', 'Alex Freelancer');
        });

        it('should reject creation from an unauthenticated request', async () => {
            const res = await request(app)
                .post('/api/v1/gigs')
                .send(validGigPayload());

            expect(res.status).toBe(401);
        });

        it('should reject creation from a CLIENT', async () => {
            const res = await request(app)
                .post('/api/v1/gigs')
                .set('Authorization', `Bearer ${clientToken}`)
                .send(validGigPayload());

            expect(res.status).toBe(403);
        });

        it('should reject a missing title', async () => {
            const payload = validGigPayload();
            delete payload.title;

            const res = await request(app)
                .post('/api/v1/gigs')
                .set('Authorization', `Bearer ${freelancerToken}`)
                .send(payload);

            expect(res.status).toBe(400);
            expect(res.body.errors.some((e) => e.field === 'title')).toBe(true);
        });

        it('should reject an invalid category', async () => {
            const payload = { ...validGigPayload(), category: 'NotARealCategory' };

            const res = await request(app)
                .post('/api/v1/gigs')
                .set('Authorization', `Bearer ${freelancerToken}`)
                .send(payload);

            expect(res.status).toBe(400);
            expect(res.body.errors.some((e) => e.field === 'category')).toBe(true);
        });

        it('should reject a price of 0 or below', async () => {
            const payload = { ...validGigPayload(), price: 0 };

            const res = await request(app)
                .post('/api/v1/gigs')
                .set('Authorization', `Bearer ${freelancerToken}`)
                .send(payload);

            expect(res.status).toBe(400);
            expect(res.body.errors.some((e) => e.field === 'price')).toBe(true);
        });

        it('should reject a deposit greater than the price', async () => {
            const payload = { ...validGigPayload(), price: 100, depositAmount: 200 };

            const res = await request(app)
                .post('/api/v1/gigs')
                .set('Authorization', `Bearer ${freelancerToken}`)
                .send(payload);

            expect(res.status).toBe(400);
            expect(res.body.errors.some((e) => e.field === 'depositAmount')).toBe(true);
        });
    });

    describe('GET /api/v1/gigs (public marketplace)', () => {
        it('should list ACTIVE gigs without requiring authentication', async () => {
            await request(app)
                .post('/api/v1/gigs')
                .set('Authorization', `Bearer ${freelancerToken}`)
                .send(validGigPayload());

            const res = await request(app).get('/api/v1/gigs');

            expect(res.status).toBe(200);
            expect(res.body.data.gigs).toHaveLength(1);
        });

        it('should filter by category', async () => {
            await request(app)
                .post('/api/v1/gigs')
                .set('Authorization', `Bearer ${freelancerToken}`)
                .send(validGigPayload());
            await request(app)
                .post('/api/v1/gigs')
                .set('Authorization', `Bearer ${freelancerToken}`)
                .send({ ...validGigPayload(), title: 'Logo Design', category: 'Design' });

            const res = await request(app).get('/api/v1/gigs?category=Design');

            expect(res.status).toBe(200);
            expect(res.body.data.gigs).toHaveLength(1);
            expect(res.body.data.gigs[0].category).toBe('Design');
        });

        it('should not include an INACTIVE (deleted) gig in public listing', async () => {
            const created = await request(app)
                .post('/api/v1/gigs')
                .set('Authorization', `Bearer ${freelancerToken}`)
                .send(validGigPayload());
            const gigId = created.body.data.gig.id;

            await request(app)
                .delete(`/api/v1/gigs/${gigId}`)
                .set('Authorization', `Bearer ${freelancerToken}`);

            const res = await request(app).get('/api/v1/gigs');

            expect(res.status).toBe(200);
            expect(res.body.data.gigs).toHaveLength(0);
        });
    });

    describe('GET /api/v1/gigs?mine=true', () => {
        it('should require authentication', async () => {
            const res = await request(app).get('/api/v1/gigs?mine=true');
            expect(res.status).toBe(401);
        });

        it('should reject a CLIENT', async () => {
            const res = await request(app)
                .get('/api/v1/gigs?mine=true')
                .set('Authorization', `Bearer ${clientToken}`);
            expect(res.status).toBe(403);
        });

        it('should return only the requesting freelancer\'s own gigs, including INACTIVE ones', async () => {
            const created = await request(app)
                .post('/api/v1/gigs')
                .set('Authorization', `Bearer ${freelancerToken}`)
                .send(validGigPayload());
            await request(app)
                .delete(`/api/v1/gigs/${created.body.data.gig.id}`)
                .set('Authorization', `Bearer ${freelancerToken}`);

            // A gig belonging to the OTHER freelancer must not appear
            await request(app)
                .post('/api/v1/gigs')
                .set('Authorization', `Bearer ${secondFreelancerToken}`)
                .send(validGigPayload());

            const res = await request(app)
                .get('/api/v1/gigs?mine=true')
                .set('Authorization', `Bearer ${freelancerToken}`);

            expect(res.status).toBe(200);
            expect(res.body.data.gigs).toHaveLength(1);
            expect(res.body.data.gigs[0].status).toBe('INACTIVE');
        });
    });

    describe('GET /api/v1/gigs/:id', () => {
        it('should return a single gig by id', async () => {
            const created = await request(app)
                .post('/api/v1/gigs')
                .set('Authorization', `Bearer ${freelancerToken}`)
                .send(validGigPayload());

            const res = await request(app).get(`/api/v1/gigs/${created.body.data.gig.id}`);

            expect(res.status).toBe(200);
            expect(res.body.data.gig.title).toBe(validGigPayload().title);
        });

        it('should return 404 for a non-existent (but validly formatted) id', async () => {
            const res = await request(app).get('/api/v1/gigs/64b64b64b64b64b64b64b64b');
            expect(res.status).toBe(404);
        });

        it('should return 400 for a malformed id', async () => {
            const res = await request(app).get('/api/v1/gigs/not-a-valid-id');
            expect(res.status).toBe(400);
        });
    });

    describe('PUT /api/v1/gigs/:id', () => {
        it('should allow the owning freelancer to update their gig', async () => {
            const created = await request(app)
                .post('/api/v1/gigs')
                .set('Authorization', `Bearer ${freelancerToken}`)
                .send(validGigPayload());

            const res = await request(app)
                .put(`/api/v1/gigs/${created.body.data.gig.id}`)
                .set('Authorization', `Bearer ${freelancerToken}`)
                .send({ price: 3000 });

            expect(res.status).toBe(200);
            expect(res.body.data.gig.price).toBe(3000);
        });

        it('should reject an update from a non-owning freelancer', async () => {
            const created = await request(app)
                .post('/api/v1/gigs')
                .set('Authorization', `Bearer ${freelancerToken}`)
                .send(validGigPayload());

            const res = await request(app)
                .put(`/api/v1/gigs/${created.body.data.gig.id}`)
                .set('Authorization', `Bearer ${secondFreelancerToken}`)
                .send({ price: 999 });

            expect(res.status).toBe(403);
        });

        it('should allow an admin to update any gig', async () => {
            const created = await request(app)
                .post('/api/v1/gigs')
                .set('Authorization', `Bearer ${freelancerToken}`)
                .send(validGigPayload());

            const res = await request(app)
                .put(`/api/v1/gigs/${created.body.data.gig.id}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ price: 4000 });

            expect(res.status).toBe(200);
            expect(res.body.data.gig.price).toBe(4000);
        });

        it('should reject an update that would push deposit above the (unchanged) price', async () => {
            const created = await request(app)
                .post('/api/v1/gigs')
                .set('Authorization', `Bearer ${freelancerToken}`)
                .send(validGigPayload()); // price 2500, deposit 500

            const res = await request(app)
                .put(`/api/v1/gigs/${created.body.data.gig.id}`)
                .set('Authorization', `Bearer ${freelancerToken}`)
                .send({ depositAmount: 3000 });

            expect(res.status).toBe(400);
        });
    });

    describe('DELETE /api/v1/gigs/:id', () => {
        it('should allow the owning freelancer to delete (deactivate) their gig', async () => {
            const created = await request(app)
                .post('/api/v1/gigs')
                .set('Authorization', `Bearer ${freelancerToken}`)
                .send(validGigPayload());

            const res = await request(app)
                .delete(`/api/v1/gigs/${created.body.data.gig.id}`)
                .set('Authorization', `Bearer ${freelancerToken}`);

            expect(res.status).toBe(200);
            expect(res.body.data.gig.status).toBe('INACTIVE');
        });

        it('should reject deletion from a non-owning freelancer', async () => {
            const created = await request(app)
                .post('/api/v1/gigs')
                .set('Authorization', `Bearer ${freelancerToken}`)
                .send(validGigPayload());

            const res = await request(app)
                .delete(`/api/v1/gigs/${created.body.data.gig.id}`)
                .set('Authorization', `Bearer ${secondFreelancerToken}`);

            expect(res.status).toBe(403);
        });

        it('should reject deletion from a CLIENT', async () => {
            const created = await request(app)
                .post('/api/v1/gigs')
                .set('Authorization', `Bearer ${freelancerToken}`)
                .send(validGigPayload());

            const res = await request(app)
                .delete(`/api/v1/gigs/${created.body.data.gig.id}`)
                .set('Authorization', `Bearer ${clientToken}`);

            expect(res.status).toBe(403);
        });
    });
});