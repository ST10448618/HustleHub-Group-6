describe('logger', () => {
  let logger;
  let logSpy;
  let warnSpy;
  let errorSpy;
  const originalFetch = global.fetch;

  beforeEach(() => {
    jest.resetModules();
    process.env.LOG_IN_TESTS = 'true';
    delete process.env.BETTERSTACK_SOURCE_TOKEN;
    delete process.env.BETTERSTACK_INGESTING_HOST;
    delete process.env.LOG_LEVEL;

    logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    logger = require('../src/utils/logger');
  });

  afterEach(() => {
    jest.restoreAllMocks();
    global.fetch = originalFetch;
    delete process.env.LOG_IN_TESTS;
    delete process.env.BETTERSTACK_SOURCE_TOKEN;
    delete process.env.BETTERSTACK_INGESTING_HOST;
  });

  it('is silent under NODE_ENV=test unless LOG_IN_TESTS is set', () => {
    delete process.env.LOG_IN_TESTS;
    logger.info('should not appear');
    expect(logSpy).not.toHaveBeenCalled();
  });

  it('writes one structured JSON line per entry', () => {
    logger.info('hello', { event: 'EXAMPLE', userId: 'u1' });

    const entry = JSON.parse(logSpy.mock.calls[0][0]);
    expect(entry).toMatchObject({
      level: 'info',
      message: 'hello',
      event: 'EXAMPLE',
      userId: 'u1',
      service: 'hustlehub-api'
    });
    expect(entry.timestamp).toEqual(expect.any(String));
  });

  it('drops debug entries at the default info level', () => {
    const debugSpy = jest.spyOn(console, 'debug').mockImplementation(() => {});
    logger.debug('noisy');
    expect(debugSpy).not.toHaveBeenCalled();
  });

  it('routes warn and error to the matching console methods', () => {
    logger.warn('careful');
    logger.error('broken');
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(errorSpy).toHaveBeenCalledTimes(1);
  });

  it('redacts sensitive fields at any depth', () => {
    logger.info('sensitive', {
      password: 'hunter2',
      authorization: 'Bearer abc.def.ghi',
      nested: { token: 'secret-token', safe: 'visible' }
    });

    const entry = JSON.parse(logSpy.mock.calls[0][0]);
    expect(entry.password).toBe('[REDACTED]');
    expect(entry.authorization).toBe('[REDACTED]');
    expect(entry.nested.token).toBe('[REDACTED]');
    expect(entry.nested.safe).toBe('visible');
    expect(logSpy.mock.calls[0][0]).not.toContain('hunter2');
  });

  it('keeps the log message and moves meta.message to detail', () => {
    logger.error('MongoDB connection error', { message: 'ECONNRESET' });

    const entry = JSON.parse(errorSpy.mock.calls[0][0]);
    expect(entry.message).toBe('MongoDB connection error');
    expect(entry.detail).toBe('ECONNRESET');
  });

  it('survives circular metadata', () => {
    const circular = {};
    circular.self = circular;
    expect(() => logger.info('circular', circular)).not.toThrow();
  });

  it('does not ship anything when Better Stack is not configured', async () => {
    global.fetch = jest.fn();
    logger.info('local only');
    await logger.flush();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('ships batched entries to Better Stack with the bearer token', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, status: 202 });
    process.env.BETTERSTACK_SOURCE_TOKEN = 'test-token';
    process.env.BETTERSTACK_INGESTING_HOST = 'https://logs.example.test/';

    logger.info('first', { event: 'A' });
    logger.warn('second', { event: 'B' });
    await logger.flush();

    expect(global.fetch).toHaveBeenCalledTimes(1);
    const [url, options] = global.fetch.mock.calls[0];
    expect(url).toBe('https://logs.example.test');
    expect(options.headers.Authorization).toBe('Bearer test-token');

    const body = JSON.parse(options.body);
    expect(body).toHaveLength(2);
    expect(body[0]).toMatchObject({ message: 'first', event: 'A', level: 'info' });
    expect(body[0].dt).toEqual(expect.any(String));
  });

  it('never throws when the logging platform is unreachable', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('network down'));
    process.env.BETTERSTACK_SOURCE_TOKEN = 'test-token';
    process.env.BETTERSTACK_INGESTING_HOST = 'logs.example.test';

    logger.info('will fail to ship');
    await expect(logger.flush()).resolves.toBeUndefined();
    expect(errorSpy.mock.calls.flat().join(' ')).toContain('Could not ship logs');
  });
});