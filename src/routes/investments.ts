import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { InvestmentCreateSchema, InvestmentResponseSchema } from '../schemas/investment';

const notImplemented = async () => {
  throw Object.assign(new Error('Not implemented'), { statusCode: 501 });
};

export async function investmentRoutes(app: FastifyInstance) {
  const r = app.withTypeProvider<ZodTypeProvider>();

  r.get(
    '/funds/:fund_id/investments',
    {
      schema: {
        tags: ['Investments'],
        summary: 'List investments for a fund',
        params: z.object({ fund_id: z.string().uuid() }),
        response: { 200: z.array(InvestmentResponseSchema) },
      },
    },
    notImplemented,
  );

  r.post(
    '/funds/:fund_id/investments',
    {
      schema: {
        tags: ['Investments'],
        summary: 'Create an investment',
        params: z.object({ fund_id: z.string().uuid() }),
        body: InvestmentCreateSchema,
        response: { 201: InvestmentResponseSchema },
      },
    },
    notImplemented,
  );
}
