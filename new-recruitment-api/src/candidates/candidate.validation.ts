import { CreateCandidateInput } from "./candidate.types";

const filled = (v: any): v is string =>
  typeof v === "string" && v.trim().length > 0;

export function validateCreateCandidate(body: any): {
  input: CreateCandidateInput;
  errors: string[];
} {
  const errors: string[] = [];
  const candidate = body ?? {};

  if (!candidate.firstName) errors.push("First name is required");
  if (!candidate.lastName) errors.push("Last name is required");

  if (!candidate.email) {
    errors.push("Email is required");
  }

  if (!/\S+@\S+\.\S+/.test(candidate.email)) {
    errors.push("Invalid email format");
  }

  const allowedStatuses = ["new", "in_progress", "accepted", "rejected"];
  if (
    candidate.status !== undefined &&
    !allowedStatuses.includes(candidate.status)
  ) {
    errors.push(`Status must in: ${allowedStatuses.join(", ")}`);
  }

  const offersOk =
    Array.isArray(candidate.jobOfferIds) &&
    candidate.jobOfferIds.length > 0 &&
    candidate.jobOfferIds.every(
      (id: unknown) => Number.isInteger(id) && (id as number) > 0,
    );
  if (!offersOk) {
    errors.push("One valid job offer is required");
  }

  const input: CreateCandidateInput = {
    firstName: filled(candidate.firstName)
      ? candidate.firstName.trim()
      : candidate.firstName,
    lastName: filled(candidate.lastName)
      ? candidate.lastName.trim()
      : candidate.lastName,
    email: filled(candidate.email)
      ? candidate.email.trim().toLowerCase()
      : candidate.email,
    phone: filled(candidate.phone) ? candidate.phone.trim() : null,
    yearsOfExperience: candidate.yearsOfExperience ?? null,
    recruiterNotes: filled(candidate.recruiterNotes)
      ? candidate.recruiterNotes.trim()
      : null,
    status: candidate.status,
    consentDate: candidate.consentDate ?? null,
    jobOfferIds: Array.isArray(candidate.jobOfferIds)
      ? [...new Set<number>(candidate.jobOfferIds)]
      : [],
  };

  return { input, errors };
}
