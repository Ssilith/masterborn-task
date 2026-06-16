import { Database } from "sqlite/build";
import {
  Candidate,
  CandidateStatus,
  CreateCandidateInput,
} from "./candidate.types";

interface Row {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  years_of_experience: number;
  recruiter_notes: string;
  status: CandidateStatus;
  consent_date: string;
  created_at: string;
}

export interface ListQuery {
  page: number;
  pageSize: number;
  jobOfferId?: number;
}

const mapRow = (row: Row, jobOfferIds: number[]): Candidate => ({
  id: row.id,
  firstName: row.first_name,
  lastName: row.last_name,
  email: row.email,
  phone: row.phone,
  yearsOfExperience: row.years_of_experience,
  recruiterNotes: row.recruiter_notes,
  status: row.status,
  consentDate: row.consent_date,
  createdAt: row.created_at,
  jobOfferIds,
});

export class CandidateRepository {
  constructor(private readonly db: Database) {}

  async findExistingJobOfferIds(ids: number[]): Promise<number[]> {
    if (ids.length === 0) return [];
    const placeholders = ids.map(() => "?").join(", ");
    const rows = await this.db.all<{ id: number }[]>(
      `SELECT id FROM JobOffer WHERE id IN (${placeholders})`,
      ids,
    );
    return rows.map((r) => r.id);
  }

  async emailExists(email: string): Promise<boolean> {
    const row = await this.db.get(
      `SELECT id FROM Candidate WHERE email = ?`,
      email,
    );
    return row !== undefined;
  }

  async create(
    input: CreateCandidateInput,
    onBeforeCommit: (c: Candidate) => Promise<void>,
  ): Promise<Candidate> {
    await this.db.exec("BEGIN");
    try {
      const result = await this.db.run(
        `INSERT INTO Candidate
                    (first_name, last_name, email, phone, years_of_experience,
                     recruiter_notes, status, consent_date)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        input.firstName,
        input.lastName,
        input.email,
        input.phone ?? null,
        input.yearsOfExperience ?? null,
        input.recruiterNotes ?? null,
        input.status ?? "new",
        input.consentDate ?? null,
      );

      const id = result.lastID as number;

      for (let i = 0; i < input.jobOfferIds.length; i++) {
        await this.db.run(
          `INSERT INTO CandidateJobOffer (candidate_id, job_offer_id) VALUES (?, ?)`,
          id,
          input.jobOfferIds[i],
        );
      }

      const candidate = await this.findById(id);
      if (!candidate) throw new Error("Could not read candidate after insert");

      await onBeforeCommit(candidate);

      await this.db.exec("COMMIT");
      return candidate;
    } catch (err) {
      await this.db.exec("ROLLBACK");
      throw err;
    }
  }

  async findById(id: number): Promise<Candidate | null> {
    const row = await this.db.get<Row>(
      `SELECT * FROM Candidate WHERE id = ?`,
      id,
    );
    if (!row) return null;
    const offers = await this.offerIdsFor(id);
    return mapRow(row, offers);
  }

  async get(query: ListQuery) {
    const offset = (query.page - 1) * query.pageSize;

    const where = query.jobOfferId
      ? `WHERE c.id IN (SELECT candidate_id FROM CandidateJobOffer WHERE job_offer_id = ?)`
      : "";
    const params = query.jobOfferId ? [query.jobOfferId] : [];

    const totalRow = await this.db.get<{ count: number }>(
      `SELECT COUNT(*) AS count FROM Candidate c ${where}`,
      ...params,
    );
    const total = totalRow?.count ?? 0;

    const rows = await this.db.all<Row[]>(
      `SELECT c.* FROM Candidate c ${where} ORDER BY c.id ASC LIMIT ? OFFSET ?`,
      ...params,
      query.pageSize,
      offset,
    );

    const data = await Promise.all(
      rows.map(async (r) => mapRow(r, await this.offerIdsFor(r.id))),
    );

    return {
      data,
      page: query.page,
      pageSize: query.pageSize,
      total,
      totalPages: Math.ceil(total / query.pageSize),
    };
  }

  private async offerIdsFor(candidateId: number): Promise<number[]> {
    const rows = await this.db.all<{ job_offer_id: number }[]>(
      `SELECT job_offer_id FROM CandidateJobOffer WHERE candidate_id = ?`,
      candidateId,
    );
    return rows.map((r) => r.job_offer_id);
  }
}
