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

From a fresh clone, these six steps get the server running:

> **Tested on macOS only.** The npm scripts (`install`, `migrate`, `dev`, `typecheck`) run through Node and behave identically on every platform, but the shell command in step 2 and the PostgreSQL commands in steps 4–5 differ on Windows and Linux. See [Platform notes](#platform-notes) for untested equivalents.

```bash
# 1. Install dependencies
npm install

# 2. Create your environment file
cp .env.example .env

# 3. Edit .env so DATABASE_URL points at your Postgres (see below)

# 4. Create the database
createdb private_markets

# 5. Apply the schema
npm run migrate

# 6. Start the dev server
npm run dev
```

The server listens on **http://localhost:3000** by default, with interactive Swagger UI docs at **http://localhost:3000/docs**.

### Platform notes

> The steps above were verified on **macOS** only. The equivalents below are provided for convenience but have **not been tested** on Windows or Linux.

**Step 2 — copying the env file.** `cp` works on macOS, Linux, and Windows PowerShell. In the legacy Windows Command Prompt (`cmd.exe`), use `copy` instead:

```cmd
copy .env.example .env
```

**Steps 4–5 — `createdb` / `psql` on your PATH.** Both ship with PostgreSQL but must be reachable on your `PATH`:

- **macOS / Linux** — usually on `PATH` already (Homebrew, apt, etc.).
- **Windows** — the official installer does not always add PostgreSQL's `bin\` directory to `PATH`. Either add it manually, or run the commands from the bundled **SQL Shell (psql)** shortcut.

**Linux — creating the database and role.** Many Linux installs use *peer authentication* for the `postgres` superuser, so run the setup through it:

```bash
sudo -u postgres createdb private_markets
sudo -u postgres psql -c "CREATE ROLE \"user\" WITH LOGIN PASSWORD 'password';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE private_markets TO \"user\";"
```

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

Edit it to match your local Postgres. The format is:

```
postgres://<role>:<password>@<host>:<port>/<database>
```

`.env` is git-ignored, so your real credentials never get committed.

---

## Database setup

The connection string above assumes a role named `user` with password `password`. Either edit `DATABASE_URL` to match an existing role, or create one to match it:

```bash
# Create the database
createdb private_markets

# (Optional) create a matching role if you don't already have one
psql -d postgres -c "CREATE ROLE \"user\" WITH LOGIN PASSWORD 'password';"
psql -d postgres -c "GRANT ALL PRIVILEGES ON DATABASE private_markets TO \"user\";"
```

> These commands are verified on macOS. On Linux, run them through the `postgres` superuser (`sudo -u postgres …`); on Windows, run them from the **SQL Shell (psql)**. See [Platform notes](#platform-notes).

Then push the schema:

```bash
npm run migrate
```

This uses [`drizzle-kit push:pg`](https://orm.drizzle.team/kit-docs/overview) to sync the tables defined in `src/db/schema.ts` directly to your database — no migration files needed for local development.

---

## Scripts

| Script | Command | Description |
|--------|---------|-------------|
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

## Project structure

```
src/
  db/
    schema.ts        # Drizzle table definitions (funds, investors, investments)
    index.ts         # pg Pool + Drizzle connection
  routes/
    funds.ts         # /funds endpoints
    investors.ts     # /investors endpoints
    investments.ts   # /funds/:fund_id/investments endpoints
  schemas/           # Zod schemas — separate request and response per resource
    fund.ts
    investor.ts
    investment.ts
  plugins/
    db.ts            # Fastify plugin decorating the app with `db`
  app.ts             # Builds the Fastify instance, registers plugins + routes
  server.ts          # Entry point (listen)
drizzle.config.ts    # Drizzle Kit config (schema path, migration output, credentials)
.env                 # Local environment (git-ignored)
```

---

## Troubleshooting

**`npm run migrate` fails to connect** — Confirm Postgres is running and `DATABASE_URL` in `.env` matches a real role, password, and database. Test the connection directly by passing your connection string to `psql` (e.g. `psql postgres://user:password@localhost:5432/private_markets`).

**`database "private_markets" does not exist`** — Run `createdb private_markets` (or `CREATE DATABASE private_markets;` from `psql`).

**`function gen_random_uuid() does not exist`** — Your Postgres is older than 13. Upgrade, or enable the extension with `psql -d private_markets -c 'CREATE EXTENSION IF NOT EXISTS pgcrypto;'`.
