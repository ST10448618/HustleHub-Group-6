// backend/tests/health.test.js
const request = require('supertest');
const app = require('../src/app');

describe('Health Check API', () => {
    describe('GET /health', () => {
        it('should return 200 OK with health status', async () => {
            const response = await request(app)
                .get('/health');
            
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toContain('HustleHub+ API is running');
            expect(response.body.environment).toBeDefined();
        });

        it('should return the correct environment', async () => {
            const response = await request(app)
                .get('/health');
            
            expect(response.body.environment).toBe('development');
        });
    });
});