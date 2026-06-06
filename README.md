# Titanbay Private Markets API

A REST API for managing private-market funds, investors, and investments.

**Stack:** [Fastify](https://fastify.dev) · [Drizzle ORM](https://orm.drizzle.team) · [Zod](https://zod.dev) · PostgreSQL · TypeScript

> **Status:** Project scaffold. All routes are defined and request/response validation is wired up, but the handlers are stubs that return `501 Not Implemented`. Business logic is implemented in a later step.

---

## Prerequisites

| Tool | Version | Notes |
|------|---------|-------|
| [Node.js](https://nodejs.org) | 20 or newer | The server uses ESM and top-level `await`. |
| npm | 9 or newer | Ships with Node. |
| [PostgreSQL](https://www.postgresql.org) | 13 or newer | Needs `gen_random_uuid()`, built in since Postgres 13. |

Check what you have:

```bash
node --version
psql --version
```

---

## Quick start

From a fresh clone, three commands get the server running:

```bash
npm install     # 1. Install dependencies
npm run setup   # 2. Create the database and apply the schema
npm run dev     # 3. Start the dev server
```

`npm run setup` creates a `.env` from `.env.example` if you don't have one, then connects to Postgres using `DATABASE_URL` and creates the role and database if they don't exist before applying the schema. With the default `.env.example` it works out of the box on a local Postgres. It's safe to re-run.

The server listens on **http://localhost:3000** by default, with interactive Swagger UI docs at **http://localhost:3000/docs**.

> Make sure Postgres is running first.

---

## Environment variables

Configuration is read from `.env` (loaded automatically via `dotenv`).

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | Yes | — | PostgreSQL connection string. |
| `PORT` | No | `3000` | Port the HTTP server binds to. |

`.env.example` ships with a placeholder:

```
DATABASE_URL=postgres://user:password@localhost:5432/private_markets
```

This works as-is against a local Postgres — `npm run setup` creates the role and database for you. Change it to point at a different Postgres if you need to. The format is:

```
postgres://<role>:<password>@<host>:<port>/<database>
```

`.env` is git-ignored, so your real credentials never get committed.

---

## Database setup

`npm run setup` handles this for you: it reads `DATABASE_URL`, creates the role and database if they're missing, and applies the schema. If the role in your connection string doesn't exist, setup creates it by connecting as your local Postgres superuser (your OS user, or `PGUSER`). If that bootstrap connection can't be made, setup prints the `CREATE ROLE` command to run by hand.

The schema is applied with [`drizzle-kit push:pg`](https://orm.drizzle.team/kit-docs/overview), which syncs the tables defined in `src/db/schema.ts` directly to your database — no migration files needed for local development. To re-apply the schema on its own after changing it, run `npm run migrate`.

If you'd rather set things up by hand, create the role and database directly, then apply the schema:

```bash
psql -d postgres -c "CREATE ROLE \"user\" WITH LOGIN PASSWORD 'password' CREATEDB;"
createdb -O user private_markets
npm run migrate
```

> On Linux, run the `createdb`/`psql` commands through the `postgres` superuser (`sudo -u postgres …`); on Windows, run them from the bundled **SQL Shell (psql)**.

---

## Scripts

| Script | Command | Description |
|--------|---------|-------------|
| `npm run setup` | `node scripts/setup-db.mjs` | Create the database and apply the schema. |
| `npm run dev` | `tsx watch src/server.ts` | Start the server with hot reload. |
| `npm run build` | `tsc` | Compile TypeScript to `dist/`. |
| `npm run migrate` | `drizzle-kit push:pg` | Sync the Drizzle schema to the database. |
| `npm run typecheck` | `tsc --noEmit` | Type-check without emitting output. |

---

## API endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/funds` | List all funds. |
| `POST` | `/funds` | Create a fund. |
| `PUT` | `/funds` | Update a fund (`id` in request body). |
| `GET` | `/funds/:id` | Get a single fund. |
| `GET` | `/investors` | List all investors. |
| `POST` | `/investors` | Create an investor. |
| `GET` | `/funds/:fund_id/investments` | List investments for a fund. |
| `POST` | `/funds/:fund_id/investments` | Create an investment for a fund. |

Request and response bodies are validated against Zod schemas, so malformed input returns `400` with field-level detail. See [`SPEC.md`](./SPEC.md) for full object shapes.

### Interactive docs

With the server running, an auto-generated OpenAPI/Swagger UI is available at **http://localhost:3000/docs** for browsing and trying out the endpoints.

Quick check once the server is running:

```bash
curl -i http://localhost:3000/funds
# → 501 Not Implemented   (handler stub — logic lands in a later step)

curl -i http://localhost:3000/funds/not-a-uuid
# → 400 Bad Request       (Zod rejects the invalid uuid)
```

---

## Troubleshooting

**`npm run migrate` fails to connect** — Confirm Postgres is running and `DATABASE_URL` in `.env` matches a real role, password, and database. Test the connection directly by passing your connection string to `psql` (e.g. `psql postgres://user:password@localhost:5432/private_markets`).

**`database "private_markets" does not exist`** — Run `createdb private_markets` (or `CREATE DATABASE private_markets;` from `psql`).

**`function gen_random_uuid() does not exist`** — Your Postgres is older than 13. Upgrade, or enable the extension with `psql -d private_markets -c 'CREATE EXTENSION IF NOT EXISTS pgcrypto;'`.
