// backend/tests/booking.test.js
const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/User');
const bcrypt = require('bcrypt');
const { connectTestDB, clearTestDB, closeTestDB } = require('./setup');

describe('Booking + Transaction API', () => {
    let freelancerToken;
    let freelancerId;
    let clientToken;
    let clientId;
    let secondClientToken;
    let adminToken;
    let gigId; // ACTIVE gig, price 2500, deposit 500
    let inactiveGigId;

    beforeAll(async () => {
        await connectTestDB();
    });

    afterAll(async () => {
        await closeTestDB();
    });

    function todayISO() {
        return new Date().toISOString().split('T')[0];
    }

    function futureISO() {
        const d = new Date();
        d.setFullYear(d.getFullYear() + 1);
        return d.toISOString().split('T')[0];
    }

    beforeEach(async () => {
        await clearTestDB();

        // Freelancer
        const freelancerReg = await request(app)
            .post('/api/v1/auth/register')
            .send({
                name: 'Alex Freelancer',
                email: 'freelancer@example.com',
                password: 'Test123456!',
                role: 'FREELANCER'
            });
        freelancerId = freelancerReg.body.data.id;
        const freelancerLogin = await request(app)
            .post('/api/v1/auth/login')
            .send({ email: 'freelancer@example.com', password: 'Test123456!' });
        freelancerToken = freelancerLogin.body.data.token;

        // Client A
        const clientReg = await request(app)
            .post('/api/v1/auth/register')
            .send({
                name: 'Casey Client',
                email: 'client@example.com',
                password: 'Test123456!',
                role: 'CLIENT'
            });
        clientId = clientReg.body.data.id;
        const clientLogin = await request(app)
            .post('/api/v1/auth/login')
            .send({ email: 'client@example.com', password: 'Test123456!' });
        clientToken = clientLogin.body.data.token;

        // Client B (used to prove non-participants can't see/cancel A's booking)
        await request(app)
            .post('/api/v1/auth/register')
            .send({
                name: 'Jordan OtherClient',
                email: 'client2@example.com',
                password: 'Test123456!',
                role: 'CLIENT'
            });
        const secondClientLogin = await request(app)
            .post('/api/v1/auth/login')
            .send({ email: 'client2@example.com', password: 'Test123456!' });
        secondClientToken = secondClientLogin.body.data.token;

        // Admin
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

        // An ACTIVE gig owned by the freelancer
        const gigRes = await request(app)
            .post('/api/v1/gigs')
            .set('Authorization', `Bearer ${freelancerToken}`)
            .send({
                title: 'Custom Website',
                description: 'A fully responsive website.',
                category: 'Software',
                price: 2500,
                depositAmount: 500
            });
        gigId = gigRes.body.data.gig.id;

        // An INACTIVE gig (created then deleted) to test un-bookable gigs
        const inactiveGigRes = await request(app)
            .post('/api/v1/gigs')
            .set('Authorization', `Bearer ${freelancerToken}`)
            .send({
                title: 'Old Gig',
                description: 'No longer offered.',
                category: 'Design',
                price: 1000,
                depositAmount: 100
            });
        inactiveGigId = inactiveGigRes.body.data.gig.id;
        await request(app)
            .delete(`/api/v1/gigs/${inactiveGigId}`)
            .set('Authorization', `Bearer ${freelancerToken}`);
    });

    describe('POST /api/v1/bookings', () => {
        it('should create a booking and its deposit transaction', async () => {
            const res = await request(app)
                .post('/api/v1/bookings')
                .set('Authorization', `Bearer ${clientToken}`)
                .send({ gigId, bookingDate: futureISO() });

            expect(res.status).toBe(201);
            expect(res.body.data.booking.amount).toBe(2500);
            expect(res.body.data.booking.depositAmount).toBe(500);
            expect(res.body.data.booking.remainingAmount).toBe(2000);
            expect(res.body.data.booking.status).toBe('CONFIRMED');
            expect(res.body.data.booking.clientId).toBe(clientId);
            expect(res.body.data.booking.freelancerId).toBe(freelancerId);

            // Verify the deposit transaction was actually created
            const txRes = await request(app)
                .get('/api/v1/transactions')
                .set('Authorization', `Bearer ${clientToken}`);
            expect(txRes.body.data.transactions).toHaveLength(1);
            expect(txRes.body.data.transactions[0].type).toBe('DEPOSIT');
            expect(txRes.body.data.transactions[0].amount).toBe(500);
            expect(txRes.body.data.transactions[0].status).toBe('PAID');
        });

        it('should allow the same client to book the same gig multiple times', async () => {
            await request(app)
                .post('/api/v1/bookings')
                .set('Authorization', `Bearer ${clientToken}`)
                .send({ gigId, bookingDate: futureISO() });

            const res = await request(app)
                .post('/api/v1/bookings')
                .set('Authorization', `Bearer ${clientToken}`)
                .send({ gigId, bookingDate: futureISO() });

            expect(res.status).toBe(201);
        });

        it('should reject an unauthenticated request', async () => {
            const res = await request(app)
                .post('/api/v1/bookings')
                .send({ gigId, bookingDate: futureISO() });
            expect(res.status).toBe(401);
        });

        it('should reject a FREELANCER trying to book', async () => {
            const res = await request(app)
                .post('/api/v1/bookings')
                .set('Authorization', `Bearer ${freelancerToken}`)
                .send({ gigId, bookingDate: futureISO() });
            expect(res.status).toBe(403);
        });

        it('should reject an invalid gigId', async () => {
            const res = await request(app)
                .post('/api/v1/bookings')
                .set('Authorization', `Bearer ${clientToken}`)
                .send({ gigId: 'not-a-real-id', bookingDate: futureISO() });
            expect(res.status).toBe(400);
        });

        it('should reject a non-existent (but validly formatted) gigId', async () => {
            const res = await request(app)
                .post('/api/v1/bookings')
                .set('Authorization', `Bearer ${clientToken}`)
                .send({ gigId: '64b64b64b64b64b64b64b64b', bookingDate: futureISO() });
            expect(res.status).toBe(404);
        });

        it('should reject a booking date in the past', async () => {
            const res = await request(app)
                .post('/api/v1/bookings')
                .set('Authorization', `Bearer ${clientToken}`)
                .send({ gigId, bookingDate: '2000-01-01' });
            expect(res.status).toBe(400);
        });

        it('should reject booking an INACTIVE gig', async () => {
            const res = await request(app)
                .post('/api/v1/bookings')
                .set('Authorization', `Bearer ${clientToken}`)
                .send({ gigId: inactiveGigId, bookingDate: futureISO() });
            expect(res.status).toBe(400);
        });
    });

    describe('GET /api/v1/bookings (role-scoped)', () => {
        it("should return only the client's own bookings", async () => {
            await request(app)
                .post('/api/v1/bookings')
                .set('Authorization', `Bearer ${clientToken}`)
                .send({ gigId, bookingDate: futureISO() });

            const res = await request(app)
                .get('/api/v1/bookings')
                .set('Authorization', `Bearer ${secondClientToken}`);

            expect(res.status).toBe(200);
            expect(res.body.data.bookings).toHaveLength(0);
        });

        it("should return bookings made on the freelancer's gigs", async () => {
            await request(app)
                .post('/api/v1/bookings')
                .set('Authorization', `Bearer ${clientToken}`)
                .send({ gigId, bookingDate: futureISO() });

            const res = await request(app)
                .get('/api/v1/bookings')
                .set('Authorization', `Bearer ${freelancerToken}`);

            expect(res.status).toBe(200);
            expect(res.body.data.bookings).toHaveLength(1);
        });

        it('should return every booking for an admin', async () => {
            await request(app)
                .post('/api/v1/bookings')
                .set('Authorization', `Bearer ${clientToken}`)
                .send({ gigId, bookingDate: futureISO() });

            const res = await request(app)
                .get('/api/v1/bookings')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(200);
            expect(res.body.data.bookings).toHaveLength(1);
        });
    });

    describe('GET /api/v1/bookings/:id', () => {
        it('should reject access from an unrelated client', async () => {
            const created = await request(app)
                .post('/api/v1/bookings')
                .set('Authorization', `Bearer ${clientToken}`)
                .send({ gigId, bookingDate: futureISO() });

            const res = await request(app)
                .get(`/api/v1/bookings/${created.body.data.booking.id}`)
                .set('Authorization', `Bearer ${secondClientToken}`);

            expect(res.status).toBe(403);
        });
    });

    describe('PATCH /api/v1/bookings/:id/cancel', () => {
        it('should allow the owning client to cancel', async () => {
            const created = await request(app)
                .post('/api/v1/bookings')
                .set('Authorization', `Bearer ${clientToken}`)
                .send({ gigId, bookingDate: futureISO() });

            const res = await request(app)
                .patch(`/api/v1/bookings/${created.body.data.booking.id}/cancel`)
                .set('Authorization', `Bearer ${clientToken}`);

            expect(res.status).toBe(200);
            expect(res.body.data.booking.status).toBe('CANCELLED');
        });

        it('should retain the deposit transaction after cancellation', async () => {
            const created = await request(app)
                .post('/api/v1/bookings')
                .set('Authorization', `Bearer ${clientToken}`)
                .send({ gigId, bookingDate: futureISO() });

            await request(app)
                .patch(`/api/v1/bookings/${created.body.data.booking.id}/cancel`)
                .set('Authorization', `Bearer ${clientToken}`);

            const txRes = await request(app)
                .get('/api/v1/transactions')
                .set('Authorization', `Bearer ${clientToken}`);

            expect(txRes.body.data.transactions).toHaveLength(1);
            expect(txRes.body.data.transactions[0].status).toBe('PAID');
        });

        it('should reject cancellation from a non-owning client', async () => {
            const created = await request(app)
                .post('/api/v1/bookings')
                .set('Authorization', `Bearer ${clientToken}`)
                .send({ gigId, bookingDate: futureISO() });

            const res = await request(app)
                .patch(`/api/v1/bookings/${created.body.data.booking.id}/cancel`)
                .set('Authorization', `Bearer ${secondClientToken}`);

            expect(res.status).toBe(403);
        });

        it('should reject cancellation from the freelancer', async () => {
            const created = await request(app)
                .post('/api/v1/bookings')
                .set('Authorization', `Bearer ${clientToken}`)
                .send({ gigId, bookingDate: futureISO() });

            const res = await request(app)
                .patch(`/api/v1/bookings/${created.body.data.booking.id}/cancel`)
                .set('Authorization', `Bearer ${freelancerToken}`);

            expect(res.status).toBe(403);
        });

        it('should reject cancelling an already-cancelled booking', async () => {
            const created = await request(app)
                .post('/api/v1/bookings')
                .set('Authorization', `Bearer ${clientToken}`)
                .send({ gigId, bookingDate: futureISO() });

            await request(app)
                .patch(`/api/v1/bookings/${created.body.data.booking.id}/cancel`)
                .set('Authorization', `Bearer ${clientToken}`);

            const res = await request(app)
                .patch(`/api/v1/bookings/${created.body.data.booking.id}/cancel`)
                .set('Authorization', `Bearer ${clientToken}`);

            expect(res.status).toBe(400);
        });
    });

    describe('PATCH /api/v1/bookings/:id/complete', () => {
        it('should reject completion before the booking date has arrived', async () => {
            const created = await request(app)
                .post('/api/v1/bookings')
                .set('Authorization', `Bearer ${clientToken}`)
                .send({ gigId, bookingDate: futureISO() });

            const res = await request(app)
                .patch(`/api/v1/bookings/${created.body.data.booking.id}/complete`)
                .set('Authorization', `Bearer ${freelancerToken}`);

            expect(res.status).toBe(400);
        });

        it('should allow the owning freelancer to complete a booking whose date has arrived, and create the REMAINDER transaction', async () => {
            const created = await request(app)
                .post('/api/v1/bookings')
                .set('Authorization', `Bearer ${clientToken}`)
                .send({ gigId, bookingDate: todayISO() });

            const res = await request(app)
                .patch(`/api/v1/bookings/${created.body.data.booking.id}/complete`)
                .set('Authorization', `Bearer ${freelancerToken}`);

            expect(res.status).toBe(200);
            expect(res.body.data.booking.status).toBe('COMPLETED');

            const txRes = await request(app)
                .get('/api/v1/transactions')
                .set('Authorization', `Bearer ${freelancerToken}`);

            const types = txRes.body.data.transactions.map((t) => t.type);
            expect(types).toContain('DEPOSIT');
            expect(types).toContain('REMAINDER');

            const remainder = txRes.body.data.transactions.find((t) => t.type === 'REMAINDER');
            expect(remainder.amount).toBe(2000);
            expect(remainder.status).toBe('PAID');
        });

        it('should reject completion from a CLIENT', async () => {
            const created = await request(app)
                .post('/api/v1/bookings')
                .set('Authorization', `Bearer ${clientToken}`)
                .send({ gigId, bookingDate: todayISO() });

            const res = await request(app)
                .patch(`/api/v1/bookings/${created.body.data.booking.id}/complete`)
                .set('Authorization', `Bearer ${clientToken}`);

            expect(res.status).toBe(403);
        });

        it('should reject completing a cancelled booking', async () => {
            const created = await request(app)
                .post('/api/v1/bookings')
                .set('Authorization', `Bearer ${clientToken}`)
                .send({ gigId, bookingDate: todayISO() });

            await request(app)
                .patch(`/api/v1/bookings/${created.body.data.booking.id}/cancel`)
                .set('Authorization', `Bearer ${clientToken}`);

            const res = await request(app)
                .patch(`/api/v1/bookings/${created.body.data.booking.id}/complete`)
                .set('Authorization', `Bearer ${freelancerToken}`);

            expect(res.status).toBe(400);
        });
    });

    describe('GET /api/v1/transactions/:id', () => {
        it('should reject access from an unrelated user', async () => {
            const created = await request(app)
                .post('/api/v1/bookings')
                .set('Authorization', `Bearer ${clientToken}`)
                .send({ gigId, bookingDate: futureISO() });

            const txRes = await request(app)
                .get('/api/v1/transactions')
                .set('Authorization', `Bearer ${clientToken}`);
            const transactionId = txRes.body.data.transactions[0].id;

            const res = await request(app)
                .get(`/api/v1/transactions/${transactionId}`)
                .set('Authorization', `Bearer ${secondClientToken}`);

            expect(res.status).toBe(403);
        });

        it('should allow the freelancer to view a transaction on their gig', async () => {
            const created = await request(app)
                .post('/api/v1/bookings')
                .set('Authorization', `Bearer ${clientToken}`)
                .send({ gigId, bookingDate: futureISO() });

            const txRes = await request(app)
                .get('/api/v1/transactions')
                .set('Authorization', `Bearer ${clientToken}`);
            const transactionId = txRes.body.data.transactions[0].id;

            const res = await request(app)
                .get(`/api/v1/transactions/${transactionId}`)
                .set('Authorization', `Bearer ${freelancerToken}`);

            expect(res.status).toBe(200);
        });
    });
});