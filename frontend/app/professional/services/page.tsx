"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ArrowRight, RefreshCw, Store } from "lucide-react";

import { AppShell } from "@/app/_components/v2/AppShell";
import { InlineAlert, Skeleton, StatusBadge } from "@/app/_components/common/DesignPrimitives";
import { environment } from "@/app/config/environment";
import { useAuthStore } from "@/app/store/useAuthStore";

type Paginated<T> = T[] | { results?: T[] };
type Listing = {
  id: string;
  title: string;
  description: string;
  price_from: string;
  currency: string;
  delivery_mode: string;
  moderation_status: string;
  is_active: boolean;
  available_now?: boolean;
  category?: { name?: string };
};

const unwrap = <T,>(payload: Paginated<T>): T[] => Array.isArray(payload) ? payload : payload.results || [];

export default function ProfessionalServicesPage() {
  const access = useAuthStore((state) => state.access);
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!access) return;
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${environment.djangoUrl}/api/marketplace/listings/?mine=1`, {
        headers: { Authorization: `Bearer ${access}` },
        cache: "no-store",
      });
      if (!response.ok) throw new Error("Your services could not be loaded.");
      setListings(unwrap<Listing>(await response.json()));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Your services could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, [access]);

  useEffect(() => { void load(); }, [load]);

  return (
    <AppShell>
      <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-9">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div><p className="text-xs font-black uppercase tracking-[.14em] text-primary">Professional workspace</p><h1 className="mt-1 text-3xl font-black">My Services</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Manage the service propositions Clients can discover. Moderation and active status stay visible rather than being treated as the same thing.</p></div>
          <Link href="/marketplace" className="inline-flex min-h-11 items-center gap-2 rounded-[var(--sabi-radius-md)] bg-primary px-4 py-2.5 text-sm font-black text-primary-foreground">Open marketplace <ArrowRight size={16} aria-hidden="true" /></Link>
        </div>

        {error ? <InlineAlert tone="warning" className="mt-5"><p className="font-black">{error}</p><button onClick={() => void load()} className="mt-2 inline-flex items-center gap-2 font-black text-primary"><RefreshCw size={16} aria-hidden="true" />Retry</button></InlineAlert> : null}

        <section className="mt-6 grid gap-4">
          {loading ? [1, 2, 3].map((item) => <Skeleton key={item} className="h-40 w-full" />) : listings.length === 0 ? (
            <div className="rounded-[var(--sabi-radius-lg)] border border-dashed border-border bg-card p-8 text-center"><Store className="mx-auto text-primary" aria-hidden="true" /><h2 className="mt-3 text-xl font-black">No service listing yet</h2><p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-muted-foreground">Your Professional onboarding draft or future marketplace listing will appear here. Public discovery only shows listings that meet the marketplace publication rules.</p><Link href="/marketplace" className="mt-4 inline-flex min-h-11 items-center text-sm font-black text-primary">Review marketplace <ArrowRight size={16} aria-hidden="true" /></Link></div>
          ) : listings.map((listing) => (
            <article key={listing.id} className="rounded-[var(--sabi-radius-lg)] border border-border bg-card p-5 shadow-[var(--sabi-shadow-sm)]">
              <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-[.1em] text-muted-foreground">{listing.category?.name || "Service"}</p><h2 className="mt-1 text-xl font-black">{listing.title}</h2></div><div className="flex flex-wrap gap-2"><StatusBadge tone={listing.moderation_status === "approved" ? "success" : "info"}>{listing.moderation_status.replaceAll("_", " ")}</StatusBadge><StatusBadge tone={listing.is_active ? "success" : "neutral"}>{listing.is_active ? "active" : "inactive"}</StatusBadge></div></div>
              <p className="mt-3 line-clamp-2 text-sm leading-6 text-muted-foreground">{listing.description}</p>
              <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm"><span className="font-black">{listing.currency} {listing.price_from}</span><span className="text-muted-foreground">{listing.delivery_mode.replaceAll("_", " ")}</span><span className="text-muted-foreground">{listing.available_now ? "Available now" : "Availability by arrangement"}</span></div>
            </article>
          ))}
        </section>
      </main>
    </AppShell>
  );
}
