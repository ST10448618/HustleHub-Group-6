// backend/tests/lockout.test.js
const request = require('supertest');
const app = require('../src/app');
const config = require('../src/config');
const User = require('../src/models/User');
const { connectTestDB, clearTestDB, closeTestDB } = require('./setup');

const EMAIL = 'lockme@example.com';
const PASSWORD = 'Test123456!';
const WRONG_PASSWORD = 'WrongPassword1!';
const MAX = config.maxFailedLogins;

function login(email, password) {
  return request(app).post('/api/v1/auth/login').send({ email, password });
}

async function failLogins(times, email = EMAIL) {
  for (let i = 0; i < times; i += 1) {
    // Sequential on purpose: each attempt must see the previous count.
    // eslint-disable-next-line no-await-in-loop
    await login(email, WRONG_PASSWORD);
  }
}

function register(email) {
  return request(app)
    .post('/api/v1/auth/register')
    .send({ name: 'Test User', email, password: PASSWORD });
}

describe('Account lockout (brute-force protection)', () => {
  beforeAll(async () => {
    await connectTestDB();
  });

  afterAll(async () => {
    await closeTestDB();
  });

  beforeEach(async () => {
    await clearTestDB();
    await register(EMAIL);
  });

  it('still allows login after fewer failures than the limit, and resets the counter', async () => {
    await failLogins(MAX - 1);

    const res = await login(EMAIL, PASSWORD);
    expect(res.status).toBe(200);

    const user = await User.findByEmail(EMAIL);
    expect(user.failedLoginAttempts).toBe(0);
    expect(user.lockUntil).toBeNull();
  });

  it('locks the account once the limit is reached and refuses even the correct password', async () => {
    await failLogins(MAX);

    const res = await login(EMAIL, PASSWORD);
    expect(res.status).toBe(423);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/locked/i);

    const user = await User.findByEmail(EMAIL);
    expect(user.lockUntil.getTime()).toBeGreaterThan(Date.now());
  });

  it('does not keep counting while locked (the password is not even checked)', async () => {
    await failLogins(MAX);
    const blocked = await login(EMAIL, WRONG_PASSWORD);

    expect(blocked.status).toBe(423);
    const user = await User.findByEmail(EMAIL);
    expect(user.failedLoginAttempts).toBe(MAX);
  });

  it('allows login again once the lock has expired and clears the counters', async () => {
    await failLogins(MAX);
    await User.updateOne({ email: EMAIL }, { $set: { lockUntil: new Date(Date.now() - 1000) } });

    const res = await login(EMAIL, PASSWORD);
    expect(res.status).toBe(200);

    const user = await User.findByEmail(EMAIL);
    expect(user.failedLoginAttempts).toBe(0);
    expect(user.lockUntil).toBeNull();
  });

  it('restarts the count at 1 after an expired lock instead of re-locking immediately', async () => {
    await User.updateOne(
      { email: EMAIL },
      { $set: { failedLoginAttempts: MAX, lockUntil: new Date(Date.now() - 1000) } }
    );

    const res = await login(EMAIL, WRONG_PASSWORD);
    expect(res.status).toBe(401);

    const user = await User.findByEmail(EMAIL);
    expect(user.failedLoginAttempts).toBe(1);
    expect(user.lockUntil).toBeNull();
  });

  it('only locks the targeted account', async () => {
    await register('other@example.com');
    await failLogins(MAX);

    const res = await login('other@example.com', PASSWORD);
    expect(res.status).toBe(200);
  });

  it('answers unknown emails with the normal 401 and creates no lock', async () => {
    const res = await login('ghost@example.com', PASSWORD);

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Invalid email or password');
  });

  it('never exposes the lockout fields to the client', async () => {
    await failLogins(MAX - 1);
    const res = await login(EMAIL, PASSWORD);

    expect(res.body.data.user).not.toHaveProperty('failedLoginAttempts');
    expect(res.body.data.user).not.toHaveProperty('lockUntil');
  });
});