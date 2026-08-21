"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, Check, Clock3, MessageSquare, RefreshCw, X } from "lucide-react";
import { useParams } from "next/navigation";

import { AppShell } from "@/app/_components/v2/AppShell";
import { InlineAlert, Skeleton, StatePanel, StatusBadge } from "@/app/_components/common/DesignPrimitives";
import { environment } from "@/app/config/environment";
import { useAuthStore } from "@/app/store/useAuthStore";

type Profile = { full_name?: string; username?: string; job?: string; is_verified?: boolean };
type Job = { id: string; title: string; description: string; budget_min?: string | null; budget_max?: string | null; currency: string; delivery_mode: string; country?: string; state?: string; city?: string; area?: string; needed_by?: string | null; status: string; moderation_status: string; response_count: number; category?: { name?: string } };
type Proposal = { id: string; job_title: string; professional: Profile; message: string; proposed_price?: string | null; currency: string; status: string; created_at: string };
type Paginated<T> = T[] | { results?: T[] };
const unwrap = <T,>(payload: Paginated<T>): T[] => Array.isArray(payload) ? payload : payload.results || [];

function budget(job: Job) {
  if (job.budget_min && job.budget_max) return `${job.currency} ${job.budget_min}–${job.budget_max}`;
  if (job.budget_min) return `From ${job.currency} ${job.budget_min}`;
  if (job.budget_max) return `Up to ${job.currency} ${job.budget_max}`;
  return "Budget not specified";
}

