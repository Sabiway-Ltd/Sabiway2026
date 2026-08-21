"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, BadgeCheck, BriefcaseBusiness, CalendarDays, FileText, MessageCircle, Store, WalletCards } from "lucide-react";

import { InlineAlert, Skeleton, StatusBadge } from "@/app/_components/common/DesignPrimitives";
import { environment } from "@/app/config/environment";
import { useAuthStore } from "@/app/store/useAuthStore";

type Paginated<T> = T[] | { results?: T[] };
type Listing = { id: string; title: string; moderation_status: string; is_active: boolean };
type Proposal = { id: string; job_title: string; status: string; proposed_price?: string | null; currency: string };
type Booking = { id: string; scope_summary: string; status: string; requested_for?: string | null; agreed_price: string; currency: string; client?: { full_name?: string } };
type Thread = { id: string; unread_count?: number };
type Transaction = { id: string; provider_amount: string; currency: string; state: string; payout?: { status?: string } | null };
type Summary = { listings: Listing[]; proposals: Proposal[]; bookings: Booking[]; unreadMessages: number; transactions: Transaction[]; unavailable: boolean };
const unwrap = <T,>(payload: Paginated<T>): T[] => Array.isArray(payload) ? payload : payload.results || [];

export default function ProfessionalHomeDashboard() {
  const user = useAuthStore((state) => state.user);
  const access = useAuthStore((state) => state.access);
  const firstName = user?.full_name?.trim().split(/\s+/)[0] || "there";
  const [summary, setSummary] = useState<Summary>({ listings: [], proposals: [], bookings: [], unreadMessages: 0, transactions: [], unavailable: false });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!access || user?.role !== "professional") return;
    const load = async () => {
      setLoading(true);
      try {
        const headers = { Authorization: `Bearer ${access}` };
        const [listingResponse, proposalResponse, bookingResponse, threadResponse, txResponse] = await Promise.all([
          fetch(`${environment.djangoUrl}/api/marketplace/listings/?mine=1`, { headers, cache: "no-store" }),
          fetch(`${environment.djangoUrl}/api/marketplace/job-responses/`, { headers, cache: "no-store" }),
          fetch(`${environment.djangoUrl}/api/marketplace/bookings/`, { headers, cache: "no-store" }),
          fetch(`${environment.djangoUrl}/api/marketplace/threads/`, { headers, cache: "no-store" }),
          fetch(`${environment.djangoUrl}/api/sabipay/transactions/`, { headers, cache: "no-store" }),
        ]);
        if (![listingResponse, proposalResponse, bookingResponse, threadResponse, txResponse].every((response) => response.ok)) throw new Error("workspace unavailable");
        const [listingPayload, proposalPayload, bookingPayload, threadPayload, txPayload] = await Promise.all([listingResponse.json(), proposalResponse.json(), bookingResponse.json(), threadResponse.json(), txResponse.json()]);
        const threads = unwrap<Thread>(threadPayload);
        setSummary({
          listings: unwrap<Listing>(listingPayload),
          proposals: unwrap<Proposal>(proposalPayload),
          bookings: unwrap<Booking>(bookingPayload),
          unreadMessages: threads.reduce((total, thread) => total + (thread.unread_count || 0), 0),
          transactions: unwrap<Transaction>(txPayload),
          unavailable: false,
        });
      } catch {
        setSummary((current) => ({ ...current, unavailable: true }));
      } finally { setLoading(false); }
    };
    void load();
  }, [access, user?.role]);

  const activeServices = summary.listings.filter((item) => item.is_active);
  const liveProposals = summary.proposals.filter((item) => !["declined", "withdrawn"].includes(item.status));
  const activeBookings = summary.bookings.filter((item) => !["completed", "cancelled", "declined"].includes(item.status));
  const nextBooking = activeBookings.find((item) => item.requested_for) || activeBookings[0];
  const releasedValue = useMemo(() => summary.transactions.filter((item) => item.state === "released" || item.payout?.status === "completed").reduce((sum, item) => sum + Number(item.provider_amount || 0), 0), [summary.transactions]);

  const actions = [
    { href: "/marketplace", label: "Find opportunities", text: "Browse approved Client jobs that match the work you want to win.", icon: BriefcaseBusiness },
    { href: "/professional/services", label: "Manage services", text: "Review the propositions Clients can discover and their publication state.", icon: Store },
    { href: "/proposals", label: "Track proposals", text: "Follow proposal decisions without confusing them with bookings or messages.", icon: FileText },
  ];

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-9">
      <section className="overflow-hidden rounded-[var(--sabi-radius-xl)] bg-primary px-5 py-7 text-primary-foreground shadow-[var(--sabi-shadow-md)] sm:px-8 lg:px-10 lg:py-9">
        <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end"><div><p className="text-xs font-black uppercase tracking-[.16em] text-white/75">Professional home</p><h1 className="mt-2 text-3xl font-black tracking-[-.03em] sm:text-4xl">Keep your pipeline moving, {firstName}.</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-white/85 sm:text-base">Manage the services you offer, opportunities you pursue, proposals you send, booked work, earnings and verification from one Professional workspace.</p></div><Link href="/marketplace" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--sabi-radius-md)] bg-accent px-5 py-3 text-sm font-black text-accent-foreground">Find opportunities <ArrowRight size={17} aria-hidden="true" /></Link></div>
      </section>

      {summary.unavailable ? <InlineAlert tone="warning" className="mt-5"><p className="font-black">Live Professional summary is temporarily unavailable.</p><p className="mt-1 font-normal">Your workspaces still remain available individually. Open Services, Proposals, Messages, Bookings or Earnings to retry that resource.</p></InlineAlert> : null}

      <section className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4" aria-label="Professional activity summary">
        {loading ? [1,2,3,4].map((item) => <Skeleton key={item} className="h-28 w-full" />) : <><Link href="/professional/services" className="rounded-[var(--sabi-radius-lg)] border border-border bg-card p-4"><p className="text-xs font-black uppercase tracking-[.1em] text-muted-foreground">Active services</p><p className="mt-2 text-3xl font-black">{activeServices.length}</p><p className="mt-1 text-xs text-muted-foreground">{summary.listings.length} total listings</p></Link><Link href="/proposals" className="rounded-[var(--sabi-radius-lg)] border border-border bg-card p-4"><p className="text-xs font-black uppercase tracking-[.1em] text-muted-foreground">Live proposals</p><p className="mt-2 text-3xl font-black">{liveProposals.length}</p><p className="mt-1 text-xs text-muted-foreground">Awaiting or progressing through decisions</p></Link><Link href="/bookings" className="rounded-[var(--sabi-radius-lg)] border border-border bg-card p-4"><p className="text-xs font-black uppercase tracking-[.1em] text-muted-foreground">Active bookings</p><p className="mt-2 text-3xl font-black">{activeBookings.length}</p><p className="mt-1 text-xs text-muted-foreground">Agreed work and schedule state</p></Link><Link href="/messages" className="rounded-[var(--sabi-radius-lg)] border border-border bg-card p-4"><p className="text-xs font-black uppercase tracking-[.1em] text-muted-foreground">Unread messages</p><p className="mt-2 text-3xl font-black">{summary.unreadMessages}</p><p className="mt-1 text-xs text-muted-foreground">Across Client conversations</p></Link></>}
      </section>

      <section className="mt-8"><p className="text-xs font-black uppercase tracking-[.14em] text-primary">Win and deliver work</p><h2 className="mt-1 text-2xl font-black">Your main Professional actions</h2><div className="mt-4 grid gap-4 md:grid-cols-3">{actions.map(({ href, label, text, icon: Icon }) => <Link key={label} href={href} className="group rounded-[var(--sabi-radius-lg)] border border-border bg-card p-5 shadow-[var(--sabi-shadow-sm)] transition hover:border-primary"><div className="flex h-11 w-11 items-center justify-center rounded-[var(--sabi-radius-md)] bg-[var(--sabi-primary-soft)] text-primary"><Icon size={21} aria-hidden="true" /></div><h3 className="mt-4 text-lg font-black">{label}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p><span className="mt-4 inline-flex items-center gap-1 text-sm font-black text-primary">Open <ArrowRight size={15} aria-hidden="true" /></span></Link>)}</div></section>

      <section className="mt-8 grid gap-4 lg:grid-cols-[1.2fr_.8fr]">
        <article className="rounded-[var(--sabi-radius-lg)] border border-border bg-card p-5 sm:p-6"><div className="flex items-center justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-[.1em] text-muted-foreground">Next booking</p><h2 className="mt-1 text-xl font-black">{nextBooking ? nextBooking.scope_summary : "No active booking"}</h2></div><CalendarDays className="text-primary" aria-hidden="true" /></div>{nextBooking ? <><p className="mt-3 text-sm leading-6 text-muted-foreground">Client: {nextBooking.client?.full_name || "Client"} · {nextBooking.requested_for ? new Date(nextBooking.requested_for).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" }) : "Schedule to be confirmed"}</p><div className="mt-4 flex flex-wrap items-center gap-2"><StatusBadge tone="info">{nextBooking.status.replaceAll("_", " ")}</StatusBadge><span className="text-sm font-black">{nextBooking.currency} {nextBooking.agreed_price}</span></div></> : <p className="mt-3 text-sm leading-6 text-muted-foreground">Accepted work will appear here once a Client conversation becomes a booking.</p>}<Link href="/bookings" className="mt-4 inline-flex min-h-10 items-center gap-1 text-sm font-black text-primary">View bookings <ArrowRight size={15} aria-hidden="true" /></Link></article>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1"><Link href="/earnings" className="rounded-[var(--sabi-radius-lg)] border border-border bg-card p-5"><WalletCards className="text-primary" aria-hidden="true" /><h2 className="mt-3 font-black">Earnings</h2><p className="mt-1 text-2xl font-black">NGN {releasedValue.toLocaleString("en-NG", { maximumFractionDigits: 2 })}</p><p className="mt-1 text-sm leading-6 text-muted-foreground">Released provider value. Open Earnings for pending and payout state.</p></Link><Link href="/verification" className="rounded-[var(--sabi-radius-lg)] border border-border bg-card p-5"><BadgeCheck className="text-primary" aria-hidden="true" /><h2 className="mt-3 font-black">Verification & trust</h2><p className="mt-1 text-sm leading-6 text-muted-foreground">Keep Professional verification evidence current and separate from listing moderation or proposal decisions.</p></Link></div>
      </section>

      <section className="mt-6 grid gap-4 sm:grid-cols-2"><Link href="/messages" className="flex items-start gap-3 rounded-[var(--sabi-radius-lg)] border border-border bg-muted p-4"><MessageCircle className="mt-0.5 shrink-0 text-primary" size={20} aria-hidden="true" /><div><p className="font-black">Keep work inside the conversation context</p><p className="mt-1 text-sm leading-6 text-muted-foreground">Messages connect opportunity, proposal and booking context without replacing their individual statuses.</p></div></Link><Link href="/profile" className="flex items-start gap-3 rounded-[var(--sabi-radius-lg)] border border-border bg-muted p-4"><Store className="mt-0.5 shrink-0 text-primary" size={20} aria-hidden="true" /><div><p className="font-black">Keep your Professional identity credible</p><p className="mt-1 text-sm leading-6 text-muted-foreground">Profile information supports discovery and trust, while service listings describe what you actually sell.</p></div></Link></section>
    </main>
  );
}
