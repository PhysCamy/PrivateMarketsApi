import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { FundCreateSchema, FundUpdateSchema, FundResponseSchema } from '../schemas/fund';
import { FundService } from '../services/FundService';

export async function fundRoutes(app: FastifyInstance) {
  const r = app.withTypeProvider<ZodTypeProvider>();
  const service = new FundService(app.db);

  r.get(
    '/funds',
    {
      schema: {
        tags: ['Funds'],
        summary: 'List all funds',
        response: { 200: z.array(FundResponseSchema) },
      },
    },
    () => service.list(),
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
    async (req, reply) => {
      const fund = await service.create(req.body);
      return reply.code(201).send(fund);
    },
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
    (req) => service.update(req.body),
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
    (req) => service.getById(req.params.id),
  );
}
