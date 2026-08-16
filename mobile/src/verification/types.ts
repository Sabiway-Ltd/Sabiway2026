export type VerificationStatus = "not_submitted" | "submitted" | "in_review" | "approved" | "rejected" | "more_info";

export type VerificationDocument = {
  id: string;
  kind: "identity" | "credential" | "address";
  filename: string;
  size: number;
  submission_version: number;
  created_at: string;
  purged_at?: string | null;
};

export type VerificationSubmission = {
  id?: string;
  status: VerificationStatus;
  identity_type?: string;
  credential_summary?: string;
  version?: number;
  submitted_at?: string | null;
  sla_due_at?: string | null;
  decision_reason?: string;
  more_info_request?: string;
  address_verification_required?: boolean;
  documents?: VerificationDocument[];
};

export type VerificationFile = { uri: string; name: string; type: string };
