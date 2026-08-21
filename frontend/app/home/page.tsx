"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, BriefcaseBusiness, CalendarDays, MessageCircle, Search, ShieldCheck, UserRound, UsersRound, WalletCards } from "lucide-react";

import { AppShell } from "@/app/_components/v2/AppShell";
import { InlineAlert, Skeleton, StatusBadge } from "@/app/_components/common/DesignPrimitives";
import { environment } from "@/app/config/environment";
import { useAuthStore } from "@/app/store/useAuthStore";

type Paginated<T> = T[] | { results?: T[] };
type ClientJob = { id: string; title: string; status: string; moderation_status: string; response_count: number; category?: { name?: string } };
type Booking = { id: string; scope_summary: string; status: string; requested_for?: string | null; professional?: { full_name?: string }; agreed_price: string; currency: string };
type Thread = { id: string; unread_count?: number; professional?: { full_name?: string } };

type ClientSummary = { jobs: ClientJob[]; bookings: Booking[]; unreadMessages: number; unavailable: boolean };
const unwrap = <T,>(payload: Paginated<T>): T[] => Array.isArray(payload) ? payload : payload.results || [];

function ClientHome() {
  const user = useAuthStore((state) => state.user);
  const access = useAuthStore((state) => state.access);
  const firstName = user?.full_name?.trim().split(/\s+/)[0] || "there";
  const [summary, setSummary] = useState<ClientSummary>({ jobs: [], bookings: [], unreadMessages: 0, unavailable: false });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!access || user?.role !== "client") return;
    const load = async () => {
      setLoading(true);
      try {
        const headers = { Authorization: `Bearer ${access}` };
        const [jobResponse, bookingResponse, threadResponse] = await Promise.all([
          fetch(`${environment.djangoUrl}/api/marketplace/jobs/?mine=1`, { headers, cache: "no-store" }),
          fetch(`${environment.djangoUrl}/api/marketplace/bookings/`, { headers, cache: "no-store" }),
          fetch(`${environment.djangoUrl}/api/marketplace/threads/`, { headers, cache: "no-store" }),
        ]);
        if (![jobResponse, bookingResponse, threadResponse].every((response) => response.ok)) throw new Error("workspace unavailable");
        const [jobPayload, bookingPayload, threadPayload] = await Promise.all([jobResponse.json(), bookingResponse.json(), threadResponse.json()]);
        const threads = unwrap<Thread>(threadPayload);
        setSummary({
          jobs: unwrap<ClientJob>(jobPayload),
          bookings: unwrap<Booking>(bookingPayload),
          unreadMessages: threads.reduce((total, thread) => total + (thread.unread_count || 0), 0),
          unavailable: false,
        });
      } catch {
        setSummary((current) => ({ ...current, unavailable: true }));
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [access, user?.role]);

  const activeJobs = summary.jobs.filter((job) => ["open", "draft", "paused"].includes(job.status));
  const activeBookings = summary.bookings.filter((booking) => !["completed", "cancelled", "declined"].includes(booking.status));
  const nextBooking = activeBookings.find((booking) => booking.requested_for) || activeBookings[0];

  const primaryActions = [
    { href: "/marketplace", label: "Find a Professional", text: "Search services by the place where the work needs to happen.", icon: Search },
    { href: "/jobs", label: "Post or manage a job", text: "Describe the work and track responses without losing the job context.", icon: BriefcaseBusiness },
    { href: "/messages", label: "Continue conversations", text: "Keep service discussions connected to Professionals and bookings.", icon: MessageCircle },
  ];

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-9">
      <section className="overflow-hidden rounded-[var(--sabi-radius-xl)] bg-primary px-5 py-7 text-primary-foreground shadow-[var(--sabi-shadow-md)] sm:px-8 lg:px-10 lg:py-9">
        <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <p className="text-xs font-black uppercase tracking-[.16em] text-white/75">Client home</p>
            <h1 className="mt-2 text-3xl font-black tracking-[-.03em] sm:text-4xl">What needs your attention, {firstName}?</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/85 sm:text-base">Find trusted help, keep posted work moving, and see conversations, bookings and protected payment steps in one Client workspace.</p>
          </div>
          <Link href="/marketplace" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--sabi-radius-md)] bg-accent px-5 py-3 text-sm font-black text-accent-foreground">Find a Professional <ArrowRight size={17} aria-hidden="true" /></Link>
        </div>
      </section>

      {summary.unavailable ? <InlineAlert tone="warning" className="mt-5"><p className="font-black">Live workspace summary is temporarily unavailable.</p><p className="mt-1 font-normal">Your Client routes still work. Open My Jobs, Messages or Bookings directly to retry that resource.</p></InlineAlert> : null}

      <section className="mt-6 grid gap-3 sm:grid-cols-3" aria-label="Client activity summary">
        {loading ? [1, 2, 3].map((item) => <Skeleton key={item} className="h-28 w-full" />) : (
          <>
            <Link href="/jobs" className="rounded-[var(--sabi-radius-lg)] border border-border bg-card p-4 shadow-[var(--sabi-shadow-sm)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><p className="text-xs font-black uppercase tracking-[.1em] text-muted-foreground">Active jobs</p><p className="mt-2 text-3xl font-black">{activeJobs.length}</p><p className="mt-1 text-xs font-semibold text-muted-foreground">{summary.jobs.reduce((total, job) => total + (job.response_count || 0), 0)} total responses</p></Link>
            <Link href="/bookings" className="rounded-[var(--sabi-radius-lg)] border border-border bg-card p-4 shadow-[var(--sabi-shadow-sm)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><p className="text-xs font-black uppercase tracking-[.1em] text-muted-foreground">Active bookings</p><p className="mt-2 text-3xl font-black">{activeBookings.length}</p><p className="mt-1 text-xs font-semibold text-muted-foreground">Agreed work and schedule state</p></Link>
            <Link href="/messages" className="rounded-[var(--sabi-radius-lg)] border border-border bg-card p-4 shadow-[var(--sabi-shadow-sm)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><p className="text-xs font-black uppercase tracking-[.1em] text-muted-foreground">Unread messages</p><p className="mt-2 text-3xl font-black">{summary.unreadMessages}</p><p className="mt-1 text-xs font-semibold text-muted-foreground">Across marketplace conversations</p></Link>
          </>
        )}
      </section>

      <section className="mt-8" aria-labelledby="client-actions-heading">
        <p className="text-xs font-black uppercase tracking-[.14em] text-primary">Start or continue work</p>
        <h2 id="client-actions-heading" className="mt-1 text-2xl font-black">Your main Client actions</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {primaryActions.map(({ href, label, text, icon: Icon }) => (
            <Link key={label} href={href} className="group rounded-[var(--sabi-radius-lg)] border border-border bg-card p-5 shadow-[var(--sabi-shadow-sm)] transition hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <div className="flex h-11 w-11 items-center justify-center rounded-[var(--sabi-radius-md)] bg-[var(--sabi-primary-soft)] text-primary"><Icon size={21} aria-hidden="true" /></div>
              <h3 className="mt-4 text-lg font-black">{label}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p><span className="mt-4 inline-flex items-center gap-1 text-sm font-black text-primary">Open <ArrowRight size={15} aria-hidden="true" /></span>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-8 grid gap-4 lg:grid-cols-[1.25fr_.75fr]">
        <article className="rounded-[var(--sabi-radius-lg)] border border-border bg-card p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-[.1em] text-muted-foreground">Next booking</p><h2 className="mt-1 text-xl font-black">{nextBooking ? nextBooking.scope_summary : "No active booking"}</h2></div><CalendarDays className="text-primary" aria-hidden="true" /></div>
          {nextBooking ? <><p className="mt-3 text-sm leading-6 text-muted-foreground">With {nextBooking.professional?.full_name || "Professional"} · {nextBooking.requested_for ? new Date(nextBooking.requested_for).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" }) : "Schedule to be confirmed"}</p><div className="mt-4 flex flex-wrap items-center gap-2"><StatusBadge tone="info">{nextBooking.status.replaceAll("_", " ")}</StatusBadge><span className="text-sm font-black">{nextBooking.currency} {nextBooking.agreed_price}</span></div></> : <p className="mt-3 text-sm leading-6 text-muted-foreground">When scope and price are agreed with a Professional, the booking will appear here.</p>}
          <Link href="/bookings" className="mt-4 inline-flex min-h-10 items-center gap-1 text-sm font-black text-primary">View bookings <ArrowRight size={15} aria-hidden="true" /></Link>
        </article>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
          <Link href="/sabipay" className="rounded-[var(--sabi-radius-lg)] border border-border bg-card p-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><WalletCards className="text-primary" aria-hidden="true" /><h2 className="mt-3 font-black">SabiPay & history</h2><p className="mt-1 text-sm leading-6 text-muted-foreground">See payment protection and transaction status separately from booking status.</p></Link>
          <Link href="/community" className="rounded-[var(--sabi-radius-lg)] border border-border bg-card p-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><UsersRound className="text-primary" aria-hidden="true" /><h2 className="mt-3 font-black">SabiForum</h2><p className="mt-1 text-sm leading-6 text-muted-foreground">Use community context and practical guidance as support, not as a substitute for marketplace trust evidence.</p></Link>
        </div>
      </section>

      <section className="mt-6 grid gap-4 sm:grid-cols-2">
        <Link href="/profile" className="flex items-start gap-3 rounded-[var(--sabi-radius-lg)] border border-border bg-muted p-4"><UserRound className="mt-0.5 shrink-0 text-primary" size={20} aria-hidden="true" /><div><p className="font-black">Keep your Client profile current</p><p className="mt-1 text-sm leading-6 text-muted-foreground">Your account location can support defaults, but it never restricts where you search for services.</p></div></Link>
        <Link href="/trust-and-safety" className="flex items-start gap-3 rounded-[var(--sabi-radius-lg)] border border-border bg-muted p-4"><ShieldCheck className="mt-0.5 shrink-0 text-primary" size={20} aria-hidden="true" /><div><p className="font-black">Make trust visible at the decision point</p><p className="mt-1 text-sm leading-6 text-muted-foreground">Review verification, scope, conversation and completed-work signals before committing.</p></div></Link>
      </section>
    </main>
  );
}

function ProfessionalHome() {
  const user = useAuthStore((state) => state.user);
  const firstName = user?.full_name?.trim().split(/\s+/)[0] || "there";
  const actions = [
    { href: "/marketplace", label: "Find open jobs", text: "Browse Client needs that match your skills.", icon: Search },
    { href: "/profile", label: "Strengthen your profile", text: "Keep your service information and trust details current.", icon: UserRound },
    { href: "/messages", label: "Open messages", text: "Continue conversations with potential Clients.", icon: MessageCircle },
  ];
  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
      <section className="overflow-hidden rounded-[var(--sabi-radius-xl)] bg-primary px-5 py-8 text-primary-foreground shadow-[var(--sabi-shadow-md)] sm:px-8 lg:px-10 lg:py-10"><p className="text-xs font-black uppercase tracking-[.16em] text-white/80">Your SabiWay</p><div className="mt-2 grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end"><div><h1 className="text-3xl font-black tracking-tight sm:text-4xl">Welcome, {firstName}.</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-white/85 sm:text-base">Manage your Professional presence, discover relevant jobs and keep Client conversations moving.</p></div><Link href="/marketplace" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-accent px-4 py-3 text-sm font-black text-accent-foreground">Explore marketplace <ArrowRight size={17} aria-hidden="true" /></Link></div></section>
      <section className="mt-8"><p className="text-xs font-black uppercase tracking-[.14em] text-primary">Start here</p><h2 className="mt-1 text-2xl font-black">What would you like to do?</h2><div className="mt-4 grid gap-4 md:grid-cols-3">{actions.map(({ href, label, text, icon: Icon }) => <Link key={label} href={href} className="group rounded-2xl border border-border bg-card p-5 shadow-[var(--sabi-shadow-sm)] transition hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--sabi-primary-soft)] text-primary"><Icon size={21} aria-hidden="true" /></div><h3 className="mt-4 text-lg font-black">{label}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p><span className="mt-4 inline-flex items-center gap-1 text-sm font-black text-primary">Open <ArrowRight size={15} aria-hidden="true" /></span></Link>)}</div></section>
    </main>
  );
}

export default function HomePage() {
  const role = useAuthStore((state) => state.user?.role);
  return <AppShell>{role === "professional" ? <ProfessionalHome /> : <ClientHome />}</AppShell>;
}
