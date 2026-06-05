import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { InvestorCreateSchema, InvestorResponseSchema } from '../schemas/investor';

const notImplemented = async () => {
  throw Object.assign(new Error('Not implemented'), { statusCode: 501 });
};

export async function investorRoutes(app: FastifyInstance) {
  const r = app.withTypeProvider<ZodTypeProvider>();

  r.get(
    '/investors',
    {
      schema: {
        tags: ['Investors'],
        summary: 'List all investors',
        response: { 200: z.array(InvestorResponseSchema) },
      },
    },
    notImplemented,
  );

  r.post(
    '/investors',
    {
      schema: {
        tags: ['Investors'],
        summary: 'Create a new investor',
        body: InvestorCreateSchema,
        response: { 201: InvestorResponseSchema },
      },
    },
    notImplemented,
  );
}
