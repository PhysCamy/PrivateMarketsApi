import { z } from 'zod';

export const investorType = z.enum(['Individual', 'Institution', 'Family Office'], {
  errorMap: () => ({
    message: 'Investor type must be one of: Individual, Institution, Family Office',
  }),
});

export const InvestorCreateSchema = z.object({
  name: z
    .string()
    .min(1, 'Investor name is required')
    .max(100, 'Investor name must be 100 characters or fewer'),
  investor_type: investorType,
  email: z.string().email('A valid email address is required'),
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
