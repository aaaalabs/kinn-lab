import { describe, it, expect } from 'vitest';

describe('health endpoint', () => {
  it('returns ok status', async () => {
    const { default: handler } = await import('../api/health.js');

    const res = {
      statusCode: null,
      body: null,
      status(code) { this.statusCode = code; return this; },
      json(data) { this.body = data; return this; },
    };

    await handler({ method: 'GET' }, res);

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.env).toBe('lab');
    expect(res.body.timestamp).toBeDefined();
  });

  it('rejects non-GET methods', async () => {
    const { default: handler } = await import('../api/health.js');

    const res = {
      statusCode: null,
      body: null,
      status(code) { this.statusCode = code; return this; },
      json(data) { this.body = data; return this; },
    };

    await handler({ method: 'POST' }, res);

    expect(res.statusCode).toBe(405);
  });
});
