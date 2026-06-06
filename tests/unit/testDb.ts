import { vi } from 'vitest';

/**
 * A fake Drizzle database for service tests. Each query method and the
 * insert/update result hooks are vitest mocks, so a test can stub exactly the
 * reads and writes the service under test performs. Pass `db` to a service
 * constructor (cast to `Database`); drive behaviour through the mock methods.
 */
export function makeFakeDb() {
  const insertReturning = vi.fn();
  const updateReturning = vi.fn();

  const db = {
    query: {
      funds: { findFirst: vi.fn(), findMany: vi.fn() },
      investors: { findFirst: vi.fn(), findMany: vi.fn() },
      investments: { findFirst: vi.fn(), findMany: vi.fn() },
    },
    insert: vi.fn(() => ({ values: vi.fn(() => ({ returning: insertReturning })) })),
    update: vi.fn(() => ({ set: vi.fn(() => ({ where: vi.fn(() => ({ returning: updateReturning })) })) })),
  };

  return { db, insertReturning, updateReturning };
}

export type FakeDb = ReturnType<typeof makeFakeDb>;
