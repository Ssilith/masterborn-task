export interface Candidate {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  yearsOfExperience?: number | null;
  recruiterNotes?: string | null;
  status?: CandidateStatus;
  consentDate?: string | null;
  createdAt: string;
  jobOfferIds: number[];
}

export interface CreateCandidateInput {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  yearsOfExperience?: number | null;
  recruiterNotes?: string | null;
  status?: CandidateStatus;
  consentDate?: string | null;
  jobOfferIds: number[];
}

export type CandidateStatus = "new" | "in_progress" | "accepted" | "rejected";
