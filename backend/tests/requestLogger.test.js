const express = require('express');
const request = require('supertest');

jest.mock('../src/utils/logger');
const logger = require('../src/utils/logger');
const requestLogger = require('../src/middleware/requestLogger');

function buildApp() {
  const app = express();
  app.use(requestLogger);
  app.get('/ok', (req, res) => res.json({ ok: true }));
  app.get('/missing', (req, res) => res.status(404).json({ ok: false }));
  app.get('/boom', (req, res) => res.status(500).json({ ok: false }));
  app.get('/health', (req, res) => res.json({ ok: true }));
  return app;
}

// The 'finish' event can land just after the client receives the body.
const settle = () => new Promise((resolve) => setImmediate(resolve));

describe('requestLogger', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('logs successful requests at info level', async () => {
    await request(buildApp()).get('/ok');
    await settle();

    expect(logger.info).toHaveBeenCalledWith(
      'HTTP request completed',
      expect.objectContaining({ event: 'HTTP_REQUEST', method: 'GET', path: '/ok', status: 200 })
    );
  });

  it('logs client errors at warn level', async () => {
    await request(buildApp()).get('/missing');
    await settle();

    expect(logger.warn).toHaveBeenCalledWith(
      'HTTP request completed',
      expect.objectContaining({ path: '/missing', status: 404 })
    );
  });

  it('logs server errors at error level', async () => {
    await request(buildApp()).get('/boom');
    await settle();

    expect(logger.error).toHaveBeenCalledWith(
      'HTTP request completed',
      expect.objectContaining({ path: '/boom', status: 500 })
    );
  });

  it('never logs the query string', async () => {
    await request(buildApp()).get('/ok?token=super-secret');
    await settle();

    const logged = JSON.stringify(logger.info.mock.calls);
    expect(logged).not.toContain('super-secret');
    expect(logger.info.mock.calls[0][1].path).toBe('/ok');
  });

  it('skips health checks', async () => {
    await request(buildApp()).get('/health');
    await settle();

    expect(logger.info).not.toHaveBeenCalled();
  });

  it('returns a unique request id header', async () => {
    const first = await request(buildApp()).get('/ok');
    const second = await request(buildApp()).get('/ok');

    expect(first.headers['x-request-id']).toMatch(/^[0-9a-f-]{36}$/);
    expect(first.headers['x-request-id']).not.toBe(second.headers['x-request-id']);
  });
});