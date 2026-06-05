import fp from 'fastify-plugin';
import { db } from '../db/index';

declare module 'fastify' {
  interface FastifyInstance {
    db: typeof db;
  }
}

export default fp(async (app) => {
  app.decorate('db', db);
});
