"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowRight, RefreshCw, WalletCards } from "lucide-react";

import { AppShell } from "@/app/_components/v2/AppShell";
import { InlineAlert, Skeleton, StatusBadge } from "@/app/_components/common/DesignPrimitives";
import { environment } from "@/app/config/environment";
import { useAuthStore } from "@/app/store/useAuthStore";

type Paginated<T> = T[] | { results?: T[] };
type Payout = { id: string; amount: string; currency: string; status: string; destination_label?: string; initiated_at?: string | null; completed_at?: string | null };
type Transaction = { id: string; scope_summary: string; provider_amount: string; currency: string; state: string; payment_status: string; payout?: Payout | null; released_at?: string | null };
type Destination = { id: string; account_name: string; bank_name: string; account_last4: string; is_active: boolean; verified_at: string };
const unwrap = <T,>(payload: Paginated<T>): T[] => Array.isArray(payload) ? payload : payload.results || [];

export default function EarningsPage() {
  const access = useAuthStore((state) => state.access);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!access) return;
    setLoading(true); setError("");
    try {
      const headers = { Authorization: `Bearer ${access}` };
      const [transactionResponse, destinationResponse] = await Promise.all([
        fetch(`${environment.djangoUrl}/api/sabipay/transactions/`, { headers, cache: "no-store" }),
        fetch(`${environment.djangoUrl}/api/sabipay/payout-destinations/`, { headers, cache: "no-store" }),
      ]);
      if (!transactionResponse.ok || !destinationResponse.ok) throw new Error("Your earnings summary could not be loaded.");
      const [transactionPayload, destinationPayload] = await Promise.all([transactionResponse.json(), destinationResponse.json()]);
      setTransactions(unwrap<Transaction>(transactionPayload));
      setDestinations(unwrap<Destination>(destinationPayload));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Your earnings summary could not be loaded.");
    } finally { setLoading(false); }
  }, [access]);

  useEffect(() => { void load(); }, [load]);

  const released = useMemo(() => transactions.filter((item) => item.state === "released" || item.payout?.status === "completed"), [transactions]);
  const pending = useMemo(() => transactions.filter((item) => !released.includes(item) && !["refunded", "cancelled"].includes(item.state)), [transactions, released]);
  const releasedTotal = released.reduce((sum, item) => sum + Number(item.provider_amount || 0), 0);

  return (
    <AppShell>
      <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-9">
        <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[.14em] text-primary">Professional workspace</p><h1 className="mt-1 text-3xl font-black">Earnings</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">See provider amounts, release state and payout destination separately from booking status. SabiPay remains the transaction source of truth.</p></div><Link href="/sabipay" className="inline-flex min-h-11 items-center gap-2 rounded-[var(--sabi-radius-md)] bg-primary px-4 py-2.5 text-sm font-black text-primary-foreground">Open SabiPay <ArrowRight size={16} aria-hidden="true" /></Link></div>
        {error ? <InlineAlert tone="warning" className="mt-5"><p className="font-black">{error}</p><button onClick={() => void load()} className="mt-2 inline-flex items-center gap-2 font-black text-primary"><RefreshCw size={16} aria-hidden="true" />Retry</button></InlineAlert> : null}

        <section className="mt-6 grid gap-3 sm:grid-cols-3" aria-label="Professional earnings summary">
          {loading ? [1, 2, 3].map((item) => <Skeleton key={item} className="h-28 w-full" />) : <><div className="rounded-[var(--sabi-radius-lg)] border border-border bg-card p-4"><p className="text-xs font-black uppercase tracking-[.1em] text-muted-foreground">Released value</p><p className="mt-2 text-2xl font-black">NGN {releasedTotal.toLocaleString("en-NG", { maximumFractionDigits: 2 })}</p><p className="mt-1 text-xs text-muted-foreground">Across released NGN provider amounts</p></div><div className="rounded-[var(--sabi-radius-lg)] border border-border bg-card p-4"><p className="text-xs font-black uppercase tracking-[.1em] text-muted-foreground">Pending transactions</p><p className="mt-2 text-2xl font-black">{pending.length}</p><p className="mt-1 text-xs text-muted-foreground">Funding, delivery, freeze or payout may still be in progress</p></div><div className="rounded-[var(--sabi-radius-lg)] border border-border bg-card p-4"><p className="text-xs font-black uppercase tracking-[.1em] text-muted-foreground">Payout destination</p><p className="mt-2 text-lg font-black">{destinations.find((item) => item.is_active)?.bank_name || "Not configured"}</p><p className="mt-1 text-xs text-muted-foreground">{destinations.find((item) => item.is_active) ? `Account ending ${destinations.find((item) => item.is_active)?.account_last4}` : "Add and verify one in SabiPay"}</p></div></>}
        </section>

        <section className="mt-7 grid gap-4">
          {!loading && transactions.length === 0 ? <div className="rounded-[var(--sabi-radius-lg)] border border-dashed border-border bg-card p-8 text-center"><WalletCards className="mx-auto text-primary" aria-hidden="true" /><h2 className="mt-3 text-xl font-black">No SabiPay earnings yet</h2><p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-muted-foreground">Provider earnings appear after an eligible booking is funded and moves through the protected transaction lifecycle.</p><Link href="/bookings" className="mt-4 inline-flex min-h-11 items-center text-sm font-black text-primary">View bookings <ArrowRight size={16} aria-hidden="true" /></Link></div> : transactions.map((transaction) => <article key={transaction.id} className="rounded-[var(--sabi-radius-lg)] border border-border bg-card p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-[.1em] text-muted-foreground">Provider amount</p><h2 className="mt-1 text-lg font-black">{transaction.scope_summary}</h2></div><StatusBadge tone={transaction.state === "released" ? "success" : "info"}>{transaction.state.replaceAll("_", " ")}</StatusBadge></div><div className="mt-4 flex flex-wrap gap-4 text-sm"><span className="font-black">{transaction.currency} {transaction.provider_amount}</span><span className="text-muted-foreground">Payment: {transaction.payment_status.replaceAll("_", " ")}</span><span className="text-muted-foreground">Payout: {transaction.payout?.status?.replaceAll("_", " ") || "not started"}</span></div></article>)}
        </section>
      </main>
    </AppShell>
  );
}
