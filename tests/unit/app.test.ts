import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../../src/app';

describe('request validation error handling', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = buildApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('surfaces zod messages as structured per-field issues', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/funds',
      payload: { name: '', vintage_year: 1900, target_size_usd: -5, status: 'Nope' },
    });

    expect(res.statusCode).toBe(400);
    expect(res.json()).toEqual({
      statusCode: 400,
      error: 'Bad Request',
      message: 'Request validation failed',
      issues: expect.arrayContaining([
        { field: 'name', message: 'Fund name is required' },
        { field: 'vintage_year', message: 'Vintage year must be 1970 or later' },
        { field: 'target_size_usd', message: 'Target size must be a positive amount' },
        { field: 'status', message: 'Status must be one of: Fundraising, Investing, Closed' },
      ]),
    });
  });

  it('does not bury messages in a stringified blob', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/investors',
      payload: { name: 'Jane', investor_type: 'Robot', email: 'not-an-email' },
    });

    expect(res.statusCode).toBe(400);
    const body = res.json();
    expect(body.issues).toContainEqual({
      field: 'email',
      message: 'A valid email address is required',
    });
    expect(body.issues).toContainEqual({
      field: 'investor_type',
      message: 'Investor type must be one of: Individual, Institution, Family Office',
    });
  });
});
