import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../../src/app';
import { seed, SEED } from './seed';

describe('Funds API (integration)', () => {
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

  describe('GET /funds', () => {
    it('returns every fund, newest first', async () => {
      const res = await app.inject({ method: 'GET', url: '/funds' });

      expect(res.statusCode).toBe(200);
      const names = res.json().map((f: { name: string }) => f.name);
      expect(names).toEqual(['Legacy Fund', 'Buyout Fund II', 'Growth Fund I']);
    });

    it('maps a fund to the API response shape', async () => {
      const res = await app.inject({ method: 'GET', url: '/funds' });

      const growth = res.json().find((f: { id: string }) => f.id === SEED.funds.growth.id);
      expect(growth).toEqual({
        id: SEED.funds.growth.id,
        name: 'Growth Fund I',
        vintage_year: 2020,
        target_size_usd: 1_000_000,
        status: 'Fundraising',
        created_at: '2024-01-01T00:00:00.000Z',
      });
    });
  });

  describe('GET /funds/:id', () => {
    it('returns a single fund by id', async () => {
      const res = await app.inject({ method: 'GET', url: `/funds/${SEED.funds.buyout.id}` });

      expect(res.statusCode).toBe(200);
      expect(res.json()).toMatchObject({ name: 'Buyout Fund II', status: 'Investing' });
    });

    it('returns 404 for an unknown fund', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/funds/a0000000-0000-4000-8000-0000000000ff',
      });

      expect(res.statusCode).toBe(404);
    });
  });

  describe('POST /funds', () => {
    it('creates a fund and persists it', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/funds',
        payload: {
          name: 'Venture Fund III',
          vintage_year: 2024,
          target_size_usd: 750_000,
          status: 'Fundraising',
        },
      });

      expect(res.statusCode).toBe(201);
      const created = res.json();
      expect(created).toMatchObject({ name: 'Venture Fund III', target_size_usd: 750_000 });

      const fetched = await app.inject({ method: 'GET', url: `/funds/${created.id}` });
      expect(fetched.json()).toEqual(created);
    });

    it('returns 400 for an invalid body', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/funds',
        payload: { name: '', vintage_year: 1900, target_size_usd: -5, status: 'Nope' },
      });

      expect(res.statusCode).toBe(400);
    });
  });

  describe('PUT /funds', () => {
    it('updates a fund and persists the change', async () => {
      const res = await app.inject({
        method: 'PUT',
        url: '/funds',
        payload: {
          id: SEED.funds.growth.id,
          name: 'Growth Fund I (Renamed)',
          vintage_year: 2020,
          target_size_usd: 2_000_000,
          status: 'Investing',
        },
      });

      expect(res.statusCode).toBe(200);
      expect(res.json()).toMatchObject({
        name: 'Growth Fund I (Renamed)',
        target_size_usd: 2_000_000,
        status: 'Investing',
      });

      const fetched = await app.inject({ method: 'GET', url: `/funds/${SEED.funds.growth.id}` });
      expect(fetched.json().name).toBe('Growth Fund I (Renamed)');
    });

    it('returns 404 when the fund does not exist', async () => {
      const res = await app.inject({
        method: 'PUT',
        url: '/funds',
        payload: {
          id: 'a0000000-0000-4000-8000-0000000000ff',
          name: 'Ghost Fund',
          vintage_year: 2020,
          target_size_usd: 1_000_000,
          status: 'Fundraising',
        },
      });

      expect(res.statusCode).toBe(404);
    });

    it('returns 422 when updating a Closed fund', async () => {
      const res = await app.inject({
        method: 'PUT',
        url: '/funds',
        payload: {
          id: SEED.funds.legacy.id,
          name: 'Legacy Fund',
          vintage_year: 2015,
          target_size_usd: 2_000_000,
          status: 'Closed',
        },
      });

      expect(res.statusCode).toBe(422);
    });

    it('returns 422 when reducing target size below committed investments', async () => {
      const res = await app.inject({
        method: 'PUT',
        url: '/funds',
        payload: {
          id: SEED.funds.growth.id,
          name: 'Growth Fund I',
          vintage_year: 2020,
          target_size_usd: 100_000,
          status: 'Fundraising',
        },
      });

      expect(res.statusCode).toBe(422);
    });
  });
});
