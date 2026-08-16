"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, BellRing, LifeBuoy, MessageSquareWarning, ShieldCheck, Star } from "lucide-react";

import { environment } from "@/app/config/environment";

type Profile = { user_id: number; full_name: string; username: string; role?: string | null; rating_average?: string; rating_count?: number };
type Tx = { id: string; booking_id: string; client: Profile; professional: Profile; amount: string; currency: string; state: string; receipt_number: string; release_eligible_at?: string | null };
type DisputeCase = { id: number; transaction_id: string; receipt_number: string; dispute_status: string; reason: string; details: string; priority: string; response_due_at?: string | null; decision?: string; decision_reason?: string; created_at: string };
type Review = { id: string; transaction: string; client: Profile; professional: Profile; rating: number; title: string; body: string; moderation_status: string; created_at: string };
type SupportCase = { id: string; category: string; summary: string; details: string; status: string; priority: string; response_due_at?: string | null; created_at: string };
type Preferences = { push_enabled: boolean; email_enabled: boolean; payment_email_enabled: boolean; dispute_email_enabled: boolean };

type Tab = "disputes" | "reviews" | "support" | "notifications";

const field = "min-h-11 w-full rounded-xl border border-[#d9e4dd] bg-white px-3 text-sm outline-none focus:border-[#008753] focus:ring-2 focus:ring-[#008753]/10";
const card = "rounded-2xl border border-[#dce8e1] bg-white p-4 shadow-sm";
function unwrap<T>(payload: T[] | { results: T[] }): T[] { return Array.isArray(payload) ? payload : payload.results; }
function label(value: string) { return value.replaceAll("_", " "); }

