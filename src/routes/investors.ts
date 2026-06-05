import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { InvestorCreateSchema, InvestorResponseSchema } from '../schemas/investor';
import { InvestorService } from '../services/InvestorService';

export async function investorRoutes(app: FastifyInstance) {
  const r = app.withTypeProvider<ZodTypeProvider>();
  const service = new InvestorService(app.db);

  r.get(
    '/investors',
    {
      schema: {
        tags: ['Investors'],
        summary: 'List all investors',
        response: { 200: z.array(InvestorResponseSchema) },
      },
    },
    () => service.list(),
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
    async (req, reply) => {
      const investor = await service.create(req.body);
      return reply.code(201).send(investor);
    },
  );
}
