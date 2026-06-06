import { beforeEach, describe, expect, it } from 'vitest';
import type { Database } from '../../src/db/index';
import { InvestmentService } from '../../src/services/InvestmentService';
import { makeFakeDb, type FakeDb } from './testDb';

const fundId = '11111111-1111-1111-1111-111111111111';
const investorId = '22222222-2222-2222-2222-222222222222';

const fundRow = {
  id: fundId,
  name: 'Alpha Fund',
  vintageYear: 2024,
  targetSizeUsd: '1000000',
  status: 'Fundraising',
  createdAt: new Date('2024-01-01T00:00:00.000Z'),
};

const investmentRow = {
  id: '33333333-3333-3333-3333-333333333333',
  investorId,
  fundId,
  amountUsd: '600000',
  investmentDate: '2024-01-15',
};

const validInput = {
  investor_id: investorId,
  amount_usd: 600000,
  investment_date: '2024-01-15',
};

describe('InvestmentService', () => {
  let fake: FakeDb;
  let service: InvestmentService;

  beforeEach(() => {
    fake = makeFakeDb();
    service = new InvestmentService(fake.db as unknown as Database);
  });

  it('lists investments for an existing fund', async () => {
    fake.db.query.funds.findFirst.mockResolvedValue(fundRow);
    fake.db.query.investments.findMany.mockResolvedValue([investmentRow]);

    const result = await service.listByFund(fundId);

    expect(result).toEqual([
      {
        id: investmentRow.id,
        investor_id: investorId,
        fund_id: fundId,
        amount_usd: 600000,
        investment_date: '2024-01-15',
      },
    ]);
  });

  it('throws 404 when listing investments for a missing fund', async () => {
    fake.db.query.funds.findFirst.mockResolvedValue(undefined);

    await expect(service.listByFund(fundId)).rejects.toMatchObject({ statusCode: 404 });
  });

  it('throws 404 when the fund does not exist', async () => {
    fake.db.query.funds.findFirst.mockResolvedValue(undefined);

    await expect(service.create(fundId, validInput)).rejects.toMatchObject({ statusCode: 404 });
  });

  it('throws 422 when the fund is not Fundraising', async () => {
    fake.db.query.funds.findFirst.mockResolvedValue({ ...fundRow, status: 'Investing' });

    await expect(service.create(fundId, validInput)).rejects.toMatchObject({ statusCode: 422 });
  });

  it('throws 404 when the investor does not exist', async () => {
    fake.db.query.funds.findFirst.mockResolvedValue(fundRow);
    fake.db.query.investors.findFirst.mockResolvedValue(undefined);

    await expect(service.create(fundId, validInput)).rejects.toMatchObject({ statusCode: 404 });
  });

  it('throws 422 when the investment would exceed the fund target size', async () => {
    fake.db.query.funds.findFirst.mockResolvedValue(fundRow);
    fake.db.query.investors.findFirst.mockResolvedValue({ id: investorId });
    fake.db.query.investments.findMany.mockResolvedValue([{ amountUsd: '500000' }]);

    await expect(
      service.create(fundId, { ...validInput, amount_usd: 600000 }),
    ).rejects.toMatchObject({ statusCode: 422 });
  });

  it('records an investment when all checks pass', async () => {
    fake.db.query.funds.findFirst.mockResolvedValue(fundRow);
    fake.db.query.investors.findFirst.mockResolvedValue({ id: investorId });
    fake.db.query.investments.findMany.mockResolvedValue([]);
    fake.insertReturning.mockResolvedValue([investmentRow]);

    const result = await service.create(fundId, validInput);

    expect(result.amount_usd).toBe(600000);
    expect(result.fund_id).toBe(fundId);
  });
});
