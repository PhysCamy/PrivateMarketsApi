import 'dotenv/config';
import { sql } from 'drizzle-orm';
import { db, type Database } from '../../src/db/index';
import { funds, investors, investments } from '../../src/db/schema';

/**
 * Deterministic fixtures for the integration suite. Fixed UUIDs and explicit
 * `createdAt` timestamps make every test assertion (lookups by id, "newest
 * first" ordering, business-rule outcomes) stable and reproducible.
 *
 * Layout:
 * - `growth` is Fundraising and already holds one investment — the only fund
 *   that accepts new investments.
 * - `buyout` is Investing — rejects new investments.
 * - `legacy` is Closed — rejects updates.
 */
export const SEED = {
  funds: {
    growth: {
      id: 'a0000000-0000-4000-8000-000000000001',
      name: 'Growth Fund I',
      vintageYear: 2020,
      targetSizeUsd: '1000000',
      status: 'Fundraising',
      createdAt: new Date('2024-01-01T00:00:00.000Z'),
    },
    buyout: {
      id: 'a0000000-0000-4000-8000-000000000002',
      name: 'Buyout Fund II',
      vintageYear: 2022,
      targetSizeUsd: '5000000',
      status: 'Investing',
      createdAt: new Date('2024-02-01T00:00:00.000Z'),
    },
    legacy: {
      id: 'a0000000-0000-4000-8000-000000000003',
      name: 'Legacy Fund',
      vintageYear: 2015,
      targetSizeUsd: '2000000',
      status: 'Closed',
      createdAt: new Date('2024-03-01T00:00:00.000Z'),
    },
  },
  investors: {
    jane: {
      id: 'b0000000-0000-4000-8000-000000000001',
      name: 'Jane Smith',
      investorType: 'Individual',
      email: 'jane@example.com',
      createdAt: new Date('2024-01-01T00:00:00.000Z'),
    },
    acme: {
      id: 'b0000000-0000-4000-8000-000000000002',
      name: 'Acme Pension',
      investorType: 'Institution',
      email: 'acme@example.com',
      createdAt: new Date('2024-02-01T00:00:00.000Z'),
    },
  },
  investments: {
    growthByJane: {
      id: 'c0000000-0000-4000-8000-000000000001',
      fundId: 'a0000000-0000-4000-8000-000000000001',
      investorId: 'b0000000-0000-4000-8000-000000000001',
      amountUsd: '250000',
      investmentDate: '2021-01-01',
    },
  },
};

/** Remove all rows from every table, resetting the database to empty. */
export async function resetDb(database: Database = db): Promise<void> {
  await database.execute(sql`TRUNCATE investments, investors, funds RESTART IDENTITY CASCADE`);
}

/**
 * Reset the database and insert the canonical {@link SEED} fixtures. Returns the
 * fixtures so callers can reference seeded ids. Safe to run repeatedly.
 */
export async function seed(database: Database = db): Promise<typeof SEED> {
  await resetDb(database);
  await database.insert(funds).values(Object.values(SEED.funds));
  await database.insert(investors).values(Object.values(SEED.investors));
  await database.insert(investments).values(Object.values(SEED.investments));
  return SEED;
}

const runDirectly = process.argv[1] !== undefined && import.meta.url === `file://${process.argv[1]}`;
if (runDirectly) {
  seed()
    .then(() => {
      console.log('Seeded integration test data');
      process.exit(0);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
