import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { InvestmentCreateSchema, InvestmentResponseSchema } from '../schemas/investment';
import { InvestmentService } from '../services/InvestmentService';

export async function investmentRoutes(app: FastifyInstance) {
  const r = app.withTypeProvider<ZodTypeProvider>();
  const service = new InvestmentService(app.db);

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
    (req) => service.listByFund(req.params.fund_id),
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
    async (req, reply) => {
      const investment = await service.create(req.params.fund_id, req.body);
      return reply.code(201).send(investment);
    },
  );
}
