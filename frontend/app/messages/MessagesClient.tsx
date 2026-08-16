"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { io, type Socket } from "socket.io-client";
import { AlertTriangle, ArrowLeft, CalendarClock, FileUp, MessageCircle, ShieldAlert, WalletCards } from "lucide-react";

import { environment } from "@/app/config/environment";

type Profile = { user_id: number; full_name: string; username: string; role?: string | null; job?: string | null };
type Thread = { id: string; client: Profile; professional: Profile; status: string; unread_count: number; booking_id?: string | null };
type Message = { id: string; thread: string; sender: Profile; body: string; attachment?: string | null; attachment_name?: string; created_at: string };
type Proposal = { id: string; proposed_for: string; timezone: string; note: string; status: string; proposer: Profile };
type Booking = { id: string; thread: string; client: Profile; professional: Profile; scope_summary: string; agreed_price?: string | null; currency: string; requested_for?: string | null; timezone: string; schedule_status: string; status: string; schedule_proposals: Proposal[] };

const field = "min-h-11 w-full rounded-xl border border-[#d9e4dd] bg-white px-3 text-sm outline-none focus:border-[#008753] focus:ring-2 focus:ring-[#008753]/10";
function unwrap<T>(payload: T[] | { results: T[] }): T[] { return Array.isArray(payload) ? payload : payload.results; }
function money(value: number) { return value.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }

