import { z } from 'zod';

export const fundStatus = z.enum(['Fundraising', 'Investing', 'Closed']);

export const FundCreateSchema = z.object({
  name: z.string(),
  vintage_year: z.number().int(),
  target_size_usd: z.number(),
  status: fundStatus,
});

export const FundUpdateSchema = FundCreateSchema.extend({
  id: z.string().uuid(),
});

export const FundResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  vintage_year: z.number().int(),
  target_size_usd: z.number(),
  status: fundStatus,
  created_at: z.string(),
});

export type FundCreate = z.infer<typeof FundCreateSchema>;
export type FundUpdate = z.infer<typeof FundUpdateSchema>;
export type FundResponse = z.infer<typeof FundResponseSchema>;
