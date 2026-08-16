"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, CheckCircle2, Clock3, CreditCard, Receipt, RefreshCw, ShieldCheck, WalletCards } from "lucide-react";

import { environment } from "@/app/config/environment";

type Profile = { user_id: number; full_name: string; username: string; role?: string | null };
type Booking = { id: string; client: Profile; professional: Profile; scope_summary: string; agreed_price: string; currency: string; status: string; accepted_at?: string | null };
type Attempt = { id: string; reference: string; authorization_url: string; status: string; failure_reason?: string; created_at: string };
type Payout = { id: string; amount: string; currency: string; reference: string; status: string; destination_label: string; initiated_at?: string | null; completed_at?: string | null; failure_reason?: string };
type Tx = {
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
  receipt_number: string;
  funded_at?: string | null;
  delivered_at?: string | null;
  release_eligible_at?: string | null;
  released_at?: string | null;
  refund_status: string;
  reconciliation_status: string;
  latest_attempt?: Attempt | null;
  payout?: Payout | null;
  freeze_seconds_remaining: number;
};
type Destination = { id: string; account_name: string; bank_code: string; bank_name: string; account_last4: string; is_active: boolean; verified_at: string };
type Bank = { name: string; code: string; active?: boolean };

const input = "min-h-11 w-full rounded-xl border border-[#d9e4dd] bg-white px-3 text-sm outline-none focus:border-[#008753] focus:ring-2 focus:ring-[#008753]/10";

