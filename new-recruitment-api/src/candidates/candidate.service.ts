import { Candidate, CreateCandidateInput } from "./candidate.types";
import { CandidateRepository, ListQuery } from "./candidate.repository";
import { LegacyApiClient } from "../legacy/legacy.client";
import { HttpError, ValidationError } from "../errors/http-error";
import { validateCreateCandidate } from "./candidate.validation";

export class CandidateService {
  constructor(
    private readonly repo: CandidateRepository,
    private readonly legacy: LegacyApiClient,
  ) {}

  async create(body: unknown): Promise<Candidate> {
    const { input, errors } = validateCreateCandidate(body);
    if (errors.length) throw new ValidationError(errors);

    await this.checkJobOffers(input);

    if (await this.repo.emailExists(input.email)) {
      throw new HttpError(409, "Candidate with this email already exists");
    }

    return this.repo.create(input, async (candidate) => {
      await this.legacy.createCandidate({
        firstName: candidate.firstName,
        lastName: candidate.lastName,
        email: candidate.email,
      });
    });
  }

  get(query: ListQuery) {
    return this.repo.get(query);
  }

  private async checkJobOffers(input: CreateCandidateInput): Promise<void> {
    const existing = await this.repo.findExistingJobOfferIds(input.jobOfferIds);
    const missing = input.jobOfferIds.filter((id) => !existing.includes(id));
    if (missing.length) {
      throw new ValidationError([
        `Unknown job offer id(s): ${missing.join(", ")}`,
      ]);
    }
  }
}
