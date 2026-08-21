"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ArrowRight, FileText, Loader2, MessageSquare, RefreshCw } from "lucide-react";

import { AppShell } from "@/app/_components/v2/AppShell";
import { InlineAlert, Skeleton, StatusBadge } from "@/app/_components/common/DesignPrimitives";
import { environment } from "@/app/config/environment";
import { useAuthStore } from "@/app/store/useAuthStore";

type Paginated<T> = T[] | { results?: T[] };
type Proposal = { id: string; job_title: string; message: string; proposed_price?: string | null; currency: string; status: string; created_at: string; updated_at: string };
const unwrap = <T,>(payload: Paginated<T>): T[] => Array.isArray(payload) ? payload : payload.results || [];

export default function ProposalsPage() {
  const access = useAuthStore((state) => state.access);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [startingThread, setStartingThread] = useState<string | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!access) return;
    setLoading(true); setError("");
    try {
      const response = await fetch(`${environment.djangoUrl}/api/marketplace/job-responses/`, { headers: { Authorization: `Bearer ${access}` }, cache: "no-store" });
      if (!response.ok) throw new Error("Your proposals could not be loaded.");
      setProposals(unwrap<Proposal>(await response.json()));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Your proposals could not be loaded.");
    } finally { setLoading(false); }
  }, [access]);

  useEffect(() => { void load(); }, [load]);

  async function startConversation(proposal: Proposal) {
    if (!access || proposal.status !== "shortlisted") return;
    setStartingThread(proposal.id); setError("");
    try {
      const response = await fetch(`${environment.djangoUrl}/api/marketplace/threads/`, {
        method: "POST",
        headers: { Authorization: `Bearer ${access}`, "Content-Type": "application/json" },
        body: JSON.stringify({ job_response_id: proposal.id }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        const existing = body?.existing_thread_id || body?.job_response_id?.existing_thread_id;
        if (!existing) throw new Error(typeof body.detail === "string" ? body.detail : "The conversation could not be opened.");
      }
      window.location.href = "/messages";
    } catch (threadError) {
      setError(threadError instanceof Error ? threadError.message : "The conversation could not be opened.");
    } finally { setStartingThread(null); }
  }

  return (
    <AppShell>
      <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-9">
        <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[.14em] text-primary">Professional workspace</p><h1 className="mt-1 text-3xl font-black">Proposals</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Track Client decisions on the proposals you sent. Only shortlisted proposals can progress into a proposal-linked conversation.</p></div><Link href="/marketplace" className="inline-flex min-h-11 items-center gap-2 rounded-[var(--sabi-radius-md)] bg-primary px-4 py-2.5 text-sm font-black text-primary-foreground">Find opportunities <ArrowRight size={16} aria-hidden="true" /></Link></div>
        {error ? <InlineAlert tone="warning" className="mt-5"><p className="font-black">{error}</p><button onClick={() => void load()} className="mt-2 inline-flex items-center gap-2 font-black text-primary"><RefreshCw size={16} aria-hidden="true" />Retry</button></InlineAlert> : null}
        <section className="mt-6 grid gap-4">
          {loading ? [1, 2, 3].map((item) => <Skeleton key={item} className="h-36 w-full" />) : proposals.length === 0 ? <div className="rounded-[var(--sabi-radius-lg)] border border-dashed border-border bg-card p-8 text-center"><FileText className="mx-auto text-primary" aria-hidden="true" /><h2 className="mt-3 text-xl font-black">No proposals yet</h2><p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-muted-foreground">When you respond to an approved Client job, your proposal will appear here with its current decision status.</p><Link href="/marketplace" className="mt-4 inline-flex min-h-11 items-center text-sm font-black text-primary">Browse jobs <ArrowRight size={16} aria-hidden="true" /></Link></div> : proposals.map((proposal) => <article key={proposal.id} className="rounded-[var(--sabi-radius-lg)] border border-border bg-card p-5 shadow-[var(--sabi-shadow-sm)]"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-[.1em] text-muted-foreground">Job proposal</p><h2 className="mt-1 text-xl font-black">{proposal.job_title}</h2></div><StatusBadge tone={proposal.status === "shortlisted" ? "success" : proposal.status === "declined" ? "neutral" : "info"}>{proposal.status.replaceAll("_", " ")}</StatusBadge></div><p className="mt-3 line-clamp-3 text-sm leading-6 text-muted-foreground">{proposal.message}</p><div className="mt-4 flex flex-wrap items-center gap-4 text-sm"><span className="font-black">{proposal.proposed_price ? `${proposal.currency} ${proposal.proposed_price}` : "Price not proposed"}</span><span className="text-muted-foreground">Sent {new Date(proposal.created_at).toLocaleDateString("en-GB", { dateStyle: "medium" })}</span></div>{proposal.status === "shortlisted" ? <div className="mt-5 border-t border-border pt-4"><button onClick={() => void startConversation(proposal)} disabled={startingThread === proposal.id} className="inline-flex min-h-11 items-center gap-2 rounded-[var(--sabi-radius-md)] bg-primary px-4 text-sm font-black text-primary-foreground disabled:opacity-60">{startingThread === proposal.id ? <Loader2 className="animate-spin" size={17} aria-hidden="true" /> : <MessageSquare size={17} aria-hidden="true" />}Start conversation</button><p className="mt-2 text-xs leading-5 text-muted-foreground">Starting a conversation does not create a booking or payment agreement.</p></div> : proposal.status === "sent" ? <p className="mt-5 border-t border-border pt-4 text-sm font-bold text-muted-foreground">Waiting for the Client’s decision.</p> : <p className="mt-5 border-t border-border pt-4 text-sm text-muted-foreground">This proposal cannot start a new job conversation in its current state.</p>}</article>)}
        </section>
      </main>
    </AppShell>
  );
}
