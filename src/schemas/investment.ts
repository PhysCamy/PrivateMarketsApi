import { z } from 'zod';

export const InvestmentCreateSchema = z
  .object({
    investor_id: z.string().uuid('Investor id must be a valid UUID'),
    amount_usd: z.number().positive('Investment amount must be a positive amount'),
    investment_date: z
      .string()
      .refine((val) => !Number.isNaN(Date.parse(val)), {
        message: 'Investment date must be a valid date',
      })
      .refine((val) => val <= new Date().toISOString().split('T')[0], {
        message: 'Investment date cannot be in the future',
      }),
  })
  .strict();

export const InvestmentResponseSchema = z.object({
  id: z.string().uuid(),
  investor_id: z.string().uuid(),
  fund_id: z.string().uuid(),
  amount_usd: z.number(),
  investment_date: z.string(),
});

export type InvestmentCreate = z.infer<typeof InvestmentCreateSchema>;
export type InvestmentResponse = z.infer<typeof InvestmentResponseSchema>;
