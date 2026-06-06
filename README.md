# Private Markets API

A REST API for managing private-market funds, investors, and investments.

**Stack:** [Fastify](https://fastify.dev) · [Drizzle ORM](https://orm.drizzle.team) · [Zod](https://zod.dev) · PostgreSQL · TypeScript

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

From a fresh clone, three commands get the server running (assuming local Postgres is already running):

```bash
npm install     # 1. Install dependencies
npm run setup   # 2. Create the database and apply the schema
npm run seed    # 3. (Optional) Load example funds, investors, and investments
npm run dev     # 4. Start the dev server
```

`npm run setup` creates a `.env` from `.env.example` if you don't have one, then connects to Postgres using `DATABASE_URL` and creates the role and database if they don't exist before applying the schema. With the default `.env.example` it works out of the box on a local Postgres. It's safe to re-run.

`npm run seed` is optional — it resets the tables and loads a small set of example funds, investors, and investments so you have data to explore the endpoints with straight away. It's safe to re-run and starts from a clean slate each time. Skip it if you'd rather start with an empty database.

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
| `npm run seed` | `tsx tests/integration/seed.ts` | Reset the tables and load example fixtures. |
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

Request and response bodies are validated against Zod schemas, so malformed input returns `400` with field-level detail.

### Interactive docs

With the server running, an auto-generated OpenAPI/Swagger UI is available at **http://localhost:3000/docs** for browsing and trying out the endpoints.

You can also view the API specification at the following link: **https://storage.googleapis.com/interview-api-doc-funds.wearebusy.engineering/index.html#investments**.

---

## Troubleshooting

**`npm run migrate` fails to connect** — Confirm Postgres is running and `DATABASE_URL` in `.env` matches a real role, password, and database. Test the connection directly by passing your connection string to `psql` (e.g. `psql postgres://user:password@localhost:5432/private_markets`).

**`database "private_markets" does not exist`** — Run `createdb private_markets` (or `CREATE DATABASE private_markets;` from `psql`).

**`function gen_random_uuid() does not exist`** — Your Postgres is older than 13. Upgrade, or enable the extension with `psql -d private_markets -c 'CREATE EXTENSION IF NOT EXISTS pgcrypto;'`.

---

## Assumptions and design decisions

Validation happens in two layers. **Shape and format** are checked at the HTTP boundary with [Zod](https://zod.dev) schemas (`src/schemas/`) before any database access — these are stateless rules that depend only on the request, and a failure returns `400` with field-level detail. **Business rules** that need existing data live in the services (`src/services/`), and run only once the request is known to be well-formed. The status codes follow that split: `400` for malformed input, `404` for a referenced resource that doesn't exist, `409` for a conflict with existing data, and `422` for input that is well-formed but breaks a business rule.

I made some key assumptions regarding the business functionality of the app which can be broken down by entity:

### Funds

1. **Name** is required and capped at 100 characters.
2. **Vintage year** must be a whole number from 1970 up to the current year — funds can't have a future vintage.
3. **Target size** must be a positive amount, stored as a `numeric` column for precision (see [Monetary amounts](#monetary-amounts) below).
4. **Status** is one of `Fundraising`, `Investing`, or `Closed`.
5. A **`Closed` fund is immutable** — updates are rejected with `422`.
6. A fund's **target size cannot be reduced below the total already committed** by its investments (`422`); growing it, or reducing it while it still covers committed capital, is fine.

### Investors

1. **Name** is required and capped at 100 characters.
2. **Email** must be a valid address and is **unique** across investors — a duplicate returns `409`. Uniqueness is enforced by a database constraint and translated from the Postgres unique-violation error, rather than a read-then-write check that could race.
3. **Investor type** is one of `Individual`, `Institution`, or `Family Office`.

### Investments

1. **Investor id** must be a valid UUID, and the investor must exist (`404` otherwise).
2. **Amount** must be a positive amount, stored as a `numeric` column for precision.
3. **Investment date** must be a valid date and cannot be in the future.
4. An investment can only be made in a fund that **exists** (`404`) and is in **`Fundraising`** status (`422`) — funds that are `Investing` or `Closed` are no longer raising capital.
5. The **total committed to a fund cannot exceed its target size** (`422`); the proposed amount is summed with existing investments and checked before insert.

### Monetary amounts

`target_size_usd` and `amount_usd` are stored in Postgres `numeric` columns, which Drizzle surfaces as strings to preserve arbitrary precision. The services convert these to JavaScript `number`s at the API boundary for summing and comparison; values beyond `2^53` would lose precision, which is an accepted limitation for the amounts this API deals with.

### General

- **IDs and timestamps are server-owned.** Primary keys are UUIDs from `gen_random_uuid()` and `created_at` is set by the database, so clients never supply them.
- **Strict request bodies.** Every create/update schema is `.strict()`, so unknown or misspelled fields are rejected rather than silently ignored.
- **No authentication.** The API is unauthenticated — out of scope for this exercise — so all endpoints are open.

---

## AI usage during development

I have used Claude Code throughout the development process for both planning and execution.

### Planning

I used Claude Sonnet 4.6 to put together a technical specification for the app initially. This involved discussions around trade-offs (e.g. deciding to use Fastify because it is more lightweight that Express and offers improved performance), the required API schema and the required DB schema. 

Before starting to build, I used a multi-agent review skill to provide feedback on the plan. Different agents applied different lenses on the plan, including Correctness, Consistency, Performance and Maintainability.

### Building

I switched across to Opus 4.8 for the build itself, which I executed in multiple stages. After each stage, I personally reviewed the generated code as well as running a Claude review agent which spawned subagents in the relevant domains (e.g. Correctness, Performance etc.). Any time I generated test cases, I checked the following personally:
- Do the tests actually test what I expect, or are there blind spots I've missed?
- Are the individual test cases correct?
- Is the test coverage adequate given my knowledge of the business requirements?

I started by generating the basic app setup including the app.ts, server.ts and relevant config files. I then generated the input and output schemas using Zod, plus validation tests. Then I generated the API routes and checked that I could run the app and access the endpoints. At this point I added config to generate Swagger API docs which made manual testing easier. I verified manually that each endpoint was working as expected (at this point returning a 500 'not implemented' exception). Next, I generated the DB schema using Drizzle. Finally, I generated the service layer where I took extra care to think about business-level validation which I verified by generating unit tests.

### Testing

I had a suite of unit tests for the schema validation as well as the service layer which I'd added/verified as I went along. These tests were all passing. I then generated a set of integration tests which made HTTP requests for each endpoint and required a postgres DB to be setup. I had some issues with my local installation of postgres, but quickly resolved these with Claude's assistance. I generated scripts to setup the database (including user creation) and seed it with some example data. I personally verified that all of these scripts worked as expected and were idempotent. While manually testing with the postgres DB I realised it would be useful to have a teardown script to easily start from scratch with a clean DB.

At the end, I used Claude to generate the majority of this README, ensuring setup would be smooth and that any assumptions declared in the technical spec were clearly articulated.
