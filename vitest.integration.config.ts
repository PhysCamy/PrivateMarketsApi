import { defineConfig } from 'vitest/config';

/**
 * Integration suite runs against a live Postgres (the configured DATABASE_URL).
 * Files share one database and reseed in `beforeEach`, so they must run serially
 * to avoid clobbering each other.
 */
export default defineConfig({
  test: {
    include: ['tests/integration/**/*.test.ts'],
    fileParallelism: false,
    hookTimeout: 30_000,
  },
});
