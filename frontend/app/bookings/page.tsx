"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { ArrowRight, CalendarDays, RefreshCw, Star } from "lucide-react";

import Button from "@/app/_components/common/Button";
import { AppShell } from "@/app/_components/v2/AppShell";
import { InlineAlert, Skeleton, StatePanel, StatusBadge } from "@/app/_components/common/DesignPrimitives";
import { api } from "@/app/services/api";
import { useAuthStore } from "@/app/store/useAuthStore";

type Booking = {
  id: string;
  scope_summary: string;
  agreed_price: string;
  currency: string;
  requested_for?: string | null;
  timezone?: string;
  schedule_status?: string;
  status: string;
  message?: string;
  client?: { full_name?: string };
  professional?: { full_name?: string; username?: string };
  created_at?: string;
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

function requestError(error: unknown, fallback: string) {
  const candidate = error as { response?: { data?: { detail?: string; non_field_errors?: string[] } | string[] } };
  const data = candidate.response?.data;
  if (Array.isArray(data) && data[0]) return String(data[0]);
  if (data && !Array.isArray(data)) return data.detail || data.non_field_errors?.[0] || fallback;
  return fallback;
}

export default function BookingsPage() {
  const user = useAuthStore((state) => state.user);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reviewing, setReviewing] = useState<string | null>(null);
  const [reviewNotice, setReviewNotice] = useState<string | null>(null);

  const loadBookings = async () => {
    setLoading(true);
    setError(null);
    try {
      const [bookingResponse, reviewResponse] = await Promise.all([
        api.get<Paginated<Booking>>("/marketplace/bookings/"),
        api.get<Paginated<Review>>("/reputation/reviews/"),
      ]);
      setBookings(unwrap(bookingResponse.data));
      setReviews(unwrap(reviewResponse.data));
    } catch (loadError) {
      setError(requestError(loadError, "Unable to load bookings."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (user) void loadBookings(); }, [user]);

  const client = user?.role !== "professional";
  const reviewByBooking = new Map(reviews.map((review) => [review.booking, review]));

  async function submitReview(event: FormEvent<HTMLFormElement>, booking: Booking) {
    event.preventDefault();
    setReviewing(booking.id);
    setError(null);
    setReviewNotice(null);
    const form = event.currentTarget;
    const data = new FormData(form);
    try {
      const response = await api.post<Review>("/reputation/reviews/", {
        booking_id: booking.id,
        rating: Number(data.get("rating")),
        comment: String(data.get("comment") || ""),
      });
      setReviews((current) => [response.data, ...current]);
      setReviewNotice(`Your completed-work review for ${booking.professional?.full_name || "this Professional"} is now part of their SabiWay reputation.`);
      form.reset();
    } catch (reviewError) {
      setError(requestError(reviewError, "Your completed-work review could not be submitted."));
    } finally {
      setReviewing(null);
    }
  }

  return (
    <AppShell>
      <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
        <header><p className="text-xs font-black uppercase tracking-[.14em] text-primary">{client ? "Client workspace" : "Work schedule"}</p><h1 className="mt-1 text-3xl font-black tracking-[-.03em]">Bookings</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Agreed work, schedule state and the payment/conversation context attached to each booking.</p></header>

        {error ? <InlineAlert tone="error" className="mt-6"><p>{error}</p><Button variant="ghost" className="mt-2" leadingIcon={<RefreshCw size={16} />} onClick={() => void loadBookings()}>Retry</Button></InlineAlert> : null}
        {reviewNotice ? <InlineAlert tone="success" className="mt-6"><p>{reviewNotice}</p></InlineAlert> : null}

        {loading ? (
          <section className="mt-7 grid gap-3" aria-live="polite" aria-busy="true">{[1, 2, 3].map((item) => <Skeleton key={item} className="h-36 w-full" />)}</section>
        ) : bookings.length === 0 && !error ? (
          <div className="mt-7"><StatePanel title="No bookings yet" description={client ? "When you and a Professional agree scope, price and booking details, the booking will appear here." : "Accepted Client work will appear here with schedule and status context."} tone="empty" action={<Link href={client ? "/marketplace" : "/messages"} className="font-black text-primary">{client ? "Find a Professional" : "Open messages"}</Link>} /></div>
        ) : (
          <section className="mt-7 grid gap-3" aria-label="Bookings">
            {bookings.map((booking) => {
              const otherParty = client ? booking.professional?.full_name || "Professional" : booking.client?.full_name || "Client";
              const requested = booking.requested_for ? new Date(booking.requested_for).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" }) : "Schedule not confirmed";
              const existingReview = reviewByBooking.get(booking.id);
              const canReview = client && booking.status === "completed" && !existingReview;
              return (
                <article key={booking.id} className="rounded-[var(--sabi-radius-lg)] border border-border bg-card p-5 shadow-[var(--sabi-shadow-sm)]">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div><div className="flex flex-wrap items-center gap-2"><StatusBadge tone={bookingTone(booking.status)}>{booking.status.replaceAll("_", " ")}</StatusBadge>{booking.schedule_status ? <StatusBadge tone="neutral">schedule: {booking.schedule_status.replaceAll("_", " ")}</StatusBadge> : null}{existingReview ? <StatusBadge tone="success"><Star size={13} className="mr-1" aria-hidden="true"/> Reviewed {existingReview.rating}/5</StatusBadge> : null}</div><h2 className="mt-3 text-xl font-black">{booking.scope_summary}</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">With {otherParty} · {requested}{booking.timezone ? ` · ${booking.timezone}` : ""}</p></div>
                    <div className="shrink-0 rounded-[var(--sabi-radius-md)] bg-muted px-4 py-3 text-right"><p className="text-xs font-bold text-muted-foreground">Agreed price</p><p className="mt-1 text-xl font-black">{booking.currency} {booking.agreed_price}</p></div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-4"><Link href="/messages" className="inline-flex min-h-10 items-center gap-1 rounded-[var(--sabi-radius-md)] px-2 text-sm font-black text-primary">Conversation <ArrowRight size={15} aria-hidden="true" /></Link><Link href="/sabipay" className="inline-flex min-h-10 items-center gap-1 rounded-[var(--sabi-radius-md)] px-2 text-sm font-black text-primary">Payment status <ArrowRight size={15} aria-hidden="true" /></Link>{booking.professional?.username ? <Link href={`/profile/${booking.professional.username.replace(/^@/, "")}`} className="inline-flex min-h-10 items-center gap-1 rounded-[var(--sabi-radius-md)] px-2 text-sm font-black text-primary">Professional profile <ArrowRight size={15} aria-hidden="true" /></Link> : null}</div>

                  {canReview ? (
                    <form onSubmit={(event) => void submitReview(event, booking)} className="mt-4 grid gap-3 rounded-[var(--sabi-radius-md)] border border-border bg-muted p-4">
                      <div><p className="font-black">Review this completed work</p><p className="mt-1 text-xs leading-5 text-muted-foreground">This review will be publicly labelled as completed-work reputation. It does not change verification or payment status.</p></div>
                      <label className="grid gap-1 text-sm font-bold sm:max-w-xs">Rating<select name="rating" required defaultValue="5" className="min-h-11 rounded-[var(--sabi-radius-md)] border border-border bg-card px-3"><option value="5">5 — Excellent</option><option value="4">4 — Good</option><option value="3">3 — Satisfactory</option><option value="2">2 — Needs improvement</option><option value="1">1 — Poor</option></select></label>
                      <label className="grid gap-1 text-sm font-bold">Comment <span className="font-normal text-muted-foreground">(optional, up to 1,000 characters)</span><textarea name="comment" maxLength={1000} rows={3} className="rounded-[var(--sabi-radius-md)] border border-border bg-card px-3 py-2" placeholder="Describe the completed-work experience without sharing private contact or payment details."/></label>
                      <Button type="submit" disabled={reviewing === booking.id} className="w-fit" leadingIcon={<Star size={16} />}>{reviewing === booking.id ? "Submitting review…" : "Submit completed-work review"}</Button>
                    </form>
                  ) : null}
                </article>
              );
            })}
          </section>
        )}

        <aside className="mt-8 flex gap-3 rounded-[var(--sabi-radius-lg)] border border-border bg-muted p-4 text-sm leading-6 text-muted-foreground"><CalendarDays className="mt-0.5 shrink-0 text-primary" size={20} aria-hidden="true" /><p>A booking is an agreed-work state. Conversation, schedule, SabiPay transaction, verification and completed-work reputation remain separately visible so one state does not falsely imply another.</p></aside>
      </main>
    </AppShell>
  );
}