export default function TrustClient() {
  const [token, setToken] = useState("");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [transactions, setTransactions] = useState<Tx[]>([]);
  const [disputes, setDisputes] = useState<DisputeCase[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [supportCases, setSupportCases] = useState<SupportCase[]>([]);
  const [preferences, setPreferences] = useState<Preferences | null>(null);
  const [tab, setTab] = useState<Tab>("disputes");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const headers = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);

  useEffect(() => {
    const access = window.localStorage.getItem("access") || "";
    if (!access) { window.location.href = "/login?next=/trust"; return; }
    setToken(access);
    const requested = new URLSearchParams(window.location.search).get("tab") as Tab | null;
    if (requested && ["disputes", "reviews", "support", "notifications"].includes(requested)) setTab(requested);
  }, []);

  const load = useCallback(async () => {
    if (!token) return;
    setError("");
    const [profileResponse, txResponse, disputeResponse, supportResponse, prefResponse] = await Promise.all([
      fetch(`${environment.djangoUrl}/api/profiles/me/`, { headers }),
      fetch(`${environment.djangoUrl}/api/sabipay/transactions/`, { headers }),
      fetch(`${environment.djangoUrl}/api/trust/disputes/`, { headers }),
      fetch(`${environment.djangoUrl}/api/trust/support/`, { headers }),
      fetch(`${environment.djangoUrl}/api/notifications/preferences/`, { headers }),
    ]);
    if (!profileResponse.ok || !txResponse.ok || !disputeResponse.ok || !supportResponse.ok) {
      setError("Trust Centre could not load your current service history."); setLoading(false); return;
    }
    const me = await profileResponse.json() as Profile;
    setProfile(me);
    setTransactions(unwrap<Tx>(await txResponse.json()));
    setDisputes(unwrap<DisputeCase>(await disputeResponse.json()));
    setSupportCases(unwrap<SupportCase>(await supportResponse.json()));
    if (prefResponse.ok) setPreferences(await prefResponse.json());
    const reviewUrl = me.role === "professional" ? `${environment.djangoUrl}/api/trust/reviews/?professional=${encodeURIComponent(me.username)}` : `${environment.djangoUrl}/api/trust/reviews/`;
    const reviewResponse = await fetch(reviewUrl, { headers });
    if (reviewResponse.ok) setReviews(unwrap<Review>(await reviewResponse.json()));
    setLoading(false);
  }, [headers, token]);

  useEffect(() => { load(); }, [load]);

  async function createDispute(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(""); setNotice("");
    const form = new FormData(event.currentTarget);
    const response = await fetch(`${environment.djangoUrl}/api/trust/disputes/`, { method: "POST", headers, body: form });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) setError(payload.detail || payload.non_field_errors?.[0] || "Dispute could not be opened.");
    else { setNotice("Dispute opened. SabiPay release is frozen while the case is reviewed."); event.currentTarget.reset(); await load(); }
    setBusy(false);
  }

  async function createReview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(""); setNotice("");
    const form = new FormData(event.currentTarget);
    const response = await fetch(`${environment.djangoUrl}/api/trust/reviews/`, { method: "POST", headers: { ...headers, "Content-Type": "application/json" }, body: JSON.stringify(Object.fromEntries(form.entries())) });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) setError(payload.detail || payload.non_field_errors?.[0] || "Review could not be submitted.");
    else { setNotice("Review published from a verified completed booking."); event.currentTarget.reset(); await load(); }
    setBusy(false);
  }

  async function openSupport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(""); setNotice("");
    const form = new FormData(event.currentTarget);
    const payloadBody = Object.fromEntries(form.entries());
    const response = await fetch(`${environment.djangoUrl}/api/trust/support/`, { method: "POST", headers: { ...headers, "Content-Type": "application/json" }, body: JSON.stringify(payloadBody) });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) setError(payload.detail || payload.non_field_errors?.[0] || "Support case could not be opened.");
    else { setNotice("Support case opened and added to the operations queue."); event.currentTarget.reset(); await load(); }
    setBusy(false);
  }

  async function savePreferences(next: Preferences) {
    setPreferences(next); setError("");
    const response = await fetch(`${environment.djangoUrl}/api/notifications/preferences/`, { method: "PATCH", headers: { ...headers, "Content-Type": "application/json" }, body: JSON.stringify(next) });
    if (!response.ok) setError("Notification preferences could not be saved."); else setNotice("Notification preferences updated. In-app history remains available for recovery.");
  }

  const disputeEligible = transactions.filter((tx) => tx.state === "delivered");
  const reviewEligible = transactions.filter((tx) => tx.state === "released" && tx.client.user_id === profile?.user_id && !reviews.some((review) => review.transaction === tx.id));

  if (loading) return <div className="min-h-screen bg-[#f7faf8] p-8 text-[#173126]">Loading Trust Centre…</div>;

  return (
    <main className="min-h-screen bg-[#f7faf8] text-[#173126]">
      <header className="border-b border-[#dce8e1] bg-white"><div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6"><Link href="/marketplace" className="font-black text-[#008753]">← Marketplace</Link><div className="text-xl font-black">Trust Centre</div><Link href="/sabipay" className="text-sm font-bold">SabiPay</Link></div></header>
      <section className="mx-auto max-w-7xl px-3 py-5 sm:px-6 lg:py-8">
        <div className="rounded-3xl bg-[#073522] p-6 text-white sm:p-8"><p className="text-xs font-black uppercase tracking-[.16em] text-[#8dd1b3]">Post-service protection</p><h1 className="mt-2 text-3xl font-black">Disputes, reviews and support in one auditable place</h1><p className="mt-3 max-w-3xl text-sm leading-6 text-white/75">Raise a dispute before escrow release, leave a review only after a completed transaction, and keep support history recoverable even when push or email delivery fails.</p></div>
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">{([
          ["disputes", MessageSquareWarning, "Disputes"], ["reviews", Star, "Reviews"], ["support", LifeBuoy, "Support"], ["notifications", BellRing, "Notifications"],
        ] as const).map(([value, Icon, text]) => <button key={value} onClick={() => setTab(value)} className={`rounded-xl border px-3 py-3 text-sm font-black ${tab === value ? "border-[#008753] bg-[#008753] text-white" : "border-[#dce8e1] bg-white"}`}><Icon size={16} className="mr-1 inline"/>{text}</button>)}</div>
        {notice && <p className="mt-4 rounded-xl bg-[#eaf8f1] p-3 text-sm font-bold text-[#006b42]">{notice}</p>}
        {error && <p className="mt-4 flex gap-2 rounded-xl bg-red-50 p-3 text-sm font-bold text-red-700"><AlertTriangle size={18}/>{error}</p>}

        {tab === "disputes" && <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
          <section className={card}><h2 className="text-xl font-black">Your disputes</h2><div className="mt-4 space-y-3">{disputes.length === 0 ? <p className="text-sm text-[#68776f]">No disputes have been raised.</p> : disputes.map((item) => <article key={item.id} className="rounded-xl border border-[#e1e9e4] p-4"><div className="flex flex-wrap items-center justify-between gap-2"><b>{item.receipt_number}</b><span className="rounded-full bg-[#f4f7f5] px-2 py-1 text-xs font-bold capitalize">{label(item.dispute_status)}</span></div><p className="mt-2 text-sm font-bold">{item.reason}</p><p className="mt-1 text-sm text-[#68776f]">{item.details}</p>{item.decision && <p className="mt-2 text-xs font-bold text-[#008753]">Decision: {label(item.decision)}</p>}</article>)}</div></section>
          <form onSubmit={createDispute} className={`${card} h-fit space-y-3`}><div className="flex items-center gap-2"><ShieldCheck className="text-[#008753]"/><h2 className="text-lg font-black">Raise a dispute</h2></div><p className="text-xs text-[#68776f]">Only delivered transactions still inside the SabiPay freeze window are eligible.</p><select name="transaction_id" required className={field}><option value="">Choose transaction</option>{disputeEligible.map((tx) => <option key={tx.id} value={tx.id}>{tx.receipt_number} · {tx.currency} {Number(tx.amount).toLocaleString()}</option>)}</select><input name="reason" required maxLength={80} className={field} placeholder="Reason"/><textarea name="details" className={`${field} min-h-28 py-3`} placeholder="What happened and what outcome are you seeking?"/><input name="evidence" type="file" accept="image/jpeg,image/png,image/webp,application/pdf,text/plain" className="block w-full text-xs"/><button disabled={busy || disputeEligible.length === 0} className="w-full rounded-xl bg-[#FFB800] px-4 py-3 text-sm font-black disabled:opacity-50">Open dispute</button></form>
        </div>}

        {tab === "reviews" && <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
          <section className={card}><h2 className="text-xl font-black">Verified service reviews</h2><div className="mt-4 space-y-3">{reviews.length === 0 ? <p className="text-sm text-[#68776f]">No eligible reviews yet.</p> : reviews.map((review) => <article key={review.id} className="rounded-xl border border-[#e1e9e4] p-4"><div className="flex items-center justify-between"><b>{review.professional.full_name}</b><span className="font-black text-[#B77B00]">{"★".repeat(review.rating)}</span></div><p className="mt-2 text-sm font-bold">{review.title}</p><p className="mt-1 text-sm text-[#68776f]">{review.body}</p><p className="mt-2 text-[11px] text-[#7d8983]">Completed-booking review · {new Date(review.created_at).toLocaleDateString()}</p></article>)}</div></section>
          {profile?.role === "client" ? <form onSubmit={createReview} className={`${card} h-fit space-y-3`}><h2 className="text-lg font-black">Review completed service</h2><select name="transaction_id" required className={field}><option value="">Choose completed transaction</option>{reviewEligible.map((tx) => <option key={tx.id} value={tx.id}>{tx.receipt_number} · {tx.professional.full_name}</option>)}</select><select name="rating" defaultValue="5" className={field}>{[5,4,3,2,1].map((value) => <option key={value} value={value}>{value} / 5</option>)}</select><input name="title" maxLength={120} className={field} placeholder="Short summary"/><textarea name="body" className={`${field} min-h-24 py-3`} placeholder="Share useful service feedback"/><button disabled={busy || reviewEligible.length === 0} className="w-full rounded-xl bg-[#008753] px-4 py-3 text-sm font-black text-white disabled:opacity-50">Publish verified review</button></form> : <aside className={card}><h2 className="text-lg font-black">Your reputation</h2><p className="mt-3 text-4xl font-black">{profile?.rating_average ?? "0.00"}</p><p className="text-sm text-[#68776f]">from {profile?.rating_count ?? 0} eligible completed-booking reviews</p></aside>}
        </div>}

        {tab === "support" && <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
          <section className={card}><h2 className="text-xl font-black">Support history</h2><div className="mt-4 space-y-3">{supportCases.length === 0 ? <p className="text-sm text-[#68776f]">No support cases yet.</p> : supportCases.map((item) => <article key={item.id} className="rounded-xl border border-[#e1e9e4] p-4"><div className="flex justify-between gap-2"><b>{item.summary}</b><span className="text-xs font-bold capitalize">{label(item.status)}</span></div><p className="mt-1 text-sm text-[#68776f]">{item.details}</p><p className="mt-2 text-xs">Priority: <b className="capitalize">{item.priority}</b></p></article>)}</div></section>
          <form onSubmit={openSupport} className={`${card} h-fit space-y-3`}><h2 className="text-lg font-black">Open support case</h2><input name="category" required className={field} placeholder="Category e.g. payment, booking, safety"/><input name="summary" required maxLength={180} className={field} placeholder="Short summary"/><textarea name="details" className={`${field} min-h-28 py-3`} placeholder="Tell support what you need"/><select name="transaction_id" className={field}><option value="">Optional transaction</option>{transactions.map((tx) => <option key={tx.id} value={tx.id}>{tx.receipt_number}</option>)}</select><button disabled={busy} className="w-full rounded-xl bg-[#008753] px-4 py-3 text-sm font-black text-white disabled:opacity-50">Open support case</button></form>
        </div>}

        {tab === "notifications" && <section className={`${card} mt-5 max-w-2xl`}><h2 className="text-xl font-black">Notification recovery</h2><p className="mt-2 text-sm text-[#68776f]">In-app history is always the authoritative record. Push and email are delivery aids and can be changed here.</p>{preferences && <div className="mt-5 space-y-3">{([
          ["push_enabled", "Push notifications"], ["email_enabled", "Email notifications"], ["payment_email_enabled", "Payment emails"], ["dispute_email_enabled", "Dispute emails"],
        ] as const).map(([key, text]) => <label key={key} className="flex items-center justify-between rounded-xl border p-3"><span className="font-bold">{text}</span><input type="checkbox" checked={preferences[key]} onChange={(e) => savePreferences({ ...preferences, [key]: e.target.checked })}/></label>)}</div>}<Link href="/notifications" className="mt-5 inline-block font-black text-[#008753]">Open in-app notification history →</Link></section>}
      </section>
    </main>
  );
}