export default function ClientJobDetailPage() {
  const params = useParams<{ id: string }>();
  const access = useAuthStore((state) => state.access);
  const [job, setJob] = useState<Job | null>(null);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deciding, setDeciding] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!access) return;
    setLoading(true); setError("");
    try {
      const [jobsResponse, proposalsResponse] = await Promise.all([
        fetch(`${environment.djangoUrl}/api/marketplace/jobs/?mine=1`, { headers: { Authorization: `Bearer ${access}` }, cache: "no-store" }),
        fetch(`${environment.djangoUrl}/api/marketplace/job-responses/`, { headers: { Authorization: `Bearer ${access}` }, cache: "no-store" }),
      ]);
      if (!jobsResponse.ok) throw new Error("This job could not be loaded.");
      const jobs = unwrap<Job>(await jobsResponse.json());
      const selected = jobs.find((item) => item.id === params.id) || null;
      if (!selected) throw new Error("This job was not found in your Client workspace.");
      setJob(selected);
      if (!proposalsResponse.ok) throw new Error("Job responses could not be loaded.");
      const all = unwrap<Proposal>(await proposalsResponse.json());
      setProposals(all.filter((proposal) => proposal.job_title === selected.title));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "This job could not be loaded.");
    } finally { setLoading(false); }
  }, [access, params.id]);

  useEffect(() => { void load(); }, [load]);

  async function decide(proposalId: string, status: "shortlisted" | "declined") {
    if (!access) return;
    setDeciding(proposalId); setError("");
    try {
      const response = await fetch(`${environment.djangoUrl}/api/marketplace/job-responses/${proposalId}/decision/`, {
        method: "POST",
        headers: { Authorization: `Bearer ${access}`, "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.detail || "The proposal decision could not be saved.");
      setProposals((items) => items.map((item) => item.id === proposalId ? { ...item, status: body.status || status } : item));
    } catch (decisionError) {
      setError(decisionError instanceof Error ? decisionError.message : "The proposal decision could not be saved.");
    } finally { setDeciding(null); }
  }

  const location = useMemo(() => job ? ([job.area, job.city, job.state, job.country].filter(Boolean).join(", ") || (job.delivery_mode === "remote" ? "Remote" : "Location not set")) : "", [job]);

  return (
    <AppShell>
      <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
        <Link href="/jobs" className="inline-flex min-h-11 items-center gap-2 text-sm font-black text-primary"><ArrowLeft size={17} aria-hidden="true" />Back to My Jobs</Link>
        {error ? <InlineAlert tone="error" className="mt-4"><p>{error}</p><button onClick={() => void load()} className="mt-2 inline-flex items-center gap-2 font-black text-primary"><RefreshCw size={16} aria-hidden="true" />Retry</button></InlineAlert> : null}
        {loading ? <div className="mt-5 space-y-4"><Skeleton className="h-48 w-full" /><Skeleton className="h-40 w-full" /></div> : job ? <>
          <section className="mt-4 rounded-[var(--sabi-radius-lg)] border border-border bg-card p-5 shadow-[var(--sabi-shadow-sm)] sm:p-6">
            <div className="flex flex-wrap gap-2"><StatusBadge tone={job.status === "open" ? "success" : "neutral"}>{job.status}</StatusBadge><StatusBadge tone={job.moderation_status === "approved" ? "success" : "warning"}>{job.moderation_status}</StatusBadge></div>
            <h1 className="mt-3 text-3xl font-black tracking-[-.03em]">{job.title}</h1>
            <p className="mt-3 max-w-3xl whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{job.description}</p>
            <div className="mt-5 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4"><div><p className="font-bold text-muted-foreground">Category</p><p className="mt-1 font-black">{job.category?.name || "Service request"}</p></div><div><p className="font-bold text-muted-foreground">Budget</p><p className="mt-1 font-black">{budget(job)}</p></div><div><p className="font-bold text-muted-foreground">Delivery</p><p className="mt-1 font-black capitalize">{job.delivery_mode.replaceAll("_", " ")}</p></div><div><p className="font-bold text-muted-foreground">Location</p><p className="mt-1 font-black">{location}</p></div></div>
            {job.moderation_status !== "approved" ? <InlineAlert tone="info" className="mt-5"><Clock3 size={18} aria-hidden="true" /><p>Your job is not discoverable to Professionals until moderation is approved.</p></InlineAlert> : null}
          </section>

          <section className="mt-8" aria-labelledby="proposal-heading">
            <div className="flex items-end justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-[.14em] text-primary">Decision workspace</p><h2 id="proposal-heading" className="mt-1 text-2xl font-black">Proposals <span className="text-muted-foreground">({proposals.length})</span></h2></div><Link href="/messages" className="text-sm font-black text-primary">Messages</Link></div>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">Shortlisting signals interest only. The Professional starts the proposal-linked conversation next; booking and payment remain separate agreements.</p>
            {proposals.length === 0 ? <div className="mt-5"><StatePanel title="No proposals yet" description={job.moderation_status === "approved" ? "Your approved job is live. Professional responses will appear here." : "Responses can begin after the job is approved and visible."} tone="empty" /></div> : <div className="mt-5 grid gap-4">{proposals.map((proposal) => {
              const name = proposal.professional?.full_name || proposal.professional?.username || "Professional";
              return <article key={proposal.id} className="rounded-[var(--sabi-radius-lg)] border border-border bg-card p-5 shadow-[var(--sabi-shadow-sm)]">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><div className="flex flex-wrap items-center gap-2"><h3 className="text-lg font-black">{name}</h3>{proposal.professional?.is_verified ? <StatusBadge tone="success">Identity verified</StatusBadge> : null}</div><p className="mt-1 text-xs font-bold text-muted-foreground">{proposal.professional?.job || "SabiWay Professional"}</p></div><StatusBadge tone={proposal.status === "shortlisted" ? "success" : proposal.status === "declined" ? "neutral" : "info"}>{proposal.status}</StatusBadge></div>
                <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{proposal.message}</p>
                <div className="mt-4 flex flex-wrap gap-4 text-sm"><span className="font-black">{proposal.proposed_price ? `${proposal.currency} ${proposal.proposed_price}` : "Price not proposed"}</span><span className="text-muted-foreground">Received {new Date(proposal.created_at).toLocaleDateString("en-GB", { dateStyle: "medium" })}</span></div>
                {proposal.status === "sent" ? <div className="mt-5 flex flex-wrap gap-2 border-t border-border pt-4"><button disabled={deciding === proposal.id} onClick={() => void decide(proposal.id, "shortlisted")} className="inline-flex min-h-11 items-center gap-2 rounded-[var(--sabi-radius-md)] bg-primary px-4 text-sm font-black text-primary-foreground disabled:opacity-60"><Check size={17} aria-hidden="true" />Shortlist</button><button disabled={deciding === proposal.id} onClick={() => void decide(proposal.id, "declined")} className="inline-flex min-h-11 items-center gap-2 rounded-[var(--sabi-radius-md)] border border-border px-4 text-sm font-black disabled:opacity-60"><X size={17} aria-hidden="true" />Decline</button></div> : proposal.status === "shortlisted" ? <InlineAlert tone="success" className="mt-5"><MessageSquare size={18} aria-hidden="true" /><p>Shortlisted. The Professional can now open the proposal-linked conversation. This is not yet a booking.</p></InlineAlert> : null}
              </article>;
            })}</div>}
          </section>
        </> : null}
      </main>
    </AppShell>
  );
}
