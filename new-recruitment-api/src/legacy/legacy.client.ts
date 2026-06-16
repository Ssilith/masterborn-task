import { HttpError } from "../errors/http-error";

export interface LegacyCandidatePayload {
  firstName: string;
  lastName: string;
  email: string;
}

export class LegacyApiClient {
  private readonly baseUrl: string;
  private readonly apiKey: string;

  constructor(baseUrl: string, apiKey: string) {
    this.baseUrl = baseUrl.replace(/\/$/, "");
    this.apiKey = apiKey;
  }

  async createCandidate(payload: LegacyCandidatePayload): Promise<void> {
    const res = await fetch(`${this.baseUrl}/candidates`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.apiKey,
      },
      body: JSON.stringify(payload),
    });

    if (res.status === 201) return;

    if (res.status === 409)
      throw new HttpError(409, "Candidate with this email already exists");

    throw new HttpError(502, `Failed to create candidate: ${res.status})`);
  }
}
