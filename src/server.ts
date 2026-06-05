import { buildApp } from './app';

const app = buildApp();
const port = Number(process.env.PORT ?? 3000);

try {
  await app.listen({ port });
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
