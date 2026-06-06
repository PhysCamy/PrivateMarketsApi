import type { Database } from '../db/index';
import { investors } from '../db/schema';
import type { InvestorCreate, InvestorResponse } from '../schemas/investor';
import { HttpError } from './errors';

type InvestorRow = typeof investors.$inferSelect;

function toResponse(row: InvestorRow): InvestorResponse {
  return {
    id: row.id,
    name: row.name,
    investor_type: row.investorType as InvestorResponse['investor_type'],
    email: row.email,
    created_at: row.createdAt!.toISOString(),
  };
}

const UNIQUE_VIOLATION = '23505';

function isUniqueViolation(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === UNIQUE_VIOLATION;
}

/**
 * Business logic and persistence for investors. Routes delegate here; this
 * class owns all database access for the `investors` resource.
 */
export class InvestorService {
  constructor(private readonly db: Database) {}

  /** Return all investors, newest first. */
  async list(): Promise<InvestorResponse[]> {
    const rows = await this.db.query.investors.findMany({
      orderBy: (i, { desc }) => [desc(i.createdAt)],
    });
    return rows.map(toResponse);
  }

  /** Insert a new investor. Throws 409 if the email is already in use. */
  async create(data: InvestorCreate): Promise<InvestorResponse> {
    try {
      const [investor] = await this.db
        .insert(investors)
        .values({
          name: data.name,
          investorType: data.investor_type,
          email: data.email,
        })
        .returning();
      return toResponse(investor);
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new HttpError(409, 'An investor with this email already exists');
      }
      throw error;
    }
  }
}
