import Fastify from 'fastify';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import {
  hasZodFastifySchemaValidationErrors,
  jsonSchemaTransform,
  serializerCompiler,
  validatorCompiler,
} from 'fastify-type-provider-zod';
import dbPlugin from './plugins/db';
import { fundRoutes } from './routes/funds';
import { investorRoutes } from './routes/investors';
import { investmentRoutes } from './routes/investments';

export function buildApp() {
  const app = Fastify({ logger: true });

  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  app.setErrorHandler((err, _req, reply) => {
    if (hasZodFastifySchemaValidationErrors(err)) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: 'Request validation failed',
        issues: err.validation.map(({ params: { issue } }) => ({
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
        title: 'Private Markets API',
        description: 'REST API implementing basic functionality around Private Markets investments.',
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