export default function MessagesClient() {
  const [token, setToken] = useState("");
  const [threads, setThreads] = useState<Thread[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const authHeaders = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);
  const active = threads.find((item) => item.id === activeId) ?? null;

  useEffect(() => {
    const access = window.localStorage.getItem("access") ?? "";
    if (!access) { window.location.href = "/login?next=/messages"; return; }
    setToken(access);
    const fromUrl = new URLSearchParams(window.location.search).get("thread");
    if (fromUrl) setActiveId(fromUrl);
  }, []);

  const loadThreads = useCallback(async () => {
    if (!token) return;
    const response = await fetch(`${environment.djangoUrl}/api/marketplace/threads/`, { headers: authHeaders });
    if (!response.ok) { setError("Could not load conversations."); setLoading(false); return; }
    const next = unwrap<Thread>(await response.json());
    setThreads(next); setActiveId((current) => current ?? next[0]?.id ?? null); setLoading(false);
  }, [authHeaders, token]);

  const loadConversation = useCallback(async (threadId: string) => {
    if (!token) return;
    const [messageResponse, bookingResponse] = await Promise.all([
      fetch(`${environment.djangoUrl}/api/marketplace/messages/?thread=${threadId}`, { headers: authHeaders }),
      fetch(`${environment.djangoUrl}/api/marketplace/bookings/`, { headers: authHeaders }),
    ]);
    if (messageResponse.ok) setMessages(unwrap<Message>(await messageResponse.json()));
    if (bookingResponse.ok) {
      const all = unwrap<Booking>(await bookingResponse.json());
      setBooking(all.find((item) => item.thread === threadId) ?? null);
    }
    await fetch(`${environment.djangoUrl}/api/marketplace/threads/${threadId}/mark-read/`, { method: "POST", headers: authHeaders });
  }, [authHeaders, token]);

  useEffect(() => { loadThreads(); }, [loadThreads]);
  useEffect(() => { if (activeId) loadConversation(activeId); }, [activeId, loadConversation]);
  useEffect(() => {
    if (!token) return;
    const socket: Socket = io(environment.realtimeUrl, { auth: { token }, transports: ["websocket", "polling"] });
    const refresh = () => { loadThreads(); if (activeId) loadConversation(activeId); };
    socket.on("new-message", refresh); socket.on("booking-updated", refresh); socket.on("schedule-updated", refresh);
    return () => { socket.disconnect(); };
  }, [activeId, loadConversation, loadThreads, token]);

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!activeId) return; setError(""); setNotice("");
    const data = new FormData(event.currentTarget); data.set("thread_id", activeId);
    const response = await fetch(`${environment.djangoUrl}/api/marketplace/messages/`, { method: "POST", headers: authHeaders, body: data });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) { setError(payload.non_field_errors?.[0] || payload.detail || "Message could not be sent."); return; }
    setMessages((current) => [...current, payload as Message]); event.currentTarget.reset();
  }

  async function createBooking(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!activeId) return;
    const data = new FormData(event.currentTarget);
    const response = await fetch(`${environment.djangoUrl}/api/marketplace/bookings/`, { method: "POST", headers: { ...authHeaders, "Content-Type": "application/json" }, body: JSON.stringify({ thread_id: activeId, scope_summary: data.get("scope_summary"), agreed_price: data.get("agreed_price") || null, currency: data.get("currency") || "NGN", timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC" }) });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) { setError(payload.non_field_errors?.[0] || payload.detail || "Booking agreement could not be created."); return; }
    setBooking(payload as Booking); setNotice("Booking summary sent for professional acceptance."); await loadThreads();
  }

  async function updateBooking(status: string) {
    if (!booking) return; setError("");
    const response = await fetch(`${environment.djangoUrl}/api/marketplace/bookings/${booking.id}/status/`, { method: "POST", headers: { ...authHeaders, "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) { setError(payload.detail || payload.non_field_errors?.[0] || "Booking status could not be updated."); return; }
    setBooking(payload as Booking); setNotice(`Booking updated to ${status.replace("_", " ")}.`);
  }

  async function proposeSchedule(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!booking || !activeId) return;
    const data = new FormData(event.currentTarget); const local = String(data.get("proposed_for") || ""); if (!local) return;
    const response = await fetch(`${environment.djangoUrl}/api/marketplace/schedule-proposals/`, { method: "POST", headers: { ...authHeaders, "Content-Type": "application/json" }, body: JSON.stringify({ booking_id: booking.id, proposed_for: new Date(local).toISOString(), timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC", note: data.get("note") || "" }) });
    if (!response.ok) { setError("Schedule proposal could not be sent."); return; }
    setNotice("Schedule proposal sent."); await loadConversation(activeId);
  }

  async function decideSchedule(proposalId: string, status: "accepted" | "declined") {
    const response = await fetch(`${environment.djangoUrl}/api/marketplace/schedule-proposals/${proposalId}/decision/`, { method: "POST", headers: { ...authHeaders, "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    if (!response.ok) { setError("Schedule decision could not be saved."); return; }
    if (activeId) await loadConversation(activeId);
  }

  async function safetyAction(action: "block" | "report") {
    if (!activeId) return;
    const options: RequestInit = { method: "POST", headers: action === "report" ? { ...authHeaders, "Content-Type": "application/json" } : authHeaders };
    if (action === "report") options.body = JSON.stringify({ reason: "other", details: "Reported from the conversation safety controls." });
    const response = await fetch(`${environment.djangoUrl}/api/marketplace/threads/${activeId}/${action}/`, options);
    if (!response.ok) { setError(`Could not ${action} this conversation.`); return; }
    setNotice(action === "report" ? "Report sent to SabiWay support." : "User blocked. Messaging is now restricted.");
  }

  if (loading) return <div className="min-h-screen bg-[#f7faf8] p-8 text-[#173126]">Loading messages…</div>;
  const amount = Number(booking?.agreed_price || 0); const fee = amount * 0.10; const providerPayout = amount - fee;

  return <main className="min-h-screen bg-[#f7faf8] text-[#173126]">
    <header className="border-b border-[#dce8e1] bg-white"><div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6"><Link href="/marketplace" className="inline-flex items-center gap-2 font-black"><ArrowLeft size={18}/> Marketplace</Link><div className="text-xl font-black">Messages & bookings</div><div className="flex items-center gap-3"><Link href="/sabipay" className="inline-flex items-center gap-1 text-sm font-bold text-[#008753]"><WalletCards size={16}/>SabiPay</Link><Link href="/community" className="text-sm font-bold text-[#008753]">SabiForum</Link></div></div></header>
    <div className="mx-auto grid max-w-7xl gap-4 px-3 py-4 sm:px-6 lg:grid-cols-[300px_minmax(0,1fr)_360px]">
      <aside className="overflow-hidden rounded-2xl border border-[#dce7e1] bg-white"><div className="border-b p-4"><p className="text-xs font-black uppercase tracking-[.14em] text-[#008753]">Conversations</p><h1 className="mt-1 text-xl font-black">Your inbox</h1></div><div className="max-h-[72vh] overflow-y-auto">{threads.length === 0 ? <p className="p-5 text-sm text-[#68776f]">No conversations yet.</p> : threads.map((thread) => <button key={thread.id} onClick={() => setActiveId(thread.id)} className={`w-full border-b p-4 text-left ${activeId === thread.id ? "bg-[#eef8f3]" : "hover:bg-[#f8fbf9]"}`}><div className="flex justify-between gap-2"><p className="font-extrabold">{thread.professional.full_name}</p>{thread.unread_count > 0 && <span className="rounded-full bg-[#008753] px-2 text-xs font-black text-white">{thread.unread_count}</span>}</div><p className="mt-1 text-xs text-[#6b7a72]">{thread.professional.job || "SabiWay professional"}</p></button>)}</div></aside>
      <section className="flex min-h-[72vh] flex-col overflow-hidden rounded-2xl border border-[#dce7e1] bg-white">{active ? <><div className="flex items-center justify-between border-b p-4"><div><p className="font-black">{active.professional.full_name}</p><p className="text-xs text-[#6b7a72]">Private SabiWay conversation</p></div><div className="flex gap-2"><button onClick={() => safetyAction("report")} className="rounded-lg border px-3 py-2 text-xs font-bold"><ShieldAlert size={14} className="mr-1 inline"/>Report</button><button onClick={() => safetyAction("block")} className="rounded-lg border px-3 py-2 text-xs font-bold text-red-700">Block</button></div></div><div className="flex-1 space-y-3 overflow-y-auto bg-[#f9fbfa] p-4">{messages.length === 0 ? <div className="grid h-full place-items-center text-center text-sm text-[#718078]"><div><MessageCircle className="mx-auto mb-2 text-[#008753]"/><p>Discuss scope, outcome, price and availability before booking.</p></div></div> : messages.map((message) => <article key={message.id} className="max-w-[85%] rounded-2xl border bg-white p-3 shadow-sm"><p className="text-xs font-black text-[#008753]">{message.sender.full_name}</p>{message.body && <p className="mt-1 whitespace-pre-wrap text-sm leading-6">{message.body}</p>}{message.attachment && <a href={message.attachment} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-[#008753]"><FileUp size={14}/>{message.attachment_name || "Attachment"}</a>}<p className="mt-2 text-[10px] text-[#829087]">{new Date(message.created_at).toLocaleString()}</p></article>)}</div><form onSubmit={sendMessage} className="border-t p-3"><textarea name="body" className={`${field} min-h-20 py-3`} placeholder="Write a message"/><div className="mt-2 flex items-center justify-between"><label className="cursor-pointer rounded-xl border px-3 py-2 text-xs font-bold"><FileUp size={14} className="mr-1 inline"/>Attach<input name="attachment" type="file" accept="image/jpeg,image/png,image/webp,application/pdf,text/plain" className="hidden"/></label><button className="rounded-xl bg-[#008753] px-5 py-2.5 text-sm font-black text-white">Send</button></div></form></> : <div className="grid flex-1 place-items-center p-8 text-[#718078]">Choose a conversation.</div>}</section>
      <aside className="rounded-2xl border border-[#dce7e1] bg-white p-4"><p className="text-xs font-black uppercase tracking-[.14em] text-[#008753]">Agreement</p><h2 className="mt-1 text-xl font-black">Booking, fee & schedule</h2>{!active ? <p className="mt-4 text-sm text-[#68776f]">Choose a conversation.</p> : booking ? <div className="mt-4 space-y-4"><div className="rounded-xl bg-[#f3f8f5] p-3"><p className="text-xs font-bold text-[#68776f]">Scope</p><p className="mt-1 text-sm font-semibold">{booking.scope_summary}</p><p className="mt-3 text-xs font-bold text-[#68776f]">Agreed service amount</p><p className="font-black">{booking.currency} {money(amount)}</p><p className="mt-2 text-xs">Status: <b>{booking.status.replace("_", " ")}</b></p></div>{booking.currency === "NGN" && <div className="rounded-xl border border-[#f1d67c] bg-[#fff8dd] p-3"><p className="text-xs font-black uppercase tracking-[.12em] text-[#7a5a00]">SabiPay fee before acceptance</p><div className="mt-2 grid grid-cols-2 gap-2 text-xs"><div><p className="text-[#756823]">SabiWay fee (10%)</p><p className="font-black">₦{money(fee)}</p></div><div><p className="text-[#756823]">Provider payout</p><p className="font-black">₦{money(providerPayout)}</p></div></div><p className="mt-2 text-[11px] leading-5 text-[#756823]">By accepting this NGN booking, the professional sees and accepts the 10% platform fee. Service should only begin after SabiPay confirms funding.</p></div>}{booking.status === "pending" && <div className="grid grid-cols-2 gap-2"><button onClick={() => updateBooking("accepted")} className="rounded-xl bg-[#008753] px-3 py-2 text-xs font-black text-white">Accept with fee</button><button onClick={() => updateBooking("declined")} className="rounded-xl border px-3 py-2 text-xs font-black">Decline</button></div>}{booking.status === "accepted" && booking.currency === "NGN" && <Link href="/sabipay" className="block rounded-xl bg-[#FFB800] px-3 py-2 text-center text-xs font-black">Open SabiPay</Link>}<form onSubmit={proposeSchedule} className="space-y-2"><p className="flex items-center gap-2 text-sm font-black"><CalendarClock size={16}/> Propose a time</p><input name="proposed_for" type="datetime-local" required className={field}/><input name="note" className={field} placeholder="Optional note"/><button className="w-full rounded-xl border border-[#008753] px-3 py-2 text-xs font-black text-[#008753]">Send schedule proposal</button></form>{booking.schedule_proposals.filter((p) => p.status === "proposed").map((proposal) => <div key={proposal.id} className="rounded-xl border p-3 text-xs"><p className="font-bold">{new Date(proposal.proposed_for).toLocaleString()}</p><p className="mt-1 text-[#6b7a72]">{proposal.timezone} · {proposal.proposer.full_name}</p><div className="mt-2 flex gap-2"><button onClick={() => decideSchedule(proposal.id, "accepted")} className="rounded-lg bg-[#FFB800] px-3 py-1.5 font-black">Accept</button><button onClick={() => decideSchedule(proposal.id, "declined")} className="rounded-lg border px-3 py-1.5 font-black">Request change</button></div></div>)}</div> : <form onSubmit={createBooking} className="mt-4 space-y-3"><p className="text-sm text-[#68776f]">Once scope and price are agreed, create the auditable booking summary.</p><textarea name="scope_summary" required className={`${field} min-h-24 py-2`} placeholder="Agreed scope of work"/><input name="agreed_price" required type="number" min="0.01" step="0.01" className={field} placeholder="Agreed price"/><select name="currency" defaultValue="NGN" className={field}><option>NGN</option><option>GBP</option><option>USD</option><option>EUR</option></select><button className="w-full rounded-xl bg-[#FFB800] px-4 py-3 text-sm font-black">Create booking summary</button></form>}{notice && <p className="mt-4 rounded-xl bg-[#eaf8f1] p-3 text-xs font-bold text-[#006b42]">{notice}</p>}{error && <p className="mt-4 flex gap-2 rounded-xl bg-red-50 p-3 text-xs font-bold text-red-700"><AlertTriangle size={15}/>{error}</p>}</aside>
    </div>
  </main>;
}
