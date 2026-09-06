// backend/tests/auth.test.js
const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/User');

describe('Authentication API', () => {
    // Clean up before each test
    beforeEach(() => {
        User.deleteAll();
    });

    describe('POST /api/v1/auth/register', () => {
        it('should register a new user successfully', async () => {
            const response = await request(app)
                .post('/api/v1/auth/register')
                .send({
                    name: 'Test User',
                    email: 'test@example.com',
                    password: 'Test123456!'
                });
            
            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('User registered successfully');
            expect(response.body.data).toHaveProperty('id');
            expect(response.body.data).toHaveProperty('email', 'test@example.com');
            expect(response.body.data).not.toHaveProperty('passwordHash');
            expect(response.body.data).toHaveProperty('role', 'CLIENT');
        });

        it('should reject duplicate email', async () => {
            // Register first user
            await request(app)
                .post('/api/v1/auth/register')
                .send({
                    name: 'Test User',
                    email: 'test@example.com',
                    password: 'Test123456!'
                });
            
            // Try to register with same email
            const response = await request(app)
                .post('/api/v1/auth/register')
                .send({
                    name: 'Another User',
                    email: 'test@example.com',
                    password: 'Test123456!'
                });
            
            expect(response.status).toBe(409);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('Email already registered');
        });

        it('should reject invalid email', async () => {
            const response = await request(app)
                .post('/api/v1/auth/register')
                .send({
                    name: 'Test User',
                    email: 'invalid-email',
                    password: 'Test123456!'
                });
            
            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.errors).toBeDefined();
            expect(response.body.errors[0].field).toBe('email');
        });

        it('should reject weak password', async () => {
            const response = await request(app)
                .post('/api/v1/auth/register')
                .send({
                    name: 'Test User',
                    email: 'test@example.com',
                    password: 'weak'
                });
            
            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.errors).toBeDefined();
            expect(response.body.errors[0].field).toBe('password');
        });

        it('should reject missing name', async () => {
            const response = await request(app)
                .post('/api/v1/auth/register')
                .send({
                    email: 'test@example.com',
                    password: 'Test123456!'
                });
            
            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.errors[0].field).toBe('name');
        });

        it('should reject missing email', async () => {
            const response = await request(app)
                .post('/api/v1/auth/register')
                .send({
                    name: 'Test User',
                    password: 'Test123456!'
                });
            
            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.errors[0].field).toBe('email');
        });

        it('should reject missing password', async () => {
            const response = await request(app)
                .post('/api/v1/auth/register')
                .send({
                    name: 'Test User',
                    email: 'test@example.com'
                });
            
            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.errors[0].field).toBe('password');
        });
    });

    describe('POST /api/v1/auth/login', () => {
        beforeEach(async () => {
            // Create a user first
            await request(app)
                .post('/api/v1/auth/register')
                .send({
                    name: 'Test User',
                    email: 'test@example.com',
                    password: 'Test123456!'
                });
        });

        it('should login successfully and return JWT', async () => {
            const response = await request(app)
                .post('/api/v1/auth/login')
                .send({
                    email: 'test@example.com',
                    password: 'Test123456!'
                });
            
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Login successful');
            expect(response.body.data).toHaveProperty('token');
            expect(response.body.data.token).toMatch(/^eyJ/);
            expect(response.body.data.user).toHaveProperty('id');
            expect(response.body.data.user).toHaveProperty('email', 'test@example.com');
            expect(response.body.data.user).not.toHaveProperty('passwordHash');
        });

        it('should reject invalid password', async () => {
            const response = await request(app)
                .post('/api/v1/auth/login')
                .send({
                    email: 'test@example.com',
                    password: 'WrongPassword123!'
                });
            
            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Invalid email or password');
        });

        it('should reject non-existent email', async () => {
            const response = await request(app)
                .post('/api/v1/auth/login')
                .send({
                    email: 'nonexistent@example.com',
                    password: 'Test123456!'
                });
            
            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Invalid email or password');
        });

        it('should reject missing email', async () => {
            const response = await request(app)
                .post('/api/v1/auth/login')
                .send({
                    password: 'Test123456!'
                });
            
            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.errors[0].field).toBe('email');
        });

        it('should reject missing password', async () => {
            const response = await request(app)
                .post('/api/v1/auth/login')
                .send({
                    email: 'test@example.com'
                });
            
            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.errors[0].field).toBe('password');
        });
    });

    describe('GET /api/v1/auth/me', () => {
        let authToken;

        beforeEach(async () => {
            // Register and login
            await request(app)
                .post('/api/v1/auth/register')
                .send({
                    name: 'Test User',
                    email: 'test@example.com',
                    password: 'Test123456!'
                });
            
            const loginResponse = await request(app)
                .post('/api/v1/auth/login')
                .send({
                    email: 'test@example.com',
                    password: 'Test123456!'
                });
            
            authToken = loginResponse.body.data.token;
        });

        it('should get current user with valid token', async () => {
            const response = await request(app)
                .get('/api/v1/auth/me')
                .set('Authorization', `Bearer ${authToken}`);
            
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('id');
            expect(response.body.data).toHaveProperty('email', 'test@example.com');
            expect(response.body.data).toHaveProperty('name', 'Test User');
            expect(response.body.data).not.toHaveProperty('passwordHash');
        });

        it('should reject request without token', async () => {
            const response = await request(app)
                .get('/api/v1/auth/me');
            
            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('Authentication required');
        });

        it('should reject invalid token', async () => {
            const response = await request(app)
                .get('/api/v1/auth/me')
                .set('Authorization', 'Bearer invalid.token.here');
            
            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('Invalid token');
        });

        it('should reject malformed Authorization header', async () => {
            const response = await request(app)
                .get('/api/v1/auth/me')
                .set('Authorization', 'InvalidFormat');
            
            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
        });
    });
});