function unwrap<T>(payload: T[] | { results: T[] }): T[] { return Array.isArray(payload) ? payload : payload.results; }
function money(value: string | number) { return Number(value || 0).toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
function label(value: string) { return value.replaceAll("_", " "); }
function freezeLabel(seconds: number) {
  if (seconds <= 0) return "Release eligible now";
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  return `${days}d ${hours}h remaining`;
}

export default function SabiPayClient() {
  const [token, setToken] = useState("");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [transactions, setTransactions] = useState<Tx[]>([]);
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const headers = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);

  useEffect(() => {
    const access = window.localStorage.getItem("access") || "";
    if (!access) { window.location.href = "/login?next=/sabipay"; return; }
    setToken(access);
  }, []);

  const load = useCallback(async () => {
    if (!token) return;
    setError("");
    const [profileResponse, bookingResponse, txResponse] = await Promise.all([
      fetch(`${environment.djangoUrl}/api/profiles/me/`, { headers }),
      fetch(`${environment.djangoUrl}/api/marketplace/bookings/`, { headers }),
      fetch(`${environment.djangoUrl}/api/sabipay/transactions/`, { headers }),
    ]);
    if (!profileResponse.ok || !bookingResponse.ok || !txResponse.ok) {
      setError("SabiPay could not load your current booking and payment history.");
      setLoading(false);
      return;
    }
    const me = await profileResponse.json() as Profile;
    const bookingRows = unwrap<Booking>(await bookingResponse.json());
    const txRows = unwrap<Tx>(await txResponse.json());
    setProfile(me); setBookings(bookingRows); setTransactions(txRows);
    if (me.role === "professional") {
      const [destResponse, bankResponse] = await Promise.all([
        fetch(`${environment.djangoUrl}/api/sabipay/payout-destinations/`, { headers }),
        fetch(`${environment.djangoUrl}/api/sabipay/banks/`, { headers }),
      ]);
      if (destResponse.ok) setDestinations(unwrap<Destination>(await destResponse.json()));
      if (bankResponse.ok) setBanks(await bankResponse.json());
    }
    setLoading(false);
  }, [headers, token]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!token || transactions.length === 0) return;
    const reference = new URLSearchParams(window.location.search).get("reference");
    if (!reference) return;
    const tx = transactions.find((item) => item.latest_attempt?.reference === reference);
    if (!tx) return;
    let cancelled = false;
    (async () => {
      setBusy(`verify-${tx.id}`);
      const response = await fetch(`${environment.djangoUrl}/api/sabipay/transactions/${tx.id}/verify/`, {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ reference }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!cancelled) {
        if (response.ok) {
          setNotice("Payment verified. SabiPay is now holding the booking funds securely for the service journey.");
          window.history.replaceState({}, "", "/sabipay");
          await load();
        } else setError(payload.detail || payload.non_field_errors?.[0] || "Payment could not be verified yet. You can retry safely.");
        setBusy("");
      }
    })();
    return () => { cancelled = true; };
  }, [headers, load, token, transactions]);

  const txByBooking = useMemo(() => new Map(transactions.map((item) => [item.booking_id, item])), [transactions]);
  const readyBookings = useMemo(() => bookings.filter((booking) => booking.status === "accepted" && booking.currency === "NGN" && booking.client.user_id === profile?.user_id), [bookings, profile]);

  async function initializePayment(bookingId: string) {
    setBusy(`pay-${bookingId}`); setError(""); setNotice("");
    const response = await fetch(`${environment.djangoUrl}/api/sabipay/transactions/initialize/`, {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json", "Idempotency-Key": crypto.randomUUID() },
      body: JSON.stringify({ booking_id: bookingId, return_url: `${window.location.origin}/sabipay` }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) { setError(payload.detail || payload.non_field_errors?.[0] || "SabiPay checkout could not be started."); setBusy(""); return; }
    if (payload.checkout_url) window.location.href = payload.checkout_url;
    else { setError("Paystack did not return a checkout link."); setBusy(""); }
  }

  async function txAction(tx: Tx, action: "start-service" | "mark-delivered" | "confirm-satisfaction") {
    setBusy(`${action}-${tx.id}`); setError(""); setNotice("");
    const response = await fetch(`${environment.djangoUrl}/api/sabipay/transactions/${tx.id}/${action}/`, { method: "POST", headers });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) setError(payload.detail || payload.non_field_errors?.[0] || "SabiPay could not update this transaction.");
    else { setNotice(action === "start-service" ? "Service marked in progress after escrow funding." : action === "mark-delivered" ? "Delivery recorded. The seven-day freeze has started." : "Satisfaction confirmed. SabiPay has started the provider payout."); await load(); }
    setBusy("");
  }

  async function saveDestination(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy("destination"); setError(""); setNotice("");
    const data = new FormData(event.currentTarget);
    const bankCode = String(data.get("bank_code") || "");
    const bankName = banks.find((bank) => bank.code === bankCode)?.name || "";
    const response = await fetch(`${environment.djangoUrl}/api/sabipay/payout-destinations/`, {
      method: "POST", headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({ account_number: data.get("account_number"), bank_code: bankCode, bank_name: bankName }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) setError(payload.detail || payload.account_number?.[0] || payload.non_field_errors?.[0] || "Payout account could not be verified.");
    else { setNotice("Payout destination verified with Paystack. Full account numbers are not stored by SabiWay."); await load(); event.currentTarget.reset(); }
    setBusy("");
  }

  if (loading) return <main className="min-h-screen bg-[#f7faf8] p-8 text-[#173126]">Loading SabiPay…</main>;

  return (
    <main className="min-h-screen bg-[#f7faf8] text-[#173126]">
      <header className="border-b border-[#dce8e1] bg-white"><div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6"><Link href="/marketplace" className="inline-flex items-center gap-2 font-black"><ArrowLeft size={18}/> Marketplace</Link><div className="flex items-center gap-2 text-xl font-black"><ShieldCheck className="text-[#008753]"/>SabiPay</div><Link href="/messages" className="text-sm font-bold text-[#008753]">Messages</Link></div></header>

      <section className="bg-[#073522] px-4 py-10 text-white sm:px-6"><div className="mx-auto max-w-7xl"><p className="text-xs font-black uppercase tracking-[.16em] text-[#8dd1b3]">Nigeria pilot · Paystack</p><h1 className="mt-2 max-w-3xl text-3xl font-black sm:text-4xl">Pay only after the booking is agreed. Release only after delivery.</h1><p className="mt-4 max-w-3xl text-sm leading-6 text-white/75 sm:text-base">SabiPay verifies the client payment, applies the confirmed 10% platform fee, starts a seven-day post-delivery freeze and records every release, refund and payout transition.</p></div></section>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        {notice && <div className="mb-5 flex items-start gap-2 rounded-2xl bg-[#e9f8f0] p-4 text-sm font-bold text-[#006b42]"><CheckCircle2 size={18} className="mt-0.5 shrink-0"/>{notice}</div>}
        {error && <div className="mb-5 rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-700">{error}</div>}

        {profile?.role === "client" && readyBookings.length > 0 && <section className="mb-8"><div className="mb-4"><p className="text-xs font-black uppercase tracking-[.14em] text-[#008753]">Ready to fund</p><h2 className="mt-1 text-2xl font-black">Accepted bookings</h2></div><div className="grid gap-4 lg:grid-cols-2">{readyBookings.map((booking) => {
          const tx = txByBooking.get(booking.id); const fee = Number(booking.agreed_price) * 0.10; const provider = Number(booking.agreed_price) - fee;
          return <article key={booking.id} className="rounded-2xl border border-[#dce7e1] bg-white p-5 shadow-sm"><p className="text-xs font-bold text-[#66756d]">{booking.professional.full_name}</p><h3 className="mt-1 text-lg font-black">{booking.scope_summary}</h3><div className="mt-4 grid grid-cols-3 gap-2 rounded-xl bg-[#f4f8f6] p-3 text-xs"><div><p className="text-[#75827b]">Service</p><p className="mt-1 font-black">₦{money(booking.agreed_price)}</p></div><div><p className="text-[#75827b]">10% fee</p><p className="mt-1 font-black">₦{money(fee)}</p></div><div><p className="text-[#75827b]">Provider</p><p className="mt-1 font-black">₦{money(provider)}</p></div></div>{tx?.state === "pending_payment" && tx.latest_attempt?.authorization_url ? <a href={tx.latest_attempt.authorization_url} className="mt-4 inline-flex rounded-xl bg-[#FFB800] px-4 py-2.5 text-sm font-black">Continue secure checkout</a> : tx ? <p className="mt-4 text-sm font-bold text-[#008753]">SabiPay status: {label(tx.state)}</p> : <button disabled={busy === `pay-${booking.id}`} onClick={() => initializePayment(booking.id)} className="mt-4 rounded-xl bg-[#FFB800] px-4 py-2.5 text-sm font-black disabled:opacity-50"><CreditCard size={16} className="mr-2 inline"/>Pay with SabiPay</button>}</article>;
        })}</div></section>}

        <section className="mb-8"><div className="mb-4 flex items-end justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[.14em] text-[#008753]">Transaction history</p><h2 className="mt-1 text-2xl font-black">Your SabiPay activity</h2></div><button onClick={load} className="rounded-xl border border-[#d4e1da] bg-white p-2.5" aria-label="Refresh SabiPay"><RefreshCw size={18}/></button></div>{transactions.length === 0 ? <div className="rounded-2xl border border-dashed border-[#bed2c6] bg-white p-10 text-center"><WalletCards className="mx-auto text-[#008753]"/><h3 className="mt-3 font-black">No SabiPay transaction yet</h3><p className="mt-1 text-sm text-[#6c7a72]">An accepted NGN booking will appear here when the client starts payment.</p></div> : <div className="grid gap-4 xl:grid-cols-2">{transactions.map((tx) => {
          const isClient = tx.client.user_id === profile?.user_id; const isProvider = tx.professional.user_id === profile?.user_id;
          return <article key={tx.id} className="rounded-2xl border border-[#dce7e1] bg-white p-5 shadow-sm"><div className="flex flex-wrap items-start justify-between gap-2"><div><p className="text-xs font-bold text-[#708078]">{tx.receipt_number}</p><h3 className="mt-1 text-lg font-black">{tx.scope_summary}</h3></div><span className="rounded-full bg-[#eaf8f1] px-3 py-1 text-xs font-black capitalize text-[#008753]">{label(tx.state)}</span></div><div className="mt-4 grid grid-cols-3 gap-2 rounded-xl bg-[#f5f8f6] p-3 text-xs"><div><p className="text-[#75827b]">Paid</p><p className="mt-1 font-black">₦{money(tx.amount)}</p></div><div><p className="text-[#75827b]">SabiWay fee</p><p className="mt-1 font-black">₦{money(tx.commission_amount)}</p></div><div><p className="text-[#75827b]">Provider</p><p className="mt-1 font-black">₦{money(tx.provider_amount)}</p></div></div><div className="mt-4 space-y-1 text-xs text-[#66756d]"><p>Client: <b>{tx.client.full_name}</b> · Professional: <b>{tx.professional.full_name}</b></p><p>Reconciliation: <b className="capitalize">{label(tx.reconciliation_status)}</b></p>{tx.state === "delivered" && <p className="flex items-center gap-1 font-bold text-[#7a5a00]"><Clock3 size={14}/>{freezeLabel(tx.freeze_seconds_remaining)}</p>}{tx.payout && <p>Payout: <b className="capitalize">{label(tx.payout.status)}</b> · {tx.payout.destination_label}</p>}</div><div className="mt-4 flex flex-wrap gap-2">{tx.state === "pending_payment" && isClient && tx.latest_attempt?.authorization_url && <a href={tx.latest_attempt.authorization_url} className="rounded-xl bg-[#FFB800] px-3 py-2 text-xs font-black">Continue checkout</a>}{tx.state === "funded" && isProvider && <button disabled={busy === `start-service-${tx.id}`} onClick={() => txAction(tx, "start-service")} className="rounded-xl bg-[#008753] px-3 py-2 text-xs font-black text-white">Start service</button>}{tx.state === "in_progress" && isProvider && <button disabled={busy === `mark-delivered-${tx.id}`} onClick={() => txAction(tx, "mark-delivered")} className="rounded-xl bg-[#008753] px-3 py-2 text-xs font-black text-white">Mark delivered</button>}{tx.state === "delivered" && isClient && <button disabled={busy === `confirm-satisfaction-${tx.id}`} onClick={() => txAction(tx, "confirm-satisfaction")} className="rounded-xl bg-[#FFB800] px-3 py-2 text-xs font-black">Confirm satisfaction & release</button>}<span className="inline-flex items-center gap-1 rounded-xl border px-3 py-2 text-xs font-bold"><Receipt size={14}/>{tx.receipt_number}</span></div></article>;
        })}</div>}</section>

        {profile?.role === "professional" && <section className="rounded-2xl border border-[#dce7e1] bg-white p-5 shadow-sm"><p className="text-xs font-black uppercase tracking-[.14em] text-[#008753]">Payout destination</p><h2 className="mt-1 text-xl font-black">Where SabiPay should send released funds</h2>{destinations[0] ? <div className="mt-4 rounded-xl bg-[#f2f8f5] p-4"><p className="font-black">{destinations[0].account_name}</p><p className="mt-1 text-sm text-[#66756d]">{destinations[0].bank_name || destinations[0].bank_code} · ••••{destinations[0].account_last4}</p><p className="mt-2 text-xs font-bold text-[#008753]">Verified with Paystack</p></div> : <p className="mt-3 text-sm text-[#66756d]">Add a Nigerian bank account before escrow can be released. SabiWay stores the Paystack recipient token and only the final four account digits, not the full account number.</p>}<form onSubmit={saveDestination} className="mt-4 grid gap-3 sm:grid-cols-2"><select name="bank_code" required className={input}><option value="">Choose Nigerian bank</option>{banks.filter((bank) => bank.active !== false).map((bank) => <option key={`${bank.code}-${bank.name}`} value={bank.code}>{bank.name}</option>)}</select><input name="account_number" inputMode="numeric" pattern="[0-9]{10}" required className={input} placeholder="10-digit account number"/><div className="sm:col-span-2"><button disabled={busy === "destination"} className="rounded-xl bg-[#008753] px-4 py-2.5 text-sm font-black text-white disabled:opacity-50">{destinations[0] ? "Replace payout destination" : "Verify payout destination"}</button></div></form></section>}
      </div>
    </main>
  );
}
