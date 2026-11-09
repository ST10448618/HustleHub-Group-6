// backend/tests/income.test.js
const request = require('supertest');
const app = require('../src/app');
const { connectTestDB, clearTestDB, closeTestDB } = require('./setup');

describe('Income API', () => {
    let freelancerToken;
    let clientToken;

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

        await request(app)
            .post('/api/v1/auth/register')
            .send({
                name: 'Alex Freelancer',
                email: 'freelancer@example.com',
                password: 'Test123456!',
                role: 'FREELANCER'
            });
        const freelancerLogin = await request(app)
            .post('/api/v1/auth/login')
            .send({ email: 'freelancer@example.com', password: 'Test123456!' });
        freelancerToken = freelancerLogin.body.data.token;

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
    });

    async function createGig(price, depositAmount) {
        const res = await request(app)
            .post('/api/v1/gigs')
            .set('Authorization', `Bearer ${freelancerToken}`)
            .send({
                title: 'A Gig',
                description: 'Some work.',
                category: 'Software',
                price,
                depositAmount
            });
        return res.body.data.gig.id;
    }

    async function createBooking(gigId, bookingDate) {
        const res = await request(app)
            .post('/api/v1/bookings')
            .set('Authorization', `Bearer ${clientToken}`)
            .send({ gigId, bookingDate });
        return res.body.data.booking.id;
    }

    it('should require authentication', async () => {
        const res = await request(app).get('/api/v1/income/me');
        expect(res.status).toBe(401);
    });

    it('should reject a CLIENT', async () => {
        const res = await request(app)
            .get('/api/v1/income/me')
            .set('Authorization', `Bearer ${clientToken}`);
        expect(res.status).toBe(403);
    });

    it('should return all zeros for a freelancer with no bookings', async () => {
        const res = await request(app)
            .get('/api/v1/income/me')
            .set('Authorization', `Bearer ${freelancerToken}`);

        expect(res.status).toBe(200);
        expect(res.body.data).toEqual({
            totalIncome: 0,
            depositIncome: 0,
            remainingIncome: 0,
            pendingIncome: 0
        });
    });

    it('should count a confirmed future booking\'s remainder as pending, not as income', async () => {
        const gigId = await createGig(2500, 500);
        await createBooking(gigId, futureISO());

        const res = await request(app)
            .get('/api/v1/income/me')
            .set('Authorization', `Bearer ${freelancerToken}`);

        expect(res.body.data.depositIncome).toBe(500);
        expect(res.body.data.remainingIncome).toBe(0);
        expect(res.body.data.totalIncome).toBe(500);
        expect(res.body.data.pendingIncome).toBe(2000);
    });

    it('should move the remainder from pending to income once the booking is completed', async () => {
        const gigId = await createGig(2500, 500);
        const bookingId = await createBooking(gigId, todayISO());

        await request(app)
            .patch(`/api/v1/bookings/${bookingId}/complete`)
            .set('Authorization', `Bearer ${freelancerToken}`);

        const res = await request(app)
            .get('/api/v1/income/me')
            .set('Authorization', `Bearer ${freelancerToken}`);

        expect(res.body.data.depositIncome).toBe(500);
        expect(res.body.data.remainingIncome).toBe(2000);
        expect(res.body.data.totalIncome).toBe(2500);
        expect(res.body.data.pendingIncome).toBe(0);
    });

    it('should NOT count a cancelled booking\'s remainder as pending income', async () => {
        const gigId = await createGig(2500, 500);
        const bookingId = await createBooking(gigId, futureISO());

        await request(app)
            .patch(`/api/v1/bookings/${bookingId}/cancel`)
            .set('Authorization', `Bearer ${clientToken}`);

        const res = await request(app)
            .get('/api/v1/income/me')
            .set('Authorization', `Bearer ${freelancerToken}`);

        // The deposit is retained (still counts as income), but the
        // remainder will never be paid, so it must not appear as pending.
        expect(res.body.data.depositIncome).toBe(500);
        expect(res.body.data.pendingIncome).toBe(0);
    });

    it('should correctly sum income across multiple bookings', async () => {
        const gigId = await createGig(1000, 200);
        await createBooking(gigId, futureISO());
        await createBooking(gigId, futureISO());

        const res = await request(app)
            .get('/api/v1/income/me')
            .set('Authorization', `Bearer ${freelancerToken}`);

        expect(res.body.data.depositIncome).toBe(400); // 2 x 200
        expect(res.body.data.pendingIncome).toBe(1600); // 2 x 800
    });
});