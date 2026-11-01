// backend/tests/logout.test.js
const jwt = require('jsonwebtoken');
const request = require('supertest');
const app = require('../src/app');
const config = require('../src/config');
const RevokedToken = require('../src/models/RevokedToken');
const { connectTestDB, clearTestDB, closeTestDB } = require('./setup');

const EMAIL = 'session@example.com';
const PASSWORD = 'Test123456!';

async function register(email = EMAIL) {
  return request(app)
    .post('/api/v1/auth/register')
    .send({ name: 'Session User', email, password: PASSWORD });
}

async function loginToken(email = EMAIL) {
  const res = await request(app).post('/api/v1/auth/login').send({ email, password: PASSWORD });
  return res.body.data.token;
}

function me(token) {
  return request(app).get('/api/v1/auth/me').set('Authorization', `Bearer ${token}`);
}

function logout(token) {
  return request(app).post('/api/v1/auth/logout').set('Authorization', `Bearer ${token}`);
}

describe('Logout and token revocation', () => {
  beforeAll(async () => {
    await connectTestDB();
  });

  afterAll(async () => {
    await closeTestDB();
  });

  beforeEach(async () => {
    await clearTestDB();
    await register();
  });

  it('issues every token with a unique id (jti)', async () => {
    const first = jwt.decode(await loginToken());
    const second = jwt.decode(await loginToken());

    expect(first.jti).toEqual(expect.any(String));
    expect(second.jti).toEqual(expect.any(String));
    expect(first.jti).not.toBe(second.jti);
  });

  it('logs out successfully with a valid token', async () => {
    const token = await loginToken();

    const res = await logout(token);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('Logged out successfully');
  });

  it('rejects the same token afterwards, even though its signature is still valid', async () => {
    const token = await loginToken();
    expect((await me(token)).status).toBe(200);

    await logout(token);

    const res = await me(token);
    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/session has ended/i);
  });

  it('keeps the denylist entry until the token would have expired', async () => {
    const token = await loginToken();
    const decoded = jwt.decode(token);

    await logout(token);

    const stored = await RevokedToken.findOne({ jti: decoded.jti });
    expect(stored).not.toBeNull();
    expect(stored.expiresAt.getTime()).toBe(decoded.exp * 1000);
  });

  it('only ends the session that logged out, not the same user on another device', async () => {
    const laptop = await loginToken();
    const phone = await loginToken();

    await logout(laptop);

    expect((await me(laptop)).status).toBe(401);
    expect((await me(phone)).status).toBe(200);
  });

  it('requires authentication to log out', async () => {
    const res = await request(app).post('/api/v1/auth/logout');
    expect(res.status).toBe(401);
  });

  it('is safe to call twice (second call is simply unauthenticated)', async () => {
    const token = await loginToken();

    expect((await logout(token)).status).toBe(200);
    expect((await logout(token)).status).toBe(401);
    expect(await RevokedToken.countDocuments()).toBe(1);
  });

  it('still accepts older tokens that have no jti', async () => {
    const registered = await request(app)
      .post('/api/v1/auth/register')
      .send({ name: 'Legacy User', email: 'legacy@example.com', password: PASSWORD });
    const legacyToken = jwt.sign(
      { id: registered.body.data.id, role: 'CLIENT' },
      config.jwtSecret,
      { expiresIn: '1h' }
    );

    expect((await me(legacyToken)).status).toBe(200);
  });
});