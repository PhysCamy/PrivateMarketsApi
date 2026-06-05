import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { FundCreateSchema, FundUpdateSchema, FundResponseSchema } from '../schemas/fund';

const notImplemented = async () => {
  throw Object.assign(new Error('Not implemented'), { statusCode: 501 });
};

export async function fundRoutes(app: FastifyInstance) {
  const r = app.withTypeProvider<ZodTypeProvider>();

  r.get(
    '/funds',
    {
      schema: {
        tags: ['Funds'],
        summary: 'List all funds',
        response: { 200: z.array(FundResponseSchema) },
      },
    },
    notImplemented,
  );

  r.post(
    '/funds',
    {
      schema: {
        tags: ['Funds'],
        summary: 'Create a new fund',
        body: FundCreateSchema,
        response: { 201: FundResponseSchema },
      },
    },
    notImplemented,
  );

  r.put(
    '/funds',
    {
      schema: {
        tags: ['Funds'],
        summary: 'Update a fund',
        body: FundUpdateSchema,
        response: { 200: FundResponseSchema },
      },
    },
    notImplemented,
  );

  r.get(
    '/funds/:id',
    {
      schema: {
        tags: ['Funds'],
        summary: 'Get a single fund',
        params: z.object({ id: z.string().uuid() }),
        response: { 200: FundResponseSchema },
      },
    },
    notImplemented,
  );
}
