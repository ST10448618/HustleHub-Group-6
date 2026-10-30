// backend/tests/tax.test.js
const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const Transaction = require('../src/models/Transaction');
const { connectTestDB, clearTestDB, closeTestDB } = require('./setup');

describe('Tax estimate API', () => {
  let freelancerToken;
  let freelancerId;
  let clientToken;
  let clientId;

  beforeAll(async () => {
    await connectTestDB();
  });

  afterAll(async () => {
    await closeTestDB();
  });

  beforeEach(async () => {
    await clearTestDB();

    const freelancerRegister = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Alex Freelancer',
        email: 'freelancer@example.com',
        password: 'Test123456!',
        role: 'FREELANCER'
      });
    freelancerId = freelancerRegister.body.data.id;
    const freelancerLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'freelancer@example.com', password: 'Test123456!' });
    freelancerToken = freelancerLogin.body.data.token;

    const clientRegister = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Casey Client',
        email: 'client@example.com',
        password: 'Test123456!',
        role: 'CLIENT'
      });
    clientId = clientRegister.body.data.id;
    const clientLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'client@example.com', password: 'Test123456!' });
    clientToken = clientLogin.body.data.token;
  });

  // Inserts a PAID transaction straight into the collection so a test
  // can control the amount and the createdAt date precisely.
  function insertPaid(amount, createdAt, freelancer = freelancerId) {
    return Transaction.collection.insertOne({
      bookingId: new mongoose.Types.ObjectId(),
      clientId: new mongoose.Types.ObjectId(clientId),
      freelancerId: new mongoose.Types.ObjectId(freelancer),
      type: 'DEPOSIT',
      amount,
      status: 'PAID',
      createdAt,
      updatedAt: createdAt
    });
  }

  function getTax(token) {
    return request(app).get('/api/v1/income/tax').set('Authorization', `Bearer ${token}`);
  }

  it('requires authentication', async () => {
    const res = await request(app).get('/api/v1/income/tax');
    expect(res.status).toBe(401);
  });

  it('rejects a CLIENT', async () => {
    const res = await getTax(clientToken);
    expect(res.status).toBe(403);
  });

  it('returns zeros and an empty breakdown for a freelancer with no income', async () => {
    const res = await getTax(freelancerToken);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.taxableIncome).toBe(0);
    expect(res.body.data.estimatedTax).toBe(0);
    expect(res.body.data.afterTaxIncome).toBe(0);
    expect(res.body.data.breakdown).toEqual([]);
    expect(res.body.data.taxYear).toMatch(/^\d{4}\/\d{2}$/);
    expect(res.body.data.disclaimer).toEqual(expect.any(String));
  });

  it('reports no tax on income below the tax-free threshold (real booking flow)', async () => {
    const gig = await request(app)
      .post('/api/v1/gigs')
      .set('Authorization', `Bearer ${freelancerToken}`)
      .send({
        title: 'A Gig',
        description: 'Some work.',
        category: 'Software',
        price: 2500,
        depositAmount: 500
      });
    const booking = await request(app)
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ gigId: gig.body.data.gig.id, bookingDate: new Date().toISOString().split('T')[0] });
    await request(app)
      .patch(`/api/v1/bookings/${booking.body.data.booking.id}/complete`)
      .set('Authorization', `Bearer ${freelancerToken}`);

    const res = await getTax(freelancerToken);

    expect(res.body.data.taxableIncome).toBe(2500);
    expect(res.body.data.estimatedTax).toBe(0);
    expect(res.body.data.afterTaxIncome).toBe(2500);
  });

  it('calculates progressive tax for higher income', async () => {
    await insertPaid(300000, new Date());

    const res = await getTax(freelancerToken);

    expect(res.body.data.taxableIncome).toBe(300000);
    expect(res.body.data.estimatedTax).toBe(40572);
    expect(res.body.data.afterTaxIncome).toBe(259428);
    expect(res.body.data.marginalRate).toBe(0.26);
    expect(res.body.data.breakdown).toHaveLength(2);
  });

  it('ignores income from previous tax years', async () => {
    await insertPaid(250000, new Date('2020-06-01T10:00:00Z'));
    await insertPaid(300000, new Date());

    const res = await getTax(freelancerToken);

    expect(res.body.data.taxableIncome).toBe(300000);
  });

  it("never includes another freelancer's income", async () => {
    await insertPaid(300000, new Date(), new mongoose.Types.ObjectId().toString());

    const res = await getTax(freelancerToken);

    expect(res.body.data.taxableIncome).toBe(0);
  });
});