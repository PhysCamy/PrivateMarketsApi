import { eq } from 'drizzle-orm';
import type { Database } from '../db/index';
import { funds } from '../db/schema';
import type { FundCreate, FundResponse, FundUpdate } from '../schemas/fund';
import { HttpError } from './errors';

type FundRow = typeof funds.$inferSelect;

function toResponse(row: FundRow): FundResponse {
  return {
    id: row.id,
    name: row.name,
    vintage_year: row.vintageYear,
    target_size_usd: Number(row.targetSizeUsd),
    status: row.status as FundResponse['status'],
    created_at: row.createdAt!.toISOString(),
  };
}

/**
 * Business logic and persistence for funds. Routes delegate here; this class
 * owns all database access for the `funds` resource.
 */
export class FundService {
  constructor(private readonly db: Database) {}

  /** Return all funds, newest first. */
  async list(): Promise<FundResponse[]> {
    const rows = await this.db.query.funds.findMany({
      orderBy: (f, { desc }) => [desc(f.createdAt)],
    });
    return rows.map(toResponse);
  }

  /** Return a single fund. Throws 404 if it does not exist. */
  async getById(id: string): Promise<FundResponse> {
    const fund = await this.db.query.funds.findFirst({
      where: (f, { eq }) => eq(f.id, id),
    });
    if (!fund) throw new HttpError(404, 'Fund not found');
    return toResponse(fund);
  }

  /** Insert a new fund and return it. */
  async create(data: FundCreate): Promise<FundResponse> {
    const [fund] = await this.db
      .insert(funds)
      .values({
        name: data.name,
        vintageYear: data.vintage_year,
        targetSizeUsd: String(data.target_size_usd),
        status: data.status,
      })
      .returning();
    return toResponse(fund);
  }

  /**
   * Update a fund by id. Throws 404 if absent, 422 if the fund is Closed, and
   * 422 if a reduced target size would fall below the fund's committed
   * investments.
   */
  async update(data: FundUpdate): Promise<FundResponse> {
    const current = await this.db.query.funds.findFirst({
      where: (f, { eq }) => eq(f.id, data.id),
    });
    if (!current) throw new HttpError(404, 'Fund not found');
    if (current.status === 'Closed') {
      throw new HttpError(422, 'Closed funds cannot be updated');
    }

    if (data.target_size_usd < Number(current.targetSizeUsd)) {
      const existing = await this.db.query.investments.findMany({
        where: (i, { eq }) => eq(i.fundId, data.id),
      });
      const committed = existing.reduce((sum, i) => sum + Number(i.amountUsd), 0);
      if (committed > data.target_size_usd) {
        throw new HttpError(422, 'Target size cannot be less than committed investments');
      }
    }

    const [fund] = await this.db
      .update(funds)
      .set({
        name: data.name,
        vintageYear: data.vintage_year,
        targetSizeUsd: String(data.target_size_usd),
        status: data.status,
      })
      .where(eq(funds.id, data.id))
      .returning();
    return toResponse(fund);
  }
}
