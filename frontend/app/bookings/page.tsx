"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, CalendarDays, RefreshCw } from "lucide-react";

import Button from "@/app/_components/common/Button";
import { AppShell } from "@/app/_components/v2/AppShell";
import { InlineAlert, Skeleton, StatePanel, StatusBadge } from "@/app/_components/common/DesignPrimitives";
import { environment } from "@/app/config/environment";
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
  professional?: { full_name?: string };
  created_at?: string;
};

type Paginated<T> = T[] | { results?: T[] };
const unwrap = <T,>(payload: Paginated<T>): T[] => Array.isArray(payload) ? payload : payload.results || [];

function bookingTone(status: string): "neutral" | "success" | "warning" | "danger" | "info" {
  if (["accepted", "in_progress"].includes(status)) return "info";
  if (status === "completed") return "success";
  if (["cancelled", "declined"].includes(status)) return "danger";
  if (status === "pending") return "warning";
  return "neutral";
}

export default function BookingsPage() {
  const { user, access } = useAuthStore();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadBookings = async () => {
    const token = useAuthStore.getState().access || window.localStorage.getItem("access");
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${environment.djangoUrl}/api/marketplace/bookings/`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      const payload = await response.json().catch(() => ([]));
      if (!response.ok) throw new Error(payload.detail || "Unable to load bookings.");
      setBookings(unwrap<Booking>(payload));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load bookings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && access) void loadBookings();
  }, [user, access]);

  const client = user?.role !== "professional";

  return (
    <AppShell>
      <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
        <header>
          <p className="text-xs font-black uppercase tracking-[.14em] text-primary">{client ? "Client workspace" : "Work schedule"}</p>
          <h1 className="mt-1 text-3xl font-black tracking-[-.03em]">Bookings</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Agreed work, schedule state and the payment/conversation context attached to each booking.</p>
        </header>

        {error ? <InlineAlert tone="error" className="mt-6"><p>{error}</p><Button variant="ghost" className="mt-2" leadingIcon={<RefreshCw size={16} />} onClick={() => void loadBookings()}>Retry</Button></InlineAlert> : null}

        {loading ? (
          <section className="mt-7 grid gap-3" aria-live="polite" aria-busy="true">{[1, 2, 3].map((item) => <Skeleton key={item} className="h-36 w-full" />)}</section>
        ) : bookings.length === 0 && !error ? (
          <div className="mt-7"><StatePanel title="No bookings yet" description={client ? "When you and a Professional agree scope, price and booking details, the booking will appear here." : "Accepted Client work will appear here with schedule and status context."} tone="empty" action={<Link href={client ? "/marketplace" : "/messages"} className="font-black text-primary">{client ? "Find a Professional" : "Open messages"}</Link>} /></div>
        ) : (
          <section className="mt-7 grid gap-3" aria-label="Bookings">
            {bookings.map((booking) => {
              const otherParty = client ? booking.professional?.full_name || "Professional" : booking.client?.full_name || "Client";
              const requested = booking.requested_for ? new Date(booking.requested_for).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" }) : "Schedule not confirmed";
              return (
                <article key={booking.id} className="rounded-[var(--sabi-radius-lg)] border border-border bg-card p-5 shadow-[var(--sabi-shadow-sm)]">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2"><StatusBadge tone={bookingTone(booking.status)}>{booking.status.replaceAll("_", " ")}</StatusBadge>{booking.schedule_status ? <StatusBadge tone="neutral">schedule: {booking.schedule_status.replaceAll("_", " ")}</StatusBadge> : null}</div>
                      <h2 className="mt-3 text-xl font-black">{booking.scope_summary}</h2>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">With {otherParty} · {requested}{booking.timezone ? ` · ${booking.timezone}` : ""}</p>
                    </div>
                    <div className="shrink-0 rounded-[var(--sabi-radius-md)] bg-muted px-4 py-3 text-right"><p className="text-xs font-bold text-muted-foreground">Agreed price</p><p className="mt-1 text-xl font-black">{booking.currency} {booking.agreed_price}</p></div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-4">
                    <Link href="/messages" className="inline-flex min-h-10 items-center gap-1 rounded-[var(--sabi-radius-md)] px-2 text-sm font-black text-primary">Conversation <ArrowRight size={15} aria-hidden="true" /></Link>
                    <Link href="/sabipay" className="inline-flex min-h-10 items-center gap-1 rounded-[var(--sabi-radius-md)] px-2 text-sm font-black text-primary">Payment status <ArrowRight size={15} aria-hidden="true" /></Link>
                  </div>
                </article>
              );
            })}
          </section>
        )}

        <aside className="mt-8 flex gap-3 rounded-[var(--sabi-radius-lg)] border border-border bg-muted p-4 text-sm leading-6 text-muted-foreground"><CalendarDays className="mt-0.5 shrink-0 text-primary" size={20} aria-hidden="true" /><p>A booking is an agreed-work state. Conversation, schedule status and SabiPay transaction status remain separately visible so one state does not falsely imply another.</p></aside>
      </main>
    </AppShell>
  );
}
