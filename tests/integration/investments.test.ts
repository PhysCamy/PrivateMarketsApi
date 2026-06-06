import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../../src/app';
import { seed, SEED } from './seed';

const unknownId = '00000000-0000-4000-8000-0000000000ff';

describe('Investments API (integration)', () => {
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

  describe('GET /funds/:fund_id/investments', () => {
    it('lists the investments for a fund', async () => {
      const res = await app.inject({
        method: 'GET',
        url: `/funds/${SEED.funds.growth.id}/investments`,
      });

      expect(res.statusCode).toBe(200);
      expect(res.json()).toEqual([
        {
          id: SEED.investments.growthByJane.id,
          fund_id: SEED.funds.growth.id,
          investor_id: SEED.investors.jane.id,
          amount_usd: 250_000,
          investment_date: '2021-01-01',
        },
      ]);
    });

    it('returns an empty list for a fund with no investments', async () => {
      const res = await app.inject({
        method: 'GET',
        url: `/funds/${SEED.funds.buyout.id}/investments`,
      });

      expect(res.statusCode).toBe(200);
      expect(res.json()).toEqual([]);
    });

    it('returns 404 for an unknown fund', async () => {
      const res = await app.inject({ method: 'GET', url: `/funds/${unknownId}/investments` });

      expect(res.statusCode).toBe(404);
    });
  });

  describe('POST /funds/:fund_id/investments', () => {
    it('records an investment in a Fundraising fund and persists it', async () => {
      const res = await app.inject({
        method: 'POST',
        url: `/funds/${SEED.funds.growth.id}/investments`,
        payload: {
          investor_id: SEED.investors.acme.id,
          amount_usd: 300_000,
          investment_date: '2024-05-01',
        },
      });

      expect(res.statusCode).toBe(201);
      expect(res.json()).toMatchObject({
        fund_id: SEED.funds.growth.id,
        investor_id: SEED.investors.acme.id,
        amount_usd: 300_000,
      });

      const list = await app.inject({
        method: 'GET',
        url: `/funds/${SEED.funds.growth.id}/investments`,
      });
      expect(list.json()).toHaveLength(2);
    });

    it('returns 404 for an unknown fund', async () => {
      const res = await app.inject({
        method: 'POST',
        url: `/funds/${unknownId}/investments`,
        payload: {
          investor_id: SEED.investors.jane.id,
          amount_usd: 100_000,
          investment_date: '2024-05-01',
        },
      });

      expect(res.statusCode).toBe(404);
    });

    it('returns 422 when the fund is not Fundraising', async () => {
      const res = await app.inject({
        method: 'POST',
        url: `/funds/${SEED.funds.buyout.id}/investments`,
        payload: {
          investor_id: SEED.investors.jane.id,
          amount_usd: 100_000,
          investment_date: '2024-05-01',
        },
      });

      expect(res.statusCode).toBe(422);
    });

    it('returns 404 when the investor does not exist', async () => {
      const res = await app.inject({
        method: 'POST',
        url: `/funds/${SEED.funds.growth.id}/investments`,
        payload: {
          investor_id: unknownId,
          amount_usd: 100_000,
          investment_date: '2024-05-01',
        },
      });

      expect(res.statusCode).toBe(404);
    });

    it('returns 422 when the investment would exceed the fund target size', async () => {
      const res = await app.inject({
        method: 'POST',
        url: `/funds/${SEED.funds.growth.id}/investments`,
        payload: {
          investor_id: SEED.investors.acme.id,
          amount_usd: 800_000,
          investment_date: '2024-05-01',
        },
      });

      expect(res.statusCode).toBe(422);
    });

    it('returns 400 for an invalid body', async () => {
      const res = await app.inject({
        method: 'POST',
        url: `/funds/${SEED.funds.growth.id}/investments`,
        payload: { investor_id: 'not-a-uuid', amount_usd: -1, investment_date: 'tomorrow' },
      });

      expect(res.statusCode).toBe(400);
    });
  });
});
