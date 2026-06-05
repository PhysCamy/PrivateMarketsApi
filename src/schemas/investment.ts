import { z } from 'zod';

export const InvestmentCreateSchema = z.object({
  investor_id: z.string().uuid(),
  amount_usd: z.number(),
  investment_date: z.string(),
});

export const InvestmentResponseSchema = z.object({
  id: z.string().uuid(),
  investor_id: z.string().uuid(),
  fund_id: z.string().uuid(),
  amount_usd: z.number(),
  investment_date: z.string(),
});

export type InvestmentCreate = z.infer<typeof InvestmentCreateSchema>;
export type InvestmentResponse = z.infer<typeof InvestmentResponseSchema>;
