import { pgTable, uuid, text, integer, numeric, timestamp, date } from 'drizzle-orm/pg-core';

export const funds = pgTable('funds', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  vintageYear: integer('vintage_year').notNull(),
  targetSizeUsd: numeric('target_size_usd').notNull(),
  status: text('status').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const investors = pgTable('investors', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  investorType: text('investor_type').notNull(),
  email: text('email').notNull().unique(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const investments = pgTable('investments', {
  id: uuid('id').primaryKey().defaultRandom(),
  investorId: uuid('investor_id')
    .notNull()
    .references(() => investors.id),
  fundId: uuid('fund_id')
    .notNull()
    .references(() => funds.id),
  amountUsd: numeric('amount_usd').notNull(),
  investmentDate: date('investment_date').notNull(),
});
