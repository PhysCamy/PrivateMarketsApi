import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { FundCreateSchema, FundUpdateSchema } from '../../src/schemas/fund';

const validFund = {
  name: 'Growth Fund I',
  vintage_year: 2020,
  target_size_usd: 1_000_000,
  status: 'Fundraising',
};

const messagesFor = (schema: z.ZodTypeAny, input: unknown): string[] => {
  const result = schema.safeParse(input);
  if (result.success) throw new Error('expected validation to fail');
  return result.error.issues.map((issue) => issue.message);
};

describe('FundCreateSchema', () => {
  it('accepts a valid fund', () => {
    expect(FundCreateSchema.parse(validFund)).toEqual(validFund);
  });

  it('rejects an empty name with a descriptive message', () => {
    expect(messagesFor(FundCreateSchema, { ...validFund, name: '' })).toContain(
      'Fund name is required',
    );
  });

  it('rejects a name longer than 100 characters with a descriptive message', () => {
    expect(messagesFor(FundCreateSchema, { ...validFund, name: 'x'.repeat(101) })).toContain(
      'Fund name must be 100 characters or fewer',
    );
  });

  it('rejects a vintage year before 1970 with a descriptive message', () => {
    expect(messagesFor(FundCreateSchema, { ...validFund, vintage_year: 1969 })).toContain(
      'Vintage year must be 1970 or later',
    );
  });

  it('rejects a vintage year in the future with a descriptive message', () => {
    const nextYear = new Date().getFullYear() + 1;
    expect(messagesFor(FundCreateSchema, { ...validFund, vintage_year: nextYear })).toContain(
      'Vintage year cannot be in the future',
    );
  });

  it('accepts the current year as vintage year', () => {
    const thisYear = new Date().getFullYear();
    expect(FundCreateSchema.safeParse({ ...validFund, vintage_year: thisYear }).success).toBe(true);
  });

  it('rejects a non-positive target size with a descriptive message', () => {
    expect(messagesFor(FundCreateSchema, { ...validFund, target_size_usd: 0 })).toContain(
      'Target size must be a positive amount',
    );
    expect(messagesFor(FundCreateSchema, { ...validFund, target_size_usd: -1 })).toContain(
      'Target size must be a positive amount',
    );
  });

  it('rejects an unknown status with a descriptive message', () => {
    expect(messagesFor(FundCreateSchema, { ...validFund, status: 'Liquidated' })).toContain(
      'Status must be one of: Fundraising, Investing, Closed',
    );
  });

  it('rejects unknown keys rather than stripping them', () => {
    expect(FundCreateSchema.safeParse({ ...validFund, surprise: true }).success).toBe(false);
  });
});

describe('FundUpdateSchema', () => {
  const validUpdate = { ...validFund, id: '11111111-1111-1111-1111-111111111111' };

  it('accepts a valid update', () => {
    expect(FundUpdateSchema.parse(validUpdate)).toEqual(validUpdate);
  });

  it('inherits create constraints with their messages', () => {
    expect(messagesFor(FundUpdateSchema, { ...validUpdate, target_size_usd: -1 })).toContain(
      'Target size must be a positive amount',
    );
  });

  it('rejects a missing id', () => {
    expect(FundUpdateSchema.safeParse(validFund).success).toBe(false);
  });

  it('rejects a non-uuid id with a descriptive message', () => {
    expect(messagesFor(FundUpdateSchema, { ...validUpdate, id: 'not-a-uuid' })).toContain(
      'Fund id must be a valid UUID',
    );
  });

  it('rejects an attempt to update the created date', () => {
    expect(
      FundUpdateSchema.safeParse({ ...validUpdate, created_at: '2020-01-01' }).success,
    ).toBe(false);
  });
});
