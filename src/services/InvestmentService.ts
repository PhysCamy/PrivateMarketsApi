import type { Database } from '../db/index';
import { investments } from '../db/schema';
import type { InvestmentCreate, InvestmentResponse } from '../schemas/investment';
import { HttpError } from './errors';

type InvestmentRow = typeof investments.$inferSelect;

function toResponse(row: InvestmentRow): InvestmentResponse {
  return {
    id: row.id,
    investor_id: row.investorId,
    fund_id: row.fundId,
    // Drizzle returns `numeric` columns as strings to preserve arbitrary precision;
    // convert back to a number at the API boundary.
    amount_usd: Number(row.amountUsd),
    investment_date: row.investmentDate,
  };
}

/**
 * Business logic and persistence for investments. Routes delegate here; this
 * class owns all database access for the `investments` resource.
 */
export class InvestmentService {
  constructor(private readonly db: Database) {}

  /** Return all investments for a fund. Throws 404 if the fund does not exist. */
  async listByFund(fundId: string): Promise<InvestmentResponse[]> {
    const fund = await this.db.query.funds.findFirst({
      where: (f, { eq }) => eq(f.id, fundId),
    });
    if (!fund) throw new HttpError(404, 'Fund not found');

    const rows = await this.db.query.investments.findMany({
      where: (i, { eq }) => eq(i.fundId, fundId),
    });
    return rows.map(toResponse);
  }

  /**
   * Record an investment in a fund. Validates, in order: the fund exists (404),
   * the fund is Fundraising (422), the investor exists (404), and the new total
   * would not exceed the fund's target size (422).
   */
  async create(fundId: string, data: InvestmentCreate): Promise<InvestmentResponse> {
    const fund = await this.db.query.funds.findFirst({
      where: (f, { eq }) => eq(f.id, fundId),
    });
    if (!fund) throw new HttpError(404, 'Fund not found');
    if (fund.status !== 'Fundraising') {
      throw new HttpError(422, 'Investments can only be made in funds with Fundraising status');
    }

    const investor = await this.db.query.investors.findFirst({
      where: (i, { eq }) => eq(i.id, data.investor_id),
    });
    if (!investor) throw new HttpError(404, 'Investor not found');

    const existing = await this.db.query.investments.findMany({
      where: (i, { eq }) => eq(i.fundId, fundId),
    });
    // `amountUsd`/`targetSizeUsd` come back from Drizzle as strings (numeric
    // columns); convert to numbers for summing and comparison.
    const existingTotal = existing.reduce((sum, i) => sum + Number(i.amountUsd), 0);
    if (existingTotal + data.amount_usd > Number(fund.targetSizeUsd)) {
      throw new HttpError(422, 'Investment would exceed fund target size');
    }

    const [investment] = await this.db
      .insert(investments)
      .values({
        fundId,
        investorId: data.investor_id,
        // Drizzle represents `numeric` columns as strings in TS to preserve
        // arbitrary precision; stringify at the DB boundary.
        amountUsd: String(data.amount_usd),
        investmentDate: data.investment_date,
      })
      .returning();
    return toResponse(investment);
  }
}
