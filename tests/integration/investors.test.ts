import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../../src/app';
import { seed } from './seed';

describe('Investors API (integration)', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = buildApp({ logger: false });
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await seed();
  });

  describe('GET /investors', () => {
    it('returns every investor, newest first', async () => {
      const res = await app.inject({ method: 'GET', url: '/investors' });

      expect(res.statusCode).toBe(200);
      const names = res.json().map((i: { name: string }) => i.name);
      expect(names).toEqual(['Acme Pension', 'Jane Smith']);
    });
  });

  describe('POST /investors', () => {
    it('creates an investor and persists it', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/investors',
        payload: { name: 'New LP', investor_type: 'Family Office', email: 'new-lp@example.com' },
      });

      expect(res.statusCode).toBe(201);
      const created = res.json();
      expect(created).toMatchObject({ name: 'New LP', investor_type: 'Family Office' });

      const list = await app.inject({ method: 'GET', url: '/investors' });
      expect(list.json().map((i: { id: string }) => i.id)).toContain(created.id);
    });

    it('returns 409 for a duplicate email', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/investors',
        payload: { name: 'Jane Again', investor_type: 'Individual', email: 'jane@example.com' },
      });

      expect(res.statusCode).toBe(409);
    });

    it('returns 400 for an invalid body', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/investors',
        payload: { name: 'Jane', investor_type: 'Robot', email: 'not-an-email' },
      });

      expect(res.statusCode).toBe(400);
    });
  });
});
