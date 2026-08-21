"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, FileCheck2, FileUp, Info, ShieldCheck, TimerReset } from "lucide-react";

import { api } from "@/app/services/api";

type DocumentMeta = { id: string; kind: string; filename: string; size: number; submission_version: number; created_at: string; purged_at?: string | null };
type Submission = {
  id?: string;
  status: string;
  identity_type?: string;
  credential_summary?: string;
  version?: number;
  submitted_at?: string | null;
  sla_due_at?: string | null;
  decision_reason?: string;
  more_info_request?: string;
  documents?: DocumentMeta[];
};

type ApiError = { response?: { data?: Record<string, unknown> & { detail?: string; non_field_errors?: string[] } } };

const input = "min-h-11 w-full rounded-[var(--sabi-radius-md)] border border-border bg-card px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10";
const statusLabels: Record<string, string> = { not_submitted: "Not submitted", submitted: "Submitted", in_review: "In review", approved: "Approved", rejected: "Rejected", more_info: "More information needed" };

function errorMessage(error: unknown, fallback: string) {
  const payload = (error as ApiError)?.response?.data;
  if (!payload) return fallback;
  if (payload.detail) return payload.detail;
  if (payload.non_field_errors?.[0]) return payload.non_field_errors[0];
  const first = Object.values(payload)[0];
  return Array.isArray(first) && first.length ? String(first[0]) : fallback;
}

