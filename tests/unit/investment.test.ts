import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { InvestmentCreateSchema } from '../../src/schemas/investment';

const today = new Date().toISOString().split('T')[0];

const validInvestment = {
  investor_id: '22222222-2222-2222-2222-222222222222',
  amount_usd: 50_000,
  investment_date: '2020-01-01',
};

const messagesFor = (schema: z.ZodTypeAny, input: unknown): string[] => {
  const result = schema.safeParse(input);
  if (result.success) throw new Error('expected validation to fail');
  return result.error.issues.map((issue) => issue.message);
};

describe('InvestmentCreateSchema', () => {
  it('accepts a valid investment', () => {
    expect(InvestmentCreateSchema.parse(validInvestment)).toEqual(validInvestment);
  });

  it('accepts an investment dated today', () => {
    expect(
      InvestmentCreateSchema.safeParse({ ...validInvestment, investment_date: today }).success,
    ).toBe(true);
  });

  it('rejects a non-positive amount with a descriptive message', () => {
    expect(messagesFor(InvestmentCreateSchema, { ...validInvestment, amount_usd: 0 })).toContain(
      'Investment amount must be a positive amount',
    );
    expect(messagesFor(InvestmentCreateSchema, { ...validInvestment, amount_usd: -1 })).toContain(
      'Investment amount must be a positive amount',
    );
  });

  it('rejects a future investment date with a descriptive message', () => {
    const future = new Date(Date.now() + 86_400_000).toISOString().split('T')[0];
    expect(
      messagesFor(InvestmentCreateSchema, { ...validInvestment, investment_date: future }),
    ).toContain('Investment date cannot be in the future');
  });

  it('rejects an invalid date string with a descriptive message', () => {
    expect(
      messagesFor(InvestmentCreateSchema, { ...validInvestment, investment_date: 'not-a-date' }),
    ).toContain('Investment date must be a valid date');
  });

  it('rejects a non-uuid investor id with a descriptive message', () => {
    expect(
      messagesFor(InvestmentCreateSchema, { ...validInvestment, investor_id: 'nope' }),
    ).toContain('Investor id must be a valid UUID');
  });
});
