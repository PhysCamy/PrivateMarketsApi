# Titanbay Private Markets API — Specification

## Overview
REST API implementing the Titanbay Private Markets spec (v1.0.0).
Stack: **Fastify** + **Drizzle ORM** + **Zod** + **PostgreSQL** + **TypeScript**

---

## Project Structure

```
src/
  db/
    schema.ts          # Drizzle table definitions
    index.ts           # DB connection (drizzle + pg Pool)
  routes/
    funds.ts
    investors.ts
    investments.ts
  schemas/             # Zod schemas — separate request and response schemas per resource
    fund.ts            # FundCreateSchema, FundUpdateSchema, FundResponseSchema
    investor.ts        # InvestorCreateSchema, InvestorResponseSchema
    investment.ts      # InvestmentCreateSchema, InvestmentResponseSchema
  plugins/
    db.ts              # Fastify plugin that decorates app with db
  app.ts               # Fastify instance setup, registers plugins + routes
  server.ts            # Entry point (listen)
drizzle.config.ts
.env
```

---

## Dependencies

```json
"dependencies": {
  "fastify": "^4",
  "fastify-type-provider-zod": "^1",
  "drizzle-orm": "^0.30",
  "pg": "^8",
  "zod": "^3",
  "dotenv": "^16"
},
"devDependencies": {
  "drizzle-kit": "^0.20",
  "typescript": "^5",
  "@types/pg": "^8",
  "tsx": "^4"
}
```

---

## Database Schema

### funds
| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK, default gen_random_uuid() |
| name | text | NOT NULL |
| vintage_year | integer | NOT NULL |
| target_size_usd | numeric | NOT NULL |
| status | text | NOT NULL — `'Fundraising' \| 'Investing' \| 'Closed'` |
| created_at | timestamp | default now() |

### investors
| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK, default gen_random_uuid() |
| name | text | NOT NULL |
| investor_type | text | NOT NULL — `'Individual' \| 'Institution' \| 'Family Office'` |
| email | text | NOT NULL, UNIQUE |
| created_at | timestamp | default now() |

### investments
| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK, default gen_random_uuid() |
| investor_id | uuid | FK → investors.id |
| fund_id | uuid | FK → funds.id |
| amount_usd | numeric | NOT NULL |
| investment_date | date | NOT NULL |

---

## Endpoints

### Funds

| Method | Path | Status | Description |
|--------|------|--------|-------------|
| GET | /funds | 200 | List all funds |
| POST | /funds | 201 | Create a new fund |
| PUT | /funds | 200 | Update a fund (id in request body) |
| GET | /funds/:id | 200 | Get a single fund |

**Fund object**
```json
{
  "id": "uuid",
  "name": "string",
  "vintage_year": 2024,
  "target_size_usd": 1000000,
  "status": "Fundraising | Investing | Closed",
  "created_at": "datetime"
}
```

---

### Investors

| Method | Path | Status | Description |
|--------|------|--------|-------------|
| GET | /investors | 200 | List all investors |
| POST | /investors | 201 | Create a new investor |

**Investor object**
```json
{
  "id": "uuid",
  "name": "string",
  "investor_type": "Individual | Institution | Family Office",
  "email": "string",
  "created_at": "datetime"
}
```

---

### Investments

| Method | Path | Status | Description |
|--------|------|--------|-------------|
| GET | /funds/:fund_id/investments | 200 | List investments for a fund |
| POST | /funds/:fund_id/investments | 201 | Create an investment (fund_id from path) |

**Investment object**
```json
{
  "id": "uuid",
  "investor_id": "uuid",
  "fund_id": "uuid",
  "amount_usd": 500000,
  "investment_date": "date"
}
```

---

## Setup Files

- **`drizzle.config.ts`** — points to `src/db/schema.ts`, outputs migrations to `drizzle/migrations/`
- **`.env`** — `DATABASE_URL=postgres://user:password@localhost:5432/private_markets`
- **`tsconfig.json`** — `strict: true`, `moduleResolution: bundler`, target `ES2022`
- **`package.json` scripts**
  - `dev` — `tsx watch src/server.ts`
  - `build` — `tsc`
  - `migrate` — `drizzle-kit push`

---

## Error Handling

| Scenario | Status Code |
|----------|-------------|
| Resource not found | 404 |
| Validation failure (Zod) | 400 (handled automatically by `fastify-type-provider-zod`) |
| Duplicate email (`POST /investors`) | 409 |
| Server error | 500 |

---

## Verification Checklist

- [ ] `npm run migrate` — schema applied to local Postgres
- [ ] `npm run dev` — server starts without errors
- [ ] `POST /funds` → 201 + Fund object
- [ ] `GET /funds/:id` → correct fund returned
- [ ] `POST /investors` → 201 + Investor object
- [ ] Invalid request body → 400 with Zod validation details
