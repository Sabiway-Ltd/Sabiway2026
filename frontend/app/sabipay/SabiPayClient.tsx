"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { AlertTriangle, ArrowRight, CheckCircle2, CreditCard, RefreshCw, ShieldCheck, WalletCards } from "lucide-react";

import Button from "@/app/_components/common/Button";
import { AppShell } from "@/app/_components/v2/AppShell";
import { InlineAlert, Skeleton, StatePanel, StatusBadge } from "@/app/_components/common/DesignPrimitives";
import { api } from "@/app/services/api";
import { useAuthStore } from "@/app/store/useAuthStore";

type Profile = { user_id: number; full_name: string; username: string; role?: string | null };
type Booking = { id: string; client: Profile; professional: Profile; scope_summary: string; agreed_price: string; currency: string; status: string };
type Attempt = { id: string; reference: string; authorization_url: string; status: string; failure_reason?: string; created_at: string };
type Payout = { id: string; amount: string; currency: string; reference: string; status: string; destination_label: string; initiated_at?: string | null; completed_at?: string | null; failure_reason?: string };
type Dispute = { id: string; reason: string; details: string; status: string; outcome: string; resolution?: string; created_at: string };
type Transaction = {
  id: string;
  booking_id: string;
  booking_status: string;
  scope_summary: string;
  client: Profile;
  professional: Profile;
  amount: string;
  currency: string;
  commission_amount: string;
  provider_amount: string;
  state: string;
  payment_status: string;
  last_payment_error?: string;
  receipt_number: string;
  funded_at?: string | null;
  delivered_at?: string | null;
  release_eligible_at?: string | null;
  released_at?: string | null;
  refund_status: string;
  reconciliation_status: string;
  latest_attempt?: Attempt | null;
  payout?: Payout | null;
  disputes: Dispute[];
  freeze_seconds_remaining: number;
};
type Destination = { id: string; account_name: string; bank_code: string; bank_name: string; account_last4: string; is_active: boolean; verified_at: string };
type Bank = { name: string; code: string; active?: boolean };
type Paginated<T> = T[] | { results?: T[] };

const unwrap = <T,>(payload: Paginated<T>): T[] => Array.isArray(payload) ? payload : payload.results || [];
const money = (value: string | number) => Number(value || 0).toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const label = (value: string) => value.replaceAll("_", " ");

function freezeLabel(seconds: number) {
  if (seconds <= 0) return "Release eligible now";
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  return `${days}d ${hours}h remaining`;
}

function requestError(error: unknown, fallback: string) {
  const candidate = error as { response?: { data?: { detail?: string; non_field_errors?: string[] } | Record<string, string[]> } };
  const data = candidate.response?.data;
  if (data && "detail" in data && typeof data.detail === "string") return data.detail;
  if (data && "non_field_errors" in data && Array.isArray(data.non_field_errors) && data.non_field_errors[0]) return data.non_field_errors[0];
  if (data) {
    const first = Object.values(data).find((value) => Array.isArray(value) && value[0]);
    if (Array.isArray(first) && first[0]) return String(first[0]);
  }
  return fallback;
}

function stateTone(state: string): "neutral" | "success" | "warning" | "danger" | "info" {
  if (["funded", "in_progress", "delivered"].includes(state)) return "info";
  if (["released", "refunded"].includes(state)) return "success";
  if (["disputed", "refund_pending"].includes(state)) return "warning";
  if (["refund_failed", "payout_failed"].includes(state)) return "danger";
  return "neutral";
}

function TransactionTimeline({ transaction }: { transaction: Transaction }) {
  const stages = [
    { key: "payment", label: "Payment", done: transaction.payment_status === "succeeded" || transaction.state !== "pending_payment" },
    { key: "escrow", label: "Escrow funded", done: ["funded", "in_progress", "delivered", "released"].includes(transaction.state) },
    { key: "delivery", label: "Work delivered", done: ["delivered", "released"].includes(transaction.state) },
    { key: "release", label: "Funds released", done: transaction.state === "released" },
  ];
  return <ol className="mt-4 grid gap-2 sm:grid-cols-4">{stages.map((stage) => <li key={stage.key} className="rounded-xl border border-[var(--sabi-border)] bg-[var(--sabi-surface-muted)] p-3"><div className="flex items-center gap-2 text-sm font-bold"><span aria-hidden className={`h-2.5 w-2.5 rounded-full ${stage.done ? "bg-[var(--sabi-success)]" : "bg-[var(--sabi-border-strong)]"}`} />{stage.label}</div></li>)}</ol>;
}