export default function VerificationClient() {
  const [submission, setSubmission] = useState<Submission>({ status: "not_submitted" });
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const needsResubmission = ["rejected", "more_info"].includes(submission.status);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.get<Submission>("/verification/submissions/me/");
      setSubmission(response.data);
    } catch (requestError) {
      setError(errorMessage(requestError, "Could not load verification status."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSending(true);
    setError("");
    setNotice("");
    const form = event.currentTarget;
    const data = new FormData(form);
    const endpoint = needsResubmission ? "/verification/submissions/resubmit/" : "/verification/submissions/";
    try {
      const response = await api.post<Submission>(endpoint, data, { headers: { "Content-Type": "multipart/form-data" } });
      setSubmission(response.data);
      setNotice(needsResubmission ? "Updated evidence submitted for review." : "Verification submitted for manual review.");
      form.reset();
    } catch (requestError) {
      setError(errorMessage(requestError, "Verification submission could not be sent."));
    } finally {
      setSending(false);
    }
  }

  async function downloadDocument(doc: DocumentMeta) {
    if (doc.purged_at) return;
    setError("");
    try {
      const response = await api.get<Blob>(`/verification/documents/${doc.id}/download/`, { responseType: "blob" });
      const url = URL.createObjectURL(response.data);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = doc.filename;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (requestError) {
      setError(errorMessage(requestError, "This verification document could not be downloaded."));
    }
  }

  const approved = submission.status === "approved";

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <section className="rounded-[var(--sabi-radius-xl)] bg-[var(--sabi-primary-strong)] p-6 text-white sm:p-9">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[.16em] text-white/70">Provider trust</p>
            <h1 className="mt-2 text-3xl font-black sm:text-4xl">Professional verification</h1>
            <p className="mt-3 max-w-2xl leading-7 text-white/80">Verification is manually reviewed. Only an approved backend decision creates the public Verified Professional signal.</p>
          </div>
          <div className="rounded-[var(--sabi-radius-lg)] bg-white/10 px-5 py-4">
            <p className="text-xs font-bold uppercase tracking-wide text-white/60">Current status</p>
            <p className="mt-1 text-xl font-black">{statusLabels[submission.status] || submission.status}</p>
            {submission.version ? <p className="mt-1 text-xs text-white/60">Submission version {submission.version}</p> : null}
          </div>
        </div>
      </section>

      {error ? <div role="alert" className="mt-5 rounded-[var(--sabi-radius-md)] border border-destructive/25 bg-destructive/5 p-4 text-sm font-semibold text-destructive">{error}</div> : null}
      {notice ? <div role="status" className="mt-5 rounded-[var(--sabi-radius-md)] border border-primary/25 bg-[var(--sabi-surface-selected)] p-4 text-sm font-semibold text-foreground">{notice}</div> : null}

      {loading ? (
        <div className="py-16 text-center text-sm font-bold text-muted-foreground" aria-live="polite">Loading verification status…</div>
      ) : (
        <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_.9fr]">
          <section className="rounded-[var(--sabi-radius-xl)] border border-border bg-card p-5 sm:p-7">
            {approved ? (
              <div className="py-8 text-center">
                <CheckCircle2 className="mx-auto text-primary" size={52} aria-hidden="true" />
                <h2 className="mt-4 text-2xl font-black">Verification approved</h2>
                <p className="mx-auto mt-2 max-w-lg leading-7 text-muted-foreground">Your approved verification can now appear as a distinct trust signal on marketplace surfaces. Completed-work reviews remain a separate reputation signal.</p>
                <Link href="/marketplace" className="mt-6 inline-flex min-h-11 items-center rounded-[var(--sabi-radius-md)] bg-primary px-5 font-black text-primary-foreground">Go to marketplace</Link>
              </div>
            ) : submission.status === "submitted" || submission.status === "in_review" ? (
              <div className="py-8">
                <TimerReset className="text-primary" size={42} aria-hidden="true" />
                <h2 className="mt-4 text-2xl font-black">Manual review in progress</h2>
                <p className="mt-2 leading-7 text-muted-foreground">You can track the review here. SabiWay shows the verified signal only after an authorised reviewer approves the evidence.</p>
                {submission.sla_due_at ? <p className="mt-4 rounded-[var(--sabi-radius-md)] bg-muted p-3 text-sm font-semibold">Review target: {new Date(submission.sla_due_at).toLocaleString()}</p> : null}
              </div>
            ) : (
              <form onSubmit={submit} className="grid gap-5" encType="multipart/form-data">
                <div>
                  <h2 className="text-2xl font-black">{needsResubmission ? "Update your evidence" : "Submit for verification"}</h2>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">Use clear, current documents. Government ID is required. Skill or experience evidence should be included where it applies to your service.</p>
                </div>
                {submission.more_info_request ? <div className="rounded-[var(--sabi-radius-md)] border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950"><strong>More information requested:</strong> {submission.more_info_request}</div> : null}
                {submission.decision_reason ? <div className="rounded-[var(--sabi-radius-md)] border border-destructive/25 bg-destructive/5 p-4 text-sm"><strong>Decision reason:</strong> {submission.decision_reason}</div> : null}
                <label className="grid gap-2 text-sm font-bold">Government ID type<select name="identity_type" required className={input} defaultValue={submission.identity_type || "passport"}><option value="passport">Passport</option><option value="national_id">National ID</option><option value="drivers_licence">Driver&apos;s licence</option><option value="other">Other government-issued ID</option></select></label>
                <label className="grid gap-2 text-sm font-bold">Government ID document<input name="identity_document" type="file" accept="image/jpeg,image/png,image/webp,application/pdf" required className={`${input} py-2`} aria-describedby="id-help"/><span id="id-help" className="text-xs font-normal text-muted-foreground">JPG, PNG, WebP or PDF. Maximum 10 MB.</span></label>
                <label className="grid gap-2 text-sm font-bold">Skill or experience summary<textarea name="credential_summary" rows={4} className={`${input} py-3`} defaultValue={submission.credential_summary || ""} placeholder="Qualifications, experience or evidence relevant to the services you offer"/></label>
                <label className="grid gap-2 text-sm font-bold">Credential / experience evidence <span className="font-normal text-muted-foreground">(where applicable)</span><input name="credential_document" type="file" accept="image/jpeg,image/png,image/webp,application/pdf" className={`${input} py-2`}/></label>
                <div className="rounded-[var(--sabi-radius-lg)] border border-border bg-muted p-4">
                  <div className="flex gap-2"><Info className="mt-0.5 shrink-0 text-primary" size={18} aria-hidden="true"/><div><p className="text-sm font-black">Address evidence is currently optional</p><p className="mt-1 text-xs leading-5 text-muted-foreground">You may provide address evidence, but it is not currently required for this submission.</p></div></div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2"><input name="address_line" className={input} placeholder="Address line (optional)"/><input name="city" className={input} placeholder="City (optional)"/><input name="state" className={input} placeholder="State/region (optional)"/><input name="country" className={input} placeholder="Country (optional)"/></div>
                  <label className="mt-3 grid gap-2 text-sm font-bold">Address evidence (optional)<input name="address_document" type="file" accept="image/jpeg,image/png,image/webp,application/pdf" className={`${input} py-2`}/></label>
                </div>
                <button disabled={sending} className="min-h-12 rounded-[var(--sabi-radius-md)] bg-primary px-5 font-black text-primary-foreground disabled:opacity-60">{sending ? "Uploading securely…" : needsResubmission ? "Resubmit evidence" : "Submit for manual review"}</button>
              </form>
            )}
          </section>

          <aside className="grid content-start gap-4">
            <section className="rounded-[var(--sabi-radius-xl)] border border-border bg-card p-5">
              <ShieldCheck className="text-primary" aria-hidden="true"/>
              <h2 className="mt-3 text-lg font-black">How your documents are handled</h2>
              <div className="mt-3 grid gap-2 text-sm leading-6 text-muted-foreground"><p>➝ Verification files are encrypted before storage.</p><p>➝ Downloads require the owner or an authorised reviewer.</p><p>➝ Document responses use private, no-store caching.</p><p>➝ Retention can be enforced without deleting audit history.</p></div>
            </section>
            <section className="rounded-[var(--sabi-radius-xl)] border border-border bg-card p-5">
              <FileCheck2 className="text-primary" aria-hidden="true"/>
              <h2 className="mt-3 text-lg font-black">Submitted evidence</h2>
              {submission.documents?.length ? <div className="mt-3 grid gap-2">{submission.documents.map((doc) => <button key={doc.id} type="button" disabled={Boolean(doc.purged_at)} onClick={() => void downloadDocument(doc)} className="flex min-h-11 items-center gap-3 rounded-[var(--sabi-radius-md)] bg-muted p-3 text-left text-sm disabled:opacity-50"><FileUp size={18} className="text-primary" aria-hidden="true"/><span className="min-w-0 flex-1 truncate font-bold">{doc.filename}</span><span className="text-xs text-muted-foreground">{doc.purged_at ? "Purged" : `v${doc.submission_version}`}</span></button>)}</div> : <p className="mt-3 text-sm text-muted-foreground">No evidence uploaded yet.</p>}
            </section>
          </aside>
        </div>
      )}
    </main>
  );
}
