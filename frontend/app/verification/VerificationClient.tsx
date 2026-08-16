"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CheckCircle2, FileCheck2, FileUp, Info, ShieldCheck, TimerReset } from "lucide-react";

import { PublicShell } from "@/app/_components/v2/PublicShell";
import { environment } from "@/app/config/environment";

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
  address_verification_required?: boolean;
};

const input = "min-h-11 w-full rounded-xl border border-[#d5e2da] bg-white px-3 text-sm outline-none transition focus:border-[#008753] focus:ring-2 focus:ring-[#008753]/10";
const statusLabels: Record<string, string> = { not_submitted: "Not submitted", submitted: "Submitted", in_review: "In review", approved: "Approved", rejected: "Rejected", more_info: "More information needed" };

export default function VerificationClient() {
  const [token, setToken] = useState("");
  const [submission, setSubmission] = useState<Submission>({ status: "not_submitted" });
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const headers = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);
  const needsResubmission = ["rejected", "more_info"].includes(submission.status);

  useEffect(() => {
    const access = window.localStorage.getItem("access") || "";
    if (!access) { window.location.href = "/login?next=/verification"; return; }
    setToken(access);
  }, []);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true); setError("");
    const response = await fetch(`${environment.djangoUrl}/api/verification/submissions/me/`, { headers });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) setError(payload.detail || "Could not load verification status.");
    else setSubmission(payload as Submission);
    setLoading(false);
  }, [headers, token]);

  useEffect(() => { load(); }, [load]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSending(true); setError(""); setNotice("");
    const data = new FormData(event.currentTarget);
    const endpoint = needsResubmission ? "resubmit/" : "";
    const response = await fetch(`${environment.djangoUrl}/api/verification/submissions/${endpoint}`, { method: "POST", headers, body: data });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      const first = typeof payload === "object" ? Object.values(payload)[0] : null;
      setError(Array.isArray(first) ? String(first[0]) : payload.detail || payload.non_field_errors?.[0] || "Verification submission could not be sent.");
    } else {
      setSubmission(payload as Submission);
      setNotice(needsResubmission ? "Updated evidence submitted for review." : "Verification submitted for manual review.");
      event.currentTarget.reset();
    }
    setSending(false);
  }

  const approved = submission.status === "approved";

  return (
    <PublicShell>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <div className="rounded-[2rem] bg-[#073522] p-6 text-white sm:p-9">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div><p className="text-xs font-black uppercase tracking-[.16em] text-[#9dd9bd]">Provider trust</p><h1 className="mt-2 text-3xl font-black sm:text-4xl">Professional verification</h1><p className="mt-3 max-w-2xl leading-7 text-white/72">Verification is manually reviewed. Only approved professionals receive the verified badge and can move into live marketplace bookings.</p></div>
            <div className="rounded-2xl bg-white/10 px-5 py-4"><p className="text-xs font-bold uppercase tracking-wide text-white/60">Current status</p><p className="mt-1 text-xl font-black">{statusLabels[submission.status] || submission.status}</p>{submission.version ? <p className="mt-1 text-xs text-white/60">Submission version {submission.version}</p> : null}</div>
          </div>
        </div>

        {error ? <div role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-800">{error}</div> : null}
        {notice ? <div role="status" className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-900">{notice}</div> : null}

        {loading ? <div className="py-16 text-center font-bold text-[#607168]">Loading verification status…</div> : (
          <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_.9fr]">
            <section className="rounded-3xl border border-[#dce8e1] bg-white p-5 sm:p-7">
              {approved ? (
                <div className="py-8 text-center"><CheckCircle2 className="mx-auto text-[#008753]" size={52}/><h2 className="mt-4 text-2xl font-black text-[#173126]">Verification approved</h2><p className="mx-auto mt-2 max-w-lg leading-7 text-[#69786f]">Your verified status is now available to SabiWay marketplace surfaces. Changes to verified information may require another review.</p><Link href="/marketplace" className="mt-6 inline-flex rounded-xl bg-[#008753] px-5 py-3 font-black text-white">Go to marketplace</Link></div>
              ) : submission.status === "submitted" || submission.status === "in_review" ? (
                <div className="py-8"><TimerReset className="text-[#008753]" size={42}/><h2 className="mt-4 text-2xl font-black">Manual review in progress</h2><p className="mt-2 leading-7 text-[#69786f]">You can track the review here. SabiWay will show a verified badge only after an authorised reviewer approves the evidence.</p>{submission.sla_due_at ? <p className="mt-4 rounded-xl bg-[#f4f8f6] p-3 text-sm font-semibold">Internal review target: {new Date(submission.sla_due_at).toLocaleString()}</p> : null}</div>
              ) : (
                <form onSubmit={submit} className="grid gap-5" encType="multipart/form-data">
                  <div><h2 className="text-2xl font-black text-[#173126]">{needsResubmission ? "Update your evidence" : "Submit for verification"}</h2><p className="mt-2 text-sm leading-6 text-[#68776f]">Use clear, current documents. Government ID is required. Skill or experience evidence should be included where it applies to your service.</p></div>
                  {submission.more_info_request ? <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm"><strong>More information requested:</strong> {submission.more_info_request}</div> : null}
                  {submission.decision_reason ? <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm"><strong>Decision reason:</strong> {submission.decision_reason}</div> : null}
                  <label className="grid gap-2 text-sm font-bold">Government ID type<select name="identity_type" required className={input} defaultValue={submission.identity_type || "passport"}><option value="passport">Passport</option><option value="national_id">National ID</option><option value="drivers_licence">Driver&apos;s licence</option><option value="other">Other government-issued ID</option></select></label>
                  <label className="grid gap-2 text-sm font-bold">Government ID document<input name="identity_document" type="file" accept="image/jpeg,image/png,image/webp,application/pdf" required className={`${input} py-2`} aria-describedby="id-help"/><span id="id-help" className="text-xs font-normal text-[#718078]">JPG, PNG, WebP or PDF. Maximum 10 MB.</span></label>
                  <label className="grid gap-2 text-sm font-bold">Skill or experience summary<textarea name="credential_summary" rows={4} className={`${input} py-3`} defaultValue={submission.credential_summary || ""} placeholder="Qualifications, experience or evidence relevant to the services you offer"/></label>
                  <label className="grid gap-2 text-sm font-bold">Credential / experience evidence <span className="font-normal text-[#718078]">(where applicable)</span><input name="credential_document" type="file" accept="image/jpeg,image/png,image/webp,application/pdf" className={`${input} py-2`}/></label>
                  <div className="rounded-2xl border border-[#e0e8e3] bg-[#f8fbf9] p-4"><div className="flex gap-2"><Info className="mt-0.5 shrink-0 text-[#008753]" size={18}/><div><p className="text-sm font-black">Address evidence is currently optional</p><p className="mt-1 text-xs leading-5 text-[#68776f]">The product specification leaves mandatory address verification subject to owner confirmation. You may provide it now, but it is not required for this submission.</p></div></div><div className="mt-4 grid gap-3 sm:grid-cols-2"><input name="address_line" className={input} placeholder="Address line (optional)"/><input name="city" className={input} placeholder="City (optional)"/><input name="state" className={input} placeholder="State/region (optional)"/><input name="country" className={input} placeholder="Country (optional)"/></div><label className="mt-3 grid gap-2 text-sm font-bold">Address evidence (optional)<input name="address_document" type="file" accept="image/jpeg,image/png,image/webp,application/pdf" className={`${input} py-2`}/></label></div>
                  <button disabled={sending} className="min-h-12 rounded-xl bg-[#008753] px-5 font-black text-white disabled:opacity-60">{sending ? "Uploading securely…" : needsResubmission ? "Resubmit evidence" : "Submit for manual review"}</button>
                </form>
              )}
            </section>

            <aside className="grid content-start gap-4">
              <div className="rounded-3xl border border-[#dce8e1] bg-white p-5"><ShieldCheck className="text-[#008753]"/><h2 className="mt-3 text-lg font-black">How your documents are handled</h2><div className="mt-3 grid gap-2 text-sm leading-6 text-[#68776f]"><p>➝ Verification files are encrypted before storage.</p><p>➝ Downloads require an authenticated owner or authorised reviewer.</p><p>➝ Document responses use private, no-store browser caching.</p><p>➝ Retention can be enforced without deleting the audit history.</p></div></div>
              <div className="rounded-3xl border border-[#dce8e1] bg-white p-5"><FileCheck2 className="text-[#008753]"/><h2 className="mt-3 text-lg font-black">Submitted evidence</h2>{submission.documents?.length ? <div className="mt-3 grid gap-2">{submission.documents.map((doc) => <a key={doc.id} href={doc.purged_at ? undefined : doc.id ? `${environment.djangoUrl}/api/verification/documents/${doc.id}/download/` : undefined} onClick={(event) => { if (!doc.purged_at) { event.preventDefault(); fetch(`${environment.djangoUrl}/api/verification/documents/${doc.id}/download/`, { headers }).then(async (r) => { if (!r.ok) return; const blob = await r.blob(); const url = URL.createObjectURL(blob); const anchor = document.createElement("a"); anchor.href = url; anchor.download = doc.filename; anchor.click(); URL.revokeObjectURL(url); }); } }} className="flex items-center gap-3 rounded-xl bg-[#f5f9f7] p-3 text-sm"><FileUp size={18} className="text-[#008753]"/><span className="min-w-0 flex-1 truncate font-bold">{doc.filename}</span><span className="text-xs text-[#718078]">v{doc.submission_version}</span></a>)}</div> : <p className="mt-3 text-sm text-[#718078]">No evidence uploaded yet.</p>}</div>
            </aside>
          </div>
        )}
      </main>
    </PublicShell>
  );
}
