"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ArrowRight, BriefcaseBusiness, Plus, RefreshCw } from "lucide-react";

import { AppShell } from "@/app/_components/v2/AppShell";
import { InlineAlert, Skeleton, StatePanel, StatusBadge } from "@/app/_components/common/DesignPrimitives";
import { useAuthStore } from "@/app/store/useAuthStore";
import { environment } from "@/app/config/environment";

type ClientJob = { id: string; title: string; description: string; budget_min?: string | null; budget_max?: string | null; currency: string; delivery_mode: string; country?: string; state?: string; city?: string; area?: string; needed_by?: string | null; status: string; moderation_status: string; response_count: number; category?: { name?: string } };
type Paginated<T> = T[] | { results?: T[] };
const unwrap = <T,>(payload: Paginated<T>): T[] => Array.isArray(payload) ? payload : payload.results || [];

function budget(job: ClientJob) {
  if (job.budget_min && job.budget_max) return `${job.currency} ${job.budget_min}–${job.budget_max}`;
  if (job.budget_min) return `From ${job.currency} ${job.budget_min}`;
  if (job.budget_max) return `Up to ${job.currency} ${job.budget_max}`;
  return "Budget not specified";
}

export default function ClientJobsPage() {
  const user = useAuthStore((state) => state.user);
  const access = useAuthStore((state) => state.access);
  const [jobs, setJobs] = useState<ClientJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadJobs = useCallback(async () => {
    if (!access) return;
    setLoading(true); setError(null);
    try {
      const response = await fetch(`${environment.djangoUrl}/api/marketplace/jobs/?mine=1`, { headers: { Authorization: `Bearer ${access}` }, cache: "no-store" });
      const payload = await response.json().catch(() => ([]));
      if (!response.ok) throw new Error(payload.detail || "Unable to load your jobs.");
      setJobs(unwrap<ClientJob>(payload));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load your jobs.");
    } finally { setLoading(false); }
  }, [access]);

  useEffect(() => {
    if (!user || !access) return;
    if (user.role !== "client") { window.location.href = "/home"; return; }
    void loadJobs();
  }, [user, access, loadJobs]);

  return (
    <AppShell>
      <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div><p className="text-xs font-black uppercase tracking-[.14em] text-primary">Client workspace</p><h1 className="mt-1 text-3xl font-black tracking-[-.03em]">My Jobs</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Post work, review Professional proposals and move deliberately into conversation and booking.</p></div>
          <Link href="/jobs/new" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--sabi-radius-md)] bg-primary px-4 py-2 text-sm font-black text-primary-foreground"><Plus size={18} aria-hidden="true" />Post a job</Link>
        </header>

        {error ? <InlineAlert tone="error" className="mt-6"><p>{error}</p><button className="mt-2 inline-flex items-center gap-2 font-black text-primary" onClick={() => void loadJobs()}><RefreshCw size={16} aria-hidden="true" />Retry</button></InlineAlert> : null}
        {loading ? <section className="mt-7 grid gap-3" aria-live="polite" aria-busy="true">{[1, 2, 3].map((item) => <Skeleton key={item} className="h-36 w-full" />)}</section> : jobs.length === 0 && !error ? <div className="mt-7"><StatePanel title="You have not posted a job yet" description="Create a clear request with scope, location and budget context. Relevant Professionals can respond after moderation." tone="empty" action={<Link href="/jobs/new" className="font-black text-primary">Post your first job</Link>} /></div> : <section className="mt-7 grid gap-3" aria-label="Your jobs">{jobs.map((job) => {
          const location = [job.area, job.city, job.state, job.country].filter(Boolean).join(", ") || (job.delivery_mode === "remote" ? "Remote" : "Location not set");
          return <article key={job.id} className="rounded-[var(--sabi-radius-lg)] border border-border bg-card p-5 shadow-[var(--sabi-shadow-sm)]"><div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><StatusBadge tone={job.status === "open" ? "success" : "neutral"}>{job.status}</StatusBadge><StatusBadge tone={job.moderation_status === "approved" ? "success" : "warning"}>{job.moderation_status}</StatusBadge></div><h2 className="mt-3 text-xl font-black">{job.title}</h2><p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">{job.description}</p><p className="mt-3 text-xs font-bold text-muted-foreground">{job.category?.name || "Service request"} · {location} · {budget(job)}</p></div><div className="shrink-0 rounded-[var(--sabi-radius-md)] bg-muted px-4 py-3 text-center"><p className="text-2xl font-black">{job.response_count ?? 0}</p><p className="text-xs font-bold text-muted-foreground">proposals</p></div></div><div className="mt-4 flex flex-wrap gap-3 border-t border-border pt-4"><Link href={`/jobs/${job.id}`} className="inline-flex min-h-10 items-center gap-1 text-sm font-black text-primary">Review job & proposals <ArrowRight size={15} aria-hidden="true" /></Link></div></article>;
        })}</section>}

        <aside className="mt-8 flex gap-3 rounded-[var(--sabi-radius-lg)] border border-border bg-muted p-4 text-sm leading-6 text-muted-foreground"><BriefcaseBusiness className="mt-0.5 shrink-0 text-primary" size={20} aria-hidden="true" /><p>Job moderation, proposal decisions, conversations, bookings and payments are separate lifecycle states. Moving forward in one does not silently complete another.</p></aside>
      </main>
    </AppShell>
  );
}
