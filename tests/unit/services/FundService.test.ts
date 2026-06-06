import { beforeEach, describe, expect, it } from 'vitest';
import type { Database } from '../../../src/db/index';
import { FundService } from '../../../src/services/FundService';
import { makeFakeDb, type FakeDb } from './testDb';

const fundRow = {
  id: '11111111-1111-1111-1111-111111111111',
  name: 'Alpha Fund',
  vintageYear: 2024,
  targetSizeUsd: '1000000',
  status: 'Fundraising',
  createdAt: new Date('2024-01-01T00:00:00.000Z'),
};

describe('FundService', () => {
  let fake: FakeDb;
  let service: FundService;

  beforeEach(() => {
    fake = makeFakeDb();
    service = new FundService(fake.db as unknown as Database);
  });

  it('lists funds mapped to the response shape', async () => {
    fake.db.query.funds.findMany.mockResolvedValue([fundRow]);

    const result = await service.list();

    expect(result).toEqual([
      {
        id: fundRow.id,
        name: 'Alpha Fund',
        vintage_year: 2024,
        target_size_usd: 1000000,
        status: 'Fundraising',
        created_at: '2024-01-01T00:00:00.000Z',
      },
    ]);
  });

  it('returns a single fund by id', async () => {
    fake.db.query.funds.findFirst.mockResolvedValue(fundRow);

    const result = await service.getById(fundRow.id);

    expect(result.id).toBe(fundRow.id);
    expect(result.target_size_usd).toBe(1000000);
  });

  it('throws 404 when the fund does not exist', async () => {
    fake.db.query.funds.findFirst.mockResolvedValue(undefined);

    await expect(service.getById('missing')).rejects.toMatchObject({ statusCode: 404 });
  });

  it('creates a fund and returns it', async () => {
    fake.insertReturning.mockResolvedValue([fundRow]);

    const result = await service.create({
      name: 'Alpha Fund',
      vintage_year: 2024,
      target_size_usd: 1000000,
      status: 'Fundraising',
    });

    expect(result.name).toBe('Alpha Fund');
  });

  it('throws 404 when updating a missing fund', async () => {
    fake.db.query.funds.findFirst.mockResolvedValue(undefined);

    await expect(
      service.update({ id: fundRow.id, name: 'x', vintage_year: 2024, target_size_usd: 1, status: 'Closed' }),
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  it('throws 422 when updating a Closed fund', async () => {
    fake.db.query.funds.findFirst.mockResolvedValue({ ...fundRow, status: 'Closed' });

    await expect(
      service.update({
        id: fundRow.id,
        name: 'Alpha Fund',
        vintage_year: 2024,
        target_size_usd: 1000000,
        status: 'Closed',
      }),
    ).rejects.toMatchObject({ statusCode: 422 });
  });

  it('throws 422 when reducing target size below committed investments', async () => {
    fake.db.query.funds.findFirst.mockResolvedValue(fundRow);
    fake.db.query.investments.findMany.mockResolvedValue([
      { amountUsd: '500000' },
      { amountUsd: '300000' },
    ]);

    await expect(
      service.update({
        id: fundRow.id,
        name: 'Alpha Fund',
        vintage_year: 2024,
        target_size_usd: 500000,
        status: 'Fundraising',
      }),
    ).rejects.toMatchObject({ statusCode: 422 });
  });

  it('allows reducing target size when committed investments still fit', async () => {
    fake.db.query.funds.findFirst.mockResolvedValue(fundRow);
    fake.db.query.investments.findMany.mockResolvedValue([{ amountUsd: '500000' }]);
    fake.updateReturning.mockResolvedValue([{ ...fundRow, targetSizeUsd: '900000' }]);

    const result = await service.update({
      id: fundRow.id,
      name: 'Alpha Fund',
      vintage_year: 2024,
      target_size_usd: 900000,
      status: 'Fundraising',
    });

    expect(result.target_size_usd).toBe(900000);
  });

  it('allows reducing target size to exactly the committed total', async () => {
    fake.db.query.funds.findFirst.mockResolvedValue(fundRow);
    fake.db.query.investments.findMany.mockResolvedValue([
      { amountUsd: '500000' },
      { amountUsd: '300000' },
    ]);
    fake.updateReturning.mockResolvedValue([{ ...fundRow, targetSizeUsd: '800000' }]);

    const result = await service.update({
      id: fundRow.id,
      name: 'Alpha Fund',
      vintage_year: 2024,
      target_size_usd: 800000,
      status: 'Fundraising',
    });

    expect(result.target_size_usd).toBe(800000);
  });

  it('does not consult committed investments when raising the target size', async () => {
    fake.db.query.funds.findFirst.mockResolvedValue(fundRow);
    fake.updateReturning.mockResolvedValue([{ ...fundRow, targetSizeUsd: '2000000' }]);

    const result = await service.update({
      id: fundRow.id,
      name: 'Alpha Fund',
      vintage_year: 2024,
      target_size_usd: 2000000,
      status: 'Fundraising',
    });

    expect(result.target_size_usd).toBe(2000000);
    expect(fake.db.query.investments.findMany).not.toHaveBeenCalled();
  });

  it('returns an empty list when there are no funds', async () => {
    fake.db.query.funds.findMany.mockResolvedValue([]);

    expect(await service.list()).toEqual([]);
  });
});
