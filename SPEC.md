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
    transactions.ts
    admin.ts
  schemas/             # Zod schemas (shared between validation + response types)
    fund.ts
    investor.ts
    investment.ts
    transaction.ts
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

### transactions
| Column | Type | Constraints |
|--------|------|-------------|
| transaction_id | uuid | PK, default gen_random_uuid() |
| fund_id | uuid | FK → funds.id |
| amount | numeric | NOT NULL |
| fee_percentage | numeric | NOT NULL |
| calculated_fees | numeric | NOT NULL |
| auto_calculate_fees | boolean | NOT NULL |
| bypass_validation | boolean | NOT NULL |
| status | text | NOT NULL — `'completed' \| 'pending' \| 'reversed'` |
| created_at | timestamp | default now() |

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

### Transactions

| Method | Path | Status | Description |
|--------|------|--------|-------------|
| GET | /transactions | 200 | List all transactions |
| POST | /transactions/process | 201 | Process a transaction with fee calculation |
| PUT | /transactions/:transaction_id/reverse | 200 | Reverse a transaction |
| GET | /funds/:fund_id/total-value | 200 | Aggregate fund value |

**POST /transactions/process — request body**
```json
{
  "fund_id": "uuid",
  "amount": 100000,
  "fee_percentage": 2.5,
  "auto_calculate_fees": true,
  "bypass_validation": false
}
```
Fee logic: when `auto_calculate_fees = true`, `calculated_fees = amount * (fee_percentage / 100)`

**PUT /transactions/:transaction_id/reverse — request body**
```json
{
  "reason": "string",
  "refund_fees": true
}
```
Sets transaction `status` to `"reversed"`.

**GET /funds/:fund_id/total-value — query params**
- `include_pending` (boolean, optional)

**Response**
```json
{
  "total_value": 1000000,
  "pending_value": 50000,
  "transaction_count": 12
}
```
`total_value` = SUM of `investments.amount_usd` for the fund.
`pending_value` = SUM of `transactions.amount` WHERE `status = 'pending'` (only when `include_pending=true`).

**Transaction object**
```json
{
  "transaction_id": "uuid",
  "fund_id": "uuid",
  "amount": "string",
  "fee_percentage": 2.5,
  "calculated_fees": 2500,
  "auto_calculate_fees": true,
  "bypass_validation": false,
  "status": "completed | pending | reversed",
  "created_at": "datetime"
}
```
Note: `amount` is serialised as a string in responses (per spec).

---

### Admin

| Method | Path | Status | Description |
|--------|------|--------|-------------|
| POST | /admin/recalculate-fees | 200 | Recalculate fees for all fund transactions |

**Request body**
```json
{
  "fund_id": "uuid",
  "new_fee_percentage": 3.0,
  "apply_retroactively": true
}
```

**Response**
```json
{
  "updated_transactions": 15,
  "total_additional_fees": 4500
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
| Server error | 500 |

---

## Verification Checklist

- [ ] `npm run migrate` — schema applied to local Postgres
- [ ] `npm run dev` — server starts without errors
- [ ] `POST /funds` → 201 + Fund object
- [ ] `GET /funds/:id` → correct fund returned
- [ ] `POST /investors` → 201 + Investor object
- [ ] `POST /funds/:id/investments` → FK resolved correctly
- [ ] `POST /transactions/process` → `calculated_fees` matches `amount * fee_percentage / 100`
- [ ] `GET /funds/:id/total-value?include_pending=true` → correct aggregation
- [ ] `PUT /transactions/:id/reverse` → status changes to `"reversed"`
- [ ] `POST /admin/recalculate-fees` → correct counts and fee totals returned
- [ ] Invalid request body → 400 with Zod validation details
