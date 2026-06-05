import { z } from 'zod';

export const investorType = z.enum(['Individual', 'Institution', 'Family Office']);

export const InvestorCreateSchema = z.object({
  name: z.string(),
  investor_type: investorType,
  email: z.string().email(),
});

export const InvestorResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  investor_type: investorType,
  email: z.string().email(),
  created_at: z.string(),
});

export type InvestorCreate = z.infer<typeof InvestorCreateSchema>;
export type InvestorResponse = z.infer<typeof InvestorResponseSchema>;
