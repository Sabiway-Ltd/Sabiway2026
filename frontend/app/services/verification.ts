import { api } from "./api";

export type VerificationStatus =
  | "not_submitted"
  | "submitted"
  | "in_review"
  | "approved"
  | "rejected"
  | "more_info";

export type VerificationDocument = {
  id: string;
  kind: string;
  filename: string;
  content_type: string;
  size: number;
  submission_version: number;
  created_at: string;
};

export type VerificationSubmission = {
  id?: string;
  status: VerificationStatus;
  identity_type?: string;
  credential_summary?: string;
  address_line?: string;
  city?: string;
  state?: string;
  country?: string;
  version?: number;
  submitted_at?: string | null;
  sla_due_at?: string | null;
  decision_reason?: string;
  more_info_request?: string;
  documents?: VerificationDocument[];
};

export type VerificationForm = {
  identityType: string;
  credentialSummary: string;
  addressLine: string;
  city: string;
  state: string;
  country: string;
  identityDocument: File;
  credentialDocument?: File | null;
  addressDocument?: File | null;
};

function toFormData(input: VerificationForm) {
  const form = new FormData();
  form.append("identity_type", input.identityType);
  form.append("credential_summary", input.credentialSummary);
  form.append("address_line", input.addressLine);
  form.append("city", input.city);
  form.append("state", input.state);
  form.append("country", input.country);
  form.append("identity_document", input.identityDocument);
  if (input.credentialDocument) form.append("credential_document", input.credentialDocument);
  if (input.addressDocument) form.append("address_document", input.addressDocument);
  return form;
}

export const verification = {
  getMine: async (): Promise<VerificationSubmission> => {
    const response = await api.get("/verification/submissions/me/");
    return response.data;
  },

  submit: async (input: VerificationForm): Promise<VerificationSubmission> => {
    const response = await api.post("/verification/submissions/", toFormData(input), {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  resubmit: async (input: VerificationForm): Promise<VerificationSubmission> => {
    const response = await api.post("/verification/submissions/resubmit/", toFormData(input), {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },
};