export default function SabiPayClient() {
  const user = useAuthStore((state) => state.user);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [disputeTxId, setDisputeTxId] = useState<string | null>(null);
  const professional = user?.role === "professional";

  async function load() {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const [bookingResponse, transactionResponse] = await Promise.all([
        api.get<Paginated<Booking>>("/marketplace/bookings/"),
        api.get<Paginated<Transaction>>("/sabipay/transactions/"),
      ]);
      setBookings(unwrap(bookingResponse.data));
      setTransactions(unwrap(transactionResponse.data));
      if (professional) {
        const [destinationResponse, bankResponse] = await Promise.all([
          api.get<Paginated<Destination>>("/sabipay/payout-destinations/"),
          api.get<Bank[]>("/sabipay/banks/"),
        ]);
        setDestinations(unwrap(destinationResponse.data));
        setBanks(bankResponse.data);
      }
    } catch (loadError) {
      setError(requestError(loadError, "SabiPay could not load your current transaction history."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { if (user) void load(); }, [user?.id, professional]);

  useEffect(() => {
    if (!user || transactions.length === 0) return;
    const reference = new URLSearchParams(window.location.search).get("reference");
    if (!reference) return;
    const transaction = transactions.find((item) => item.latest_attempt?.reference === reference);
    if (!transaction) return;
    let cancelled = false;
    void (async () => {
      setBusy(`verify-${transaction.id}`);
      try {
        const response = await api.post<Transaction>(`/sabipay/transactions/${transaction.id}/verify/`, { reference });
        if (!cancelled) {
          setNotice(response.data.payment_status === "succeeded" ? "Payment verified. SabiPay is holding the booking funds securely." : `Payment status: ${label(response.data.payment_status)}.`);
          window.history.replaceState({}, "", "/sabipay");
          await load();
        }
      } catch (verifyError) {
        if (!cancelled) setError(requestError(verifyError, "Payment could not be confirmed yet. Retry the status check shortly."));
      } finally {
        if (!cancelled) setBusy(null);
      }
    })();
    return () => { cancelled = true; };
  }, [transactions.length, user?.id]);

  const transactionByBooking = useMemo(() => new Map(transactions.map((item) => [item.booking_id, item])), [transactions]);
  const readyBookings = useMemo(() => bookings.filter((booking) => booking.status === "accepted" && booking.currency === "NGN" && !professional), [bookings, professional]);

  async function initializePayment(bookingId: string) {
    setBusy(`pay-${bookingId}`); setError(null); setNotice(null);
    try {
      const response = await api.post<{ checkout_url?: string }>("/sabipay/transactions/initialize/", { booking_id: bookingId, return_url: `${window.location.origin}/sabipay` }, { headers: { "Idempotency-Key": crypto.randomUUID() } });
      if (response.data.checkout_url) window.location.href = response.data.checkout_url;
      else setError("Paystack did not return a checkout link.");
    } catch (paymentError) {
      setError(requestError(paymentError, "SabiPay checkout could not be started."));
    } finally { setBusy(null); }
  }

  async function refreshStatus(transaction: Transaction) {
    setBusy(`refresh-${transaction.id}`); setError(null); setNotice(null);
    try {
      const response = await api.post<Transaction>(`/sabipay/transactions/${transaction.id}/refresh-status/`);
      setNotice(`Payment status checked: ${label(response.data.payment_status)}. ${response.data.reconciliation_status === "pending" ? "Confirmation is still pending; SabiPay has not assumed failure." : "Gateway reconciliation is up to date."}`);
      await load();
    } catch (refreshError) {
      setError(requestError(refreshError, "Payment status could not be refreshed."));
    } finally { setBusy(null); }
  }

  async function confirmSatisfaction(transaction: Transaction) {
    setBusy(`release-${transaction.id}`); setError(null); setNotice(null);
    try {
      await api.post(`/sabipay/transactions/${transaction.id}/confirm-satisfaction/`);
      setNotice("Satisfaction confirmed. SabiPay has started the provider payout process.");
      await load();
    } catch (releaseError) {
      setError(requestError(releaseError, "SabiPay could not release this transaction."));
    } finally { setBusy(null); }
  }

  async function openDispute(event: FormEvent<HTMLFormElement>, transaction: Transaction) {
    event.preventDefault(); setBusy(`dispute-${transaction.id}`); setError(null); setNotice(null);
    const data = new FormData(event.currentTarget);
    try {
      await api.post("/sabipay/disputes/", { transaction_id: transaction.id, reason: data.get("reason"), details: data.get("details") });
      setNotice("Dispute opened. SabiPay has frozen the transaction while it is reviewed.");
      setDisputeTxId(null); event.currentTarget.reset(); await load();
    } catch (disputeError) {
      setError(requestError(disputeError, "The dispute could not be opened."));
    } finally { setBusy(null); }
  }

  async function saveDestination(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy("destination"); setError(null); setNotice(null);
    const data = new FormData(event.currentTarget);
    const bankCode = String(data.get("bank_code") || "");
    const bankName = banks.find((bank) => bank.code === bankCode)?.name || "";
    try {
      await api.post("/sabipay/payout-destinations/", { account_number: data.get("account_number"), bank_code: bankCode, bank_name: bankName });
      setNotice("Payout destination verified. SabiWay stores the protected payout reference, not your full account number.");
      event.currentTarget.reset(); await load();
    } catch (destinationError) {
      setError(requestError(destinationError, "Payout account could not be verified."));
    } finally { setBusy(null); }
  }

  if (!user || loading) return <AppShell><div className="mx-auto max-w-6xl space-y-4 p-4 sm:p-6"><Skeleton className="h-28 w-full" /><Skeleton className="h-52 w-full" /></div></AppShell>;

  return <AppShell><div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6">
    <section className="rounded-3xl bg-[var(--sabi-primary-strong)] p-6 text-[var(--sabi-text-inverse)] sm:p-8"><p className="text-xs font-black uppercase tracking-[.16em] opacity-75">Nigeria pilot · Paystack</p><div className="mt-2 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"><div><h1 className="text-3xl font-black sm:text-4xl">SabiPay transactions</h1><p className="mt-3 max-w-3xl text-sm leading-6 opacity-80 sm:text-base">Fund accepted work, track escrow and reconciliation, manage disputes, and follow releases or payouts. Booking and service-progress actions stay in the Bookings workspace.</p></div><Link href="/bookings" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-black text-[var(--sabi-primary-strong)]">Open bookings <ArrowRight size={16} /></Link></div></section>
    {notice && <InlineAlert tone="success" title="SabiPay updated">{notice}</InlineAlert>}
    {error && <InlineAlert tone="danger" title="SabiPay needs attention">{error}</InlineAlert>}

    {!professional && readyBookings.length > 0 && <section><div className="mb-3"><p className="text-xs font-black uppercase tracking-[.14em] text-[var(--sabi-primary)]">Ready to fund</p><h2 className="mt-1 text-2xl font-black">Accepted bookings</h2></div><div className="grid gap-4 lg:grid-cols-2">{readyBookings.map((booking) => { const existing = transactionByBooking.get(booking.id); const fee = Number(booking.agreed_price) * 0.1; return <article key={booking.id} className="rounded-2xl border border-[var(--sabi-border)] bg-[var(--sabi-surface-elevated)] p-5 shadow-sm"><p className="text-xs font-bold text-[var(--sabi-text-muted)]">{booking.professional.full_name}</p><h3 className="mt-1 text-lg font-black">{booking.scope_summary}</h3><div className="mt-4 grid grid-cols-3 gap-2 rounded-xl bg-[var(--sabi-surface-muted)] p-3 text-xs"><div><p className="text-[var(--sabi-text-muted)]">Service</p><p className="mt-1 font-black">₦{money(booking.agreed_price)}</p></div><div><p className="text-[var(--sabi-text-muted)]">Platform fee</p><p className="mt-1 font-black">₦{money(fee)}</p></div><div><p className="text-[var(--sabi-text-muted)]">Provider</p><p className="mt-1 font-black">₦{money(Number(booking.agreed_price) - fee)}</p></div></div><div className="mt-4 flex flex-wrap gap-2">{existing?.state === "pending_payment" && existing.latest_attempt?.authorization_url ? <><a href={existing.latest_attempt.authorization_url} className="inline-flex min-h-11 items-center rounded-xl bg-[var(--sabi-accent)] px-4 py-2.5 text-sm font-black">Continue checkout</a><Button variant="secondary" onClick={() => void refreshStatus(existing)} loading={busy === `refresh-${existing.id}`}>Check status</Button></> : existing ? <StatusBadge tone={stateTone(existing.state)}>{label(existing.state)}</StatusBadge> : <Button onClick={() => void initializePayment(booking.id)} loading={busy === `pay-${booking.id}`} leadingIcon={<CreditCard size={16} />}>Pay securely</Button>}</div></article>; })}</div></section>}

    <section><div className="mb-3 flex items-end justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-[.14em] text-[var(--sabi-primary)]">Transaction history</p><h2 className="mt-1 text-2xl font-black">Payment and escrow states</h2></div><Button variant="ghost" size="sm" onClick={() => void load()} leadingIcon={<RefreshCw size={15} />}>Refresh</Button></div>{transactions.length === 0 ? <StatePanel title="No SabiPay transactions yet" description={professional ? "Funded work and payout records will appear here when Clients pay through SabiPay." : "Once an accepted NGN booking is funded, its payment and escrow history will appear here."} /> : <div className="space-y-4">{transactions.map((transaction) => { const latestDispute = transaction.disputes?.[0]; const canDispute = ["funded", "in_progress", "delivered"].includes(transaction.state) && !transaction.disputes?.some((item) => ["open", "under_review"].includes(item.status)); const canRelease = !professional && transaction.state === "delivered" && !transaction.disputes?.some((item) => ["open", "under_review"].includes(item.status)); return <article key={transaction.id} className="rounded-2xl border border-[var(--sabi-border)] bg-[var(--sabi-surface-elevated)] p-5 shadow-sm"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-xs font-bold text-[var(--sabi-text-muted)]">Receipt {transaction.receipt_number}</p><h3 className="mt-1 text-lg font-black">{transaction.scope_summary}</h3><p className="mt-1 text-sm text-[var(--sabi-text-muted)]">{professional ? transaction.client.full_name : transaction.professional.full_name}</p></div><StatusBadge tone={stateTone(transaction.state)}>{label(transaction.state)}</StatusBadge></div><TransactionTimeline transaction={transaction} /><div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><div className="rounded-xl bg-[var(--sabi-surface-muted)] p-3"><p className="text-xs text-[var(--sabi-text-muted)]">Total</p><p className="mt-1 font-black">₦{money(transaction.amount)}</p></div><div className="rounded-xl bg-[var(--sabi-surface-muted)] p-3"><p className="text-xs text-[var(--sabi-text-muted)]">Payment</p><p className="mt-1 font-black capitalize">{label(transaction.payment_status)}</p></div><div className="rounded-xl bg-[var(--sabi-surface-muted)] p-3"><p className="text-xs text-[var(--sabi-text-muted)]">Reconciliation</p><p className="mt-1 font-black capitalize">{label(transaction.reconciliation_status)}</p></div><div className="rounded-xl bg-[var(--sabi-surface-muted)] p-3"><p className="text-xs text-[var(--sabi-text-muted)]">Release window</p><p className="mt-1 font-black">{transaction.state === "delivered" ? freezeLabel(transaction.freeze_seconds_remaining) : "—"}</p></div></div>{transaction.last_payment_error && <div className="mt-4"><InlineAlert tone="warning" title="Gateway status">{transaction.last_payment_error}</InlineAlert></div>}{latestDispute && <div className="mt-4 rounded-xl border border-[var(--sabi-warning-border)] bg-[var(--sabi-warning-soft)] p-4 text-sm"><div className="flex items-center gap-2 font-black"><AlertTriangle size={16} /> Dispute {label(latestDispute.status)}</div><p className="mt-1 text-[var(--sabi-text-muted)]">{latestDispute.reason}</p>{latestDispute.resolution && <p className="mt-2">{latestDispute.resolution}</p>}</div>}{transaction.payout && <div className="mt-4 rounded-xl border border-[var(--sabi-border)] bg-[var(--sabi-surface-muted)] p-4 text-sm"><div className="flex items-center gap-2 font-black"><WalletCards size={16} /> Payout {label(transaction.payout.status)}</div><p className="mt-1 text-[var(--sabi-text-muted)]">₦{money(transaction.payout.amount)} · {transaction.payout.destination_label}</p>{transaction.payout.failure_reason && <p className="mt-2 text-[var(--sabi-danger)]">{transaction.payout.failure_reason}</p>}</div>}<div className="mt-4 flex flex-wrap gap-2"><Button variant="secondary" size="sm" onClick={() => void refreshStatus(transaction)} loading={busy === `refresh-${transaction.id}`} leadingIcon={<RefreshCw size={15} />}>Check payment status</Button><Link href="/bookings" className="inline-flex min-h-10 items-center rounded-lg border border-[var(--sabi-border)] px-3 py-2 text-sm font-bold">Manage booking</Link>{canRelease && <Button size="sm" onClick={() => void confirmSatisfaction(transaction)} loading={busy === `release-${transaction.id}`} leadingIcon={<CheckCircle2 size={15} />}>Confirm satisfaction</Button>}{canDispute && <Button variant="danger" size="sm" onClick={() => setDisputeTxId(disputeTxId === transaction.id ? null : transaction.id)}>Open dispute</Button>}</div>{disputeTxId === transaction.id && <form onSubmit={(event) => void openDispute(event, transaction)} className="mt-4 grid gap-3 rounded-xl border border-[var(--sabi-border)] bg-[var(--sabi-surface-muted)] p-4"><label className="text-sm font-bold">Reason<input name="reason" required className="mt-1 min-h-11 w-full rounded-xl border border-[var(--sabi-border)] bg-[var(--sabi-surface-elevated)] px-3" placeholder="What went wrong?" /></label><label className="text-sm font-bold">Details<textarea name="details" required rows={4} className="mt-1 w-full rounded-xl border border-[var(--sabi-border)] bg-[var(--sabi-surface-elevated)] px-3 py-2" placeholder="Describe the issue and the outcome you need." /></label><div className="flex gap-2"><Button type="submit" variant="danger" loading={busy === `dispute-${transaction.id}`}>Submit dispute</Button><Button type="button" variant="ghost" onClick={() => setDisputeTxId(null)}>Cancel</Button></div></form>}</article>; })}</div>}</section>

    {professional && <section className="grid gap-4 lg:grid-cols-[1fr_1.2fr]"><article className="rounded-2xl border border-[var(--sabi-border)] bg-[var(--sabi-surface-elevated)] p-5"><div className="flex items-center gap-2"><ShieldCheck className="text-[var(--sabi-primary)]" size={20} /><h2 className="text-xl font-black">Payout destination</h2></div>{destinations.length ? <div className="mt-4 space-y-2">{destinations.map((destination) => <div key={destination.id} className="rounded-xl bg-[var(--sabi-surface-muted)] p-3 text-sm"><p className="font-black">{destination.account_name}</p><p className="text-[var(--sabi-text-muted)]">{destination.bank_name} · •••• {destination.account_last4}</p></div>)}</div> : <p className="mt-3 text-sm text-[var(--sabi-text-muted)]">Add a verified Nigerian payout destination before funds can be released to you.</p>}</article><form onSubmit={(event) => void saveDestination(event)} className="rounded-2xl border border-[var(--sabi-border)] bg-[var(--sabi-surface-elevated)] p-5"><h2 className="text-xl font-black">Add payout account</h2><div className="mt-4 grid gap-3 sm:grid-cols-2"><label className="text-sm font-bold">Bank<select name="bank_code" required className="mt-1 min-h-11 w-full rounded-xl border border-[var(--sabi-border)] bg-[var(--sabi-surface-elevated)] px-3"><option value="">Choose bank</option>{banks.filter((bank) => bank.active !== false).map((bank) => <option key={bank.code} value={bank.code}>{bank.name}</option>)}</select></label><label className="text-sm font-bold">Account number<input name="account_number" inputMode="numeric" pattern="[0-9]{10}" maxLength={10} required className="mt-1 min-h-11 w-full rounded-xl border border-[var(--sabi-border)] bg-[var(--sabi-surface-elevated)] px-3" placeholder="10 digits" /></label></div><p className="mt-3 text-xs text-[var(--sabi-text-muted)]">Account details are resolved with the payment provider. SabiWay does not store the full bank account number.</p><div className="mt-4"><Button type="submit" loading={busy === "destination"}>Verify payout account</Button></div></form></section>}

    <InlineAlert tone="info" title="Service progress belongs in Bookings">Start work, schedule changes and completion are managed in <Link href="/bookings" className="font-black underline">Bookings</Link>. SabiPay only reflects those authoritative states for funding, escrow, disputes, release and payout.</InlineAlert>
  </div></AppShell>;
}
