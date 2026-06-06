import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { InvestorCreateSchema } from '../../src/schemas/investor';

const validInvestor = {
  name: 'Jane Doe',
  investor_type: 'Individual',
  email: 'jane@example.com',
};

const messagesFor = (schema: z.ZodTypeAny, input: unknown): string[] => {
  const result = schema.safeParse(input);
  if (result.success) throw new Error('expected validation to fail');
  return result.error.issues.map((issue) => issue.message);
};

describe('InvestorCreateSchema', () => {
  it('accepts a valid investor', () => {
    expect(InvestorCreateSchema.parse(validInvestor)).toEqual(validInvestor);
  });

  it('rejects an empty name with a descriptive message', () => {
    expect(messagesFor(InvestorCreateSchema, { ...validInvestor, name: '' })).toContain(
      'Investor name is required',
    );
  });

  it('rejects a name longer than 100 characters with a descriptive message', () => {
    expect(messagesFor(InvestorCreateSchema, { ...validInvestor, name: 'x'.repeat(101) })).toContain(
      'Investor name must be 100 characters or fewer',
    );
  });

  it('rejects an unknown investor type with a descriptive message', () => {
    expect(messagesFor(InvestorCreateSchema, { ...validInvestor, investor_type: 'Robot' })).toContain(
      'Investor type must be one of: Individual, Institution, Family Office',
    );
  });

  it('accepts each allowed investor type', () => {
    for (const investor_type of ['Individual', 'Institution', 'Family Office']) {
      expect(InvestorCreateSchema.safeParse({ ...validInvestor, investor_type }).success).toBe(true);
    }
  });

  it('rejects a malformed email with a descriptive message', () => {
    expect(messagesFor(InvestorCreateSchema, { ...validInvestor, email: 'not-an-email' })).toContain(
      'A valid email address is required',
    );
  });
});
