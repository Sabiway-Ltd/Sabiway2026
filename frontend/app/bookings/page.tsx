"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { ArrowRight, CalendarDays, Check, Clock3, RefreshCw, Star, X } from "lucide-react";

import Button from "@/app/_components/common/Button";
import { AppShell } from "@/app/_components/v2/AppShell";
import { InlineAlert, Skeleton, StatePanel, StatusBadge } from "@/app/_components/common/DesignPrimitives";
import { api } from "@/app/services/api";
import { useAuthStore } from "@/app/store/useAuthStore";

type ProfileSummary = { user_id?: number; full_name?: string; username?: string };
type ScheduleProposal = {
  id: string;
  proposed_for: string;
  timezone: string;
  note?: string;
  status: string;
  proposer?: ProfileSummary;
};
type Booking = {
  id: string;
  thread: string;
  scope_summary: string;
  agreed_price: string;
  currency: string;
  requested_for?: string | null;
  timezone?: string;
  schedule_status?: string;
  status: string;
  message?: string;
  client?: ProfileSummary;
  professional?: ProfileSummary;
  schedule_proposals?: ScheduleProposal[];
  created_at?: string;
};
type BookingCapability = {
  booking_id: string;
  available_status_transitions: string[];
  can_propose_schedule: boolean;
  can_respond_to_active_schedule: boolean;
  active_schedule_proposal_id?: string | null;
  payment_state?: string | null;
};
type Review = { id: number; booking: string; rating: number; comment: string; professional_username: string; created_at: string };
type Paginated<T> = T[] | { results?: T[] };
const unwrap = <T,>(payload: Paginated<T>): T[] => Array.isArray(payload) ? payload : payload.results || [];

function bookingTone(status: string): "neutral" | "success" | "warning" | "danger" | "info" {
  if (["accepted", "in_progress"].includes(status)) return "info";
  if (status === "completed") return "success";
  if (["cancelled", "declined"].includes(status)) return "danger";
  if (status === "pending") return "warning";
  return "neutral";
}

function transitionLabel(status: string) {
  const labels: Record<string, string> = {
    accepted: "Accept booking",
    declined: "Decline booking",
    cancelled: "Cancel booking",
    in_progress: "Start work",
    completed: "Mark completed",
  };
  return labels[status] || status.replaceAll("_", " ");
}

function requestError(error: unknown, fallback: string) {
  const candidate = error as { response?: { data?: { detail?: string; non_field_errors?: string[] } | string[] | Record<string, string[]> } };
  const data = candidate.response?.data;
  if (Array.isArray(data) && data[0]) return String(data[0]);
  if (data && !Array.isArray(data)) {
    if ("detail" in data && typeof data.detail === "string") return data.detail;
    if ("non_field_errors" in data && Array.isArray(data.non_field_errors) && data.non_field_errors[0]) return data.non_field_errors[0];
    const first = Object.values(data).find((value) => Array.isArray(value) && value[0]);
    if (Array.isArray(first) && first[0]) return String(first[0]);
  }
  return fallback;
}

