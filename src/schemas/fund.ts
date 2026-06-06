import { z } from 'zod';

export const fundStatus = z.enum(['Fundraising', 'Investing', 'Closed'], {
  errorMap: () => ({ message: 'Status must be one of: Fundraising, Investing, Closed' }),
});

export const FundCreateSchema = z
  .object({
    name: z
      .string()
      .min(1, 'Fund name is required')
      .max(100, 'Fund name must be 100 characters or fewer'),
    vintage_year: z
      .number()
      .int('Vintage year must be a whole number')
      .min(1970, 'Vintage year must be 1970 or later')
      .max(new Date().getFullYear(), 'Vintage year cannot be in the future'),
    target_size_usd: z.number().positive('Target size must be a positive amount'),
    status: fundStatus,
  })
  .strict();

export const FundUpdateSchema = FundCreateSchema.extend({
  id: z.string().uuid('Fund id must be a valid UUID'),
}).strict();

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
