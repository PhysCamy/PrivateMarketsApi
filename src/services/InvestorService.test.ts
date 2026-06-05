import { beforeEach, describe, expect, it } from 'vitest';
import type { Database } from '../db/index';
import { InvestorService } from './InvestorService';
import { makeFakeDb, type FakeDb } from './testDb';

const investorRow = {
  id: '22222222-2222-2222-2222-222222222222',
  name: 'Alice',
  investorType: 'Individual',
  email: 'alice@example.com',
  createdAt: new Date('2024-01-01T00:00:00.000Z'),
};

describe('InvestorService', () => {
  let fake: FakeDb;
  let service: InvestorService;

  beforeEach(() => {
    fake = makeFakeDb();
    service = new InvestorService(fake.db as unknown as Database);
  });

  it('lists investors mapped to the response shape', async () => {
    fake.db.query.investors.findMany.mockResolvedValue([investorRow]);

    const result = await service.list();

    expect(result).toEqual([
      {
        id: investorRow.id,
        name: 'Alice',
        investor_type: 'Individual',
        email: 'alice@example.com',
        created_at: '2024-01-01T00:00:00.000Z',
      },
    ]);
  });

  it('creates an investor and returns it', async () => {
    fake.insertReturning.mockResolvedValue([investorRow]);

    const result = await service.create({
      name: 'Alice',
      investor_type: 'Individual',
      email: 'alice@example.com',
    });

    expect(result.email).toBe('alice@example.com');
  });

  it('throws 409 on duplicate email', async () => {
    fake.insertReturning.mockRejectedValue({ code: '23505' });

    await expect(
      service.create({ name: 'Alice', investor_type: 'Individual', email: 'alice@example.com' }),
    ).rejects.toMatchObject({ statusCode: 409 });
  });

  it('rethrows unexpected database errors', async () => {
    const boom = new Error('connection lost');
    fake.insertReturning.mockRejectedValue(boom);

    await expect(
      service.create({ name: 'Alice', investor_type: 'Individual', email: 'alice@example.com' }),
    ).rejects.toBe(boom);
  });
});
