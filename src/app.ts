import Fastify from 'fastify';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import {
  jsonSchemaTransform,
  serializerCompiler,
  validatorCompiler,
} from 'fastify-type-provider-zod';
import { ZodError } from 'zod';
import dbPlugin from './plugins/db';
import { fundRoutes } from './routes/funds';
import { investorRoutes } from './routes/investors';
import { investmentRoutes } from './routes/investments';

export function buildApp() {
  const app = Fastify({ logger: true });

  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  app.setErrorHandler((err, _req, reply) => {
    if (err instanceof ZodError) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: 'Request validation failed',
        issues: err.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        })),
      });
    }
    return reply.send(err);
  });

  app.register(swagger, {
    openapi: {
      info: {
        title: 'Titanbay Private Markets API',
        description: 'REST API implementing the Titanbay Private Markets spec.',
        version: '1.0.0',
      },
    },
    transform: jsonSchemaTransform,
  });
  app.register(swaggerUi, { routePrefix: '/docs' });

  app.register(dbPlugin);
  app.register(fundRoutes);
  app.register(investorRoutes);
  app.register(investmentRoutes);

  return app;
}
