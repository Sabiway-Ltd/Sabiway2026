import { environment } from "../config/environment";
import type { VerificationFile, VerificationSubmission } from "./types";

async function parse(response: Response) {
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const first = payload && typeof payload === "object" ? Object.values(payload)[0] : null;
    const detail = Array.isArray(first) ? String(first[0]) : payload.detail || payload.non_field_errors?.[0] || "Request failed.";
    throw new Error(detail);
  }
  return payload;
}

export async function getVerification(access: string): Promise<VerificationSubmission> {
  const response = await fetch(`${environment.djangoUrl}/api/verification/submissions/me/`, { headers: { Authorization: `Bearer ${access}` } });
  return parse(response);
}

export async function submitVerification(
  access: string,
  fields: { identityType: string; credentialSummary: string; addressLine: string; city: string; state: string; country: string },
  files: { identity: VerificationFile; credential?: VerificationFile | null; address?: VerificationFile | null },
  resubmit = false,
): Promise<VerificationSubmission> {
  const data = new FormData();
  data.append("identity_type", fields.identityType);
  data.append("credential_summary", fields.credentialSummary);
  data.append("address_line", fields.addressLine);
  data.append("city", fields.city);
  data.append("state", fields.state);
  data.append("country", fields.country);
  data.append("identity_document", files.identity as unknown as Blob);
  if (files.credential) data.append("credential_document", files.credential as unknown as Blob);
  if (files.address) data.append("address_document", files.address as unknown as Blob);
  const response = await fetch(`${environment.djangoUrl}/api/verification/submissions/${resubmit ? "resubmit/" : ""}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${access}` },
    body: data,
  });
  return parse(response);
}