export default function BookingsPage() {
  const user = useAuthStore((state) => state.user);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [capabilities, setCapabilities] = useState<BookingCapability[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const loadBookings = async () => {
    setLoading(true);
    setError(null);
    try {
      const [bookingResponse, capabilityResponse, reviewResponse] = await Promise.all([
        api.get<Paginated<Booking>>("/marketplace/bookings/"),
        api.get<BookingCapability[]>("/marketplace/booking-capabilities/"),
        api.get<Paginated<Review>>("/reputation/reviews/"),
      ]);
      setBookings(unwrap(bookingResponse.data));
      setCapabilities(capabilityResponse.data);
      setReviews(unwrap(reviewResponse.data));
    } catch (loadError) {
      setError(requestError(loadError, "Unable to load bookings."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (user) void loadBookings(); }, [user]);

  const client = user?.role !== "professional";
  const reviewByBooking = useMemo(() => new Map(reviews.map((review) => [review.booking, review])), [reviews]);
  const capabilityByBooking = useMemo(() => new Map(capabilities.map((capability) => [capability.booking_id, capability])), [capabilities]);

  async function updateBookingStatus(booking: Booking, status: string) {
    setBusy(`${booking.id}:status:${status}`);
    setError(null);
    setNotice(null);
    try {
      await api.post(`/marketplace/bookings/${booking.id}/status/`, { status });
      setNotice(`Booking updated: ${transitionLabel(status)}.`);
      await loadBookings();
    } catch (statusError) {
      setError(requestError(statusError, "Booking status could not be updated."));
    } finally {
      setBusy(null);
    }
  }

  async function proposeSchedule(event: FormEvent<HTMLFormElement>, booking: Booking) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const proposedFor = String(data.get("proposed_for") || "");
    if (!proposedFor) return;
    setBusy(`${booking.id}:schedule`);
    setError(null);
    setNotice(null);
    try {
      await api.post("/marketplace/schedule-proposals/", {
        booking_id: booking.id,
        proposed_for: new Date(proposedFor).toISOString(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
        note: String(data.get("note") || ""),
      });
      setNotice("Schedule proposal sent. Any earlier active proposal has been superseded.");
      form.reset();
      await loadBookings();
    } catch (scheduleError) {
      setError(requestError(scheduleError, "Schedule proposal could not be sent."));
    } finally {
      setBusy(null);
    }
  }

  async function decideSchedule(booking: Booking, proposalId: string, status: "accepted" | "declined") {
    setBusy(`${booking.id}:decision:${status}`);
    setError(null);
    setNotice(null);
    try {
      await api.post(`/marketplace/schedule-proposals/${proposalId}/decision/`, { status });
      setNotice(status === "accepted" ? "Schedule accepted." : "Schedule declined. A new time can now be proposed.");
      await loadBookings();
    } catch (decisionError) {
      setError(requestError(decisionError, "Schedule decision could not be saved."));
    } finally {
      setBusy(null);
    }
  }

  async function submitReview(event: FormEvent<HTMLFormElement>, booking: Booking) {
    event.preventDefault();
    setBusy(`${booking.id}:review`);
    setError(null);
    setNotice(null);
    const form = event.currentTarget;
    const data = new FormData(form);
    try {
      const response = await api.post<Review>("/reputation/reviews/", {
        booking_id: booking.id,
        rating: Number(data.get("rating")),
        comment: String(data.get("comment") || ""),
      });
      setReviews((current) => [response.data, ...current]);
      setNotice(`Your completed-work review for ${booking.professional?.full_name || "this Professional"} is now part of their SabiWay reputation.`);
      form.reset();
    } catch (reviewError) {
      setError(requestError(reviewError, "Your completed-work review could not be submitted."));
    } finally {
      setBusy(null);
    }
  }

  return (
    <AppShell>
      <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
        <header>
          <p className="text-xs font-black uppercase tracking-[.14em] text-primary">{client ? "Client service management" : "Professional service management"}</p>
          <h1 className="mt-1 text-3xl font-black tracking-[-.03em]">Bookings & schedules</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">Manage agreed work from acceptance through funded delivery, scheduling and completion. SabiWay only shows actions currently allowed by the backend state machine.</p>
        </header>

        {error ? <InlineAlert tone="error" className="mt-6"><p>{error}</p><Button variant="ghost" className="mt-2" leadingIcon={<RefreshCw size={16} />} onClick={() => void loadBookings()}>Retry</Button></InlineAlert> : null}
        {notice ? <InlineAlert tone="success" className="mt-6"><p>{notice}</p></InlineAlert> : null}

        {loading ? (
          <section className="mt-7 grid gap-3" aria-live="polite" aria-busy="true">{[1, 2, 3].map((item) => <Skeleton key={item} className="h-52 w-full" />)}</section>
        ) : bookings.length === 0 && !error ? (
          <div className="mt-7"><StatePanel title="No bookings yet" description={client ? "When you and a Professional agree scope and price, the booking will appear here for acceptance, payment, scheduling and delivery." : "Accepted Client work will appear here with payment, schedule and delivery controls."} tone="empty" action={<Link href={client ? "/marketplace" : "/messages"} className="font-black text-primary">{client ? "Find a Professional" : "Open messages"}</Link>} /></div>
        ) : (
          <section className="mt-7 grid gap-4" aria-label="Bookings">
            {bookings.map((booking) => {
              const otherParty = client ? booking.professional?.full_name || "Professional" : booking.client?.full_name || "Client";
              const requested = booking.requested_for ? new Date(booking.requested_for).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" }) : "Schedule not confirmed";
              const existingReview = reviewByBooking.get(booking.id);
              const capability = capabilityByBooking.get(booking.id);
              const activeProposal = booking.schedule_proposals?.find((proposal) => proposal.id === capability?.active_schedule_proposal_id) || booking.schedule_proposals?.find((proposal) => proposal.status === "proposed");
              const canReview = client && booking.status === "completed" && !existingReview;
              return (
                <article key={booking.id} className="rounded-[var(--sabi-radius-lg)] border border-border bg-card p-5 shadow-[var(--sabi-shadow-sm)]">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusBadge tone={bookingTone(booking.status)}>{booking.status.replaceAll("_", " ")}</StatusBadge>
                        {booking.schedule_status ? <StatusBadge tone="neutral">schedule: {booking.schedule_status.replaceAll("_", " ")}</StatusBadge> : null}
                        {capability?.payment_state ? <StatusBadge tone="info">payment: {capability.payment_state.replaceAll("_", " ")}</StatusBadge> : <StatusBadge tone="warning">payment not funded</StatusBadge>}
                        {existingReview ? <StatusBadge tone="success"><Star size={13} className="mr-1" aria-hidden="true"/> Reviewed {existingReview.rating}/5</StatusBadge> : null}
                      </div>
                      <h2 className="mt-3 text-xl font-black">{booking.scope_summary}</h2>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">With {otherParty} · {requested}{booking.timezone ? ` · ${booking.timezone}` : ""}</p>
                    </div>
                    <div className="shrink-0 rounded-[var(--sabi-radius-md)] bg-muted px-4 py-3 text-right"><p className="text-xs font-bold text-muted-foreground">Agreed price</p><p className="mt-1 text-xl font-black">{booking.currency} {booking.agreed_price}</p></div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-4">
                    <Link href={`/messages?thread=${encodeURIComponent(booking.thread)}`} className="inline-flex min-h-10 items-center gap-1 rounded-[var(--sabi-radius-md)] px-2 text-sm font-black text-primary">Conversation <ArrowRight size={15} aria-hidden="true" /></Link>
                    <Link href="/sabipay" className="inline-flex min-h-10 items-center gap-1 rounded-[var(--sabi-radius-md)] px-2 text-sm font-black text-primary">Payment status <ArrowRight size={15} aria-hidden="true" /></Link>
                    {booking.professional?.username ? <Link href={`/profile/${booking.professional.username.replace(/^@/, "")}`} className="inline-flex min-h-10 items-center gap-1 rounded-[var(--sabi-radius-md)] px-2 text-sm font-black text-primary">Professional profile <ArrowRight size={15} aria-hidden="true" /></Link> : null}
                  </div>

                  {capability?.available_status_transitions?.length ? (
                    <section className="mt-4 rounded-[var(--sabi-radius-md)] border border-border bg-muted p-4" aria-label="Available booking actions">
                      <p className="text-sm font-black">Available now</p>
                      <p className="mt-1 text-xs leading-5 text-muted-foreground">These actions come from the server. Funded-work rules can remove “Start work” or “Mark completed” until SabiPay is in the required state.</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {capability.available_status_transitions.map((status) => (
                          <Button key={status} variant={status === "cancelled" || status === "declined" ? "ghost" : "primary"} disabled={Boolean(busy)} onClick={() => void updateBookingStatus(booking, status)}>
                            {busy === `${booking.id}:status:${status}` ? "Updating…" : transitionLabel(status)}
                          </Button>
                        ))}
                      </div>
                    </section>
                  ) : null}

                  {activeProposal ? (
                    <section className="mt-4 rounded-[var(--sabi-radius-md)] border border-border bg-card p-4">
                      <div className="flex items-start gap-3"><Clock3 className="mt-0.5 shrink-0 text-primary" size={19} aria-hidden="true"/><div className="min-w-0 flex-1"><p className="font-black">Active schedule proposal</p><p className="mt-1 text-sm text-muted-foreground">{new Date(activeProposal.proposed_for).toLocaleString("en-GB", { dateStyle: "full", timeStyle: "short" })} · {activeProposal.timezone}</p>{activeProposal.note ? <p className="mt-2 text-sm leading-6">{activeProposal.note}</p> : null}</div></div>
                      {capability?.can_respond_to_active_schedule ? <div className="mt-3 flex flex-wrap gap-2"><Button disabled={Boolean(busy)} leadingIcon={<Check size={16}/>} onClick={() => void decideSchedule(booking, activeProposal.id, "accepted")}>{busy === `${booking.id}:decision:accepted` ? "Saving…" : "Accept time"}</Button><Button variant="ghost" disabled={Boolean(busy)} leadingIcon={<X size={16}/>} onClick={() => void decideSchedule(booking, activeProposal.id, "declined")}>{busy === `${booking.id}:decision:declined` ? "Saving…" : "Decline time"}</Button></div> : <p className="mt-3 text-xs font-semibold text-muted-foreground">Waiting for the other participant to respond.</p>}
                    </section>
                  ) : null}

                  {capability?.can_propose_schedule ? (
                    <form onSubmit={(event) => void proposeSchedule(event, booking)} className="mt-4 grid gap-3 rounded-[var(--sabi-radius-md)] border border-border bg-muted p-4">
                      <div><p className="font-black">Propose a service time</p><p className="mt-1 text-xs leading-5 text-muted-foreground">A new proposal supersedes any earlier unanswered proposal. The other participant must accept it.</p></div>
                      <div className="grid gap-3 sm:grid-cols-2"><label className="grid gap-1 text-sm font-bold">Date and time<input name="proposed_for" required type="datetime-local" className="min-h-11 rounded-[var(--sabi-radius-md)] border border-border bg-card px-3"/></label><label className="grid gap-1 text-sm font-bold">Note <span className="font-normal text-muted-foreground">(optional)</span><input name="note" maxLength={500} className="min-h-11 rounded-[var(--sabi-radius-md)] border border-border bg-card px-3" placeholder="Access details, preferred window or service context"/></label></div>
                      <Button type="submit" disabled={Boolean(busy)} className="w-fit" leadingIcon={<CalendarDays size={16}/>}>{busy === `${booking.id}:schedule` ? "Sending proposal…" : activeProposal ? "Propose a different time" : "Propose time"}</Button>
                    </form>
                  ) : null}

                  {canReview ? (
                    <form onSubmit={(event) => void submitReview(event, booking)} className="mt-4 grid gap-3 rounded-[var(--sabi-radius-md)] border border-border bg-muted p-4">
                      <div><p className="font-black">Review this completed work</p><p className="mt-1 text-xs leading-5 text-muted-foreground">This review is completed-work reputation. It does not change verification or payment status.</p></div>
                      <label className="grid gap-1 text-sm font-bold sm:max-w-xs">Rating<select name="rating" required defaultValue="5" className="min-h-11 rounded-[var(--sabi-radius-md)] border border-border bg-card px-3"><option value="5">5 — Excellent</option><option value="4">4 — Good</option><option value="3">3 — Satisfactory</option><option value="2">2 — Needs improvement</option><option value="1">1 — Poor</option></select></label>
                      <label className="grid gap-1 text-sm font-bold">Comment <span className="font-normal text-muted-foreground">(optional, up to 1,000 characters)</span><textarea name="comment" maxLength={1000} rows={3} className="rounded-[var(--sabi-radius-md)] border border-border bg-card px-3 py-2" placeholder="Describe the completed-work experience without sharing private contact or payment details."/></label>
                      <Button type="submit" disabled={Boolean(busy)} className="w-fit" leadingIcon={<Star size={16} />}>{busy === `${booking.id}:review` ? "Submitting review…" : "Submit completed-work review"}</Button>
                    </form>
                  ) : null}
                </article>
              );
            })}
          </section>
        )}

        <aside className="mt-8 flex gap-3 rounded-[var(--sabi-radius-lg)] border border-border bg-muted p-4 text-sm leading-6 text-muted-foreground"><CalendarDays className="mt-0.5 shrink-0 text-primary" size={20} aria-hidden="true" /><p>Conversation, booking, schedule, SabiPay, verification and reputation are separate states. This workspace coordinates them without allowing one state to falsely imply another.</p></aside>
      </main>
    </AppShell>
  );
}
