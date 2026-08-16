"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";

import { environment } from "@/app/config/environment";

export type MarketplaceListing = {
  id: string;
  title: string;
  description: string;
  price_from: string;
  currency: string;
  delivery_mode: "in_person" | "remote" | "both";
  state: string;
  area: string;
  provider: { full_name: string; username: string; job?: string | null };
  category: { id: number; name: string; slug: string };
};

export type MarketplaceCategory = {
  id: number;
  name: string;
  slug: string;
  description: string;
};

type Props = {
  initialListings: MarketplaceListing[];
  categories: MarketplaceCategory[];
};

export default function MarketplaceClient({ initialListings, categories }: Props) {
  const [listings, setListings] = useState(initialListings);
  const [query, setQuery] = useState("");
  const [stateFilter, setStateFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [selected, setSelected] = useState<MarketplaceListing | null>(null);
  const [bookingMessage, setBookingMessage] = useState("");
  const [bookingState, setBookingState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [bookingError, setBookingError] = useState("");
  const [showPublish, setShowPublish] = useState(false);
  const [publishState, setPublishState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [publishError, setPublishError] = useState("");

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const stateNeedle = stateFilter.trim().toLowerCase();
    return listings.filter((listing) => {
      const matchesQuery = !needle || [
        listing.title,
        listing.description,
        listing.provider.full_name,
        listing.provider.job ?? "",
        listing.category.name,
        listing.area,
        listing.state,
      ].some((value) => value.toLowerCase().includes(needle));
      const matchesState = !stateNeedle || listing.state.toLowerCase().includes(stateNeedle);
      const matchesCategory = !categoryFilter || listing.category.slug === categoryFilter;
      return matchesQuery && matchesState && matchesCategory;
    });
  }, [listings, query, stateFilter, categoryFilter]);

  const accessToken = () => typeof window === "undefined" ? null : window.localStorage.getItem("access");

  const sendBooking = async () => {
    if (!selected) return;
    const access = accessToken();
    if (!access) {
      window.location.href = "/login?next=/marketplace";
      return;
    }

    setBookingState("sending");
    setBookingError("");
    try {
      const response = await fetch(`${environment.djangoUrl}/api/marketplace/bookings/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${access}` },
        body: JSON.stringify({ listing_id: selected.id, message: bookingMessage.trim() }),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.detail || payload.non_field_errors?.[0] || "Could not send booking request.");
      }
      setBookingState("sent");
      setBookingMessage("");
    } catch (error) {
      setBookingState("error");
      setBookingError(error instanceof Error ? error.message : "Could not send booking request.");
    }
  };

  const publish = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const access = accessToken();
    if (!access) {
      window.location.href = "/login?next=/marketplace";
      return;
    }

    const data = new FormData(event.currentTarget);
    setPublishState("sending");
    setPublishError("");
    try {
      const response = await fetch(`${environment.djangoUrl}/api/marketplace/listings/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${access}` },
        body: JSON.stringify({
          category_id: Number(data.get("category_id")),
          title: data.get("title"),
          description: data.get("description"),
          price_from: data.get("price_from"),
          currency: "NGN",
          delivery_mode: data.get("delivery_mode"),
          state: data.get("state"),
          area: data.get("area"),
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.detail || "Only professional profiles can publish a service.");
      setListings((current) => [payload as MarketplaceListing, ...current]);
      setPublishState("sent");
      event.currentTarget.reset();
    } catch (error) {
      setPublishState("error");
      setPublishError(error instanceof Error ? error.message : "Could not publish service.");
    }
  };

  return (
    <main className="min-h-screen bg-[#f7faf8] px-4 py-8 text-[#17211b] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <section className="mb-8 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5 sm:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="mb-2 text-sm font-semibold uppercase tracking-[0.18em] text-[#008753]">SabiWay Marketplace</p>
              <h1 className="max-w-3xl text-3xl font-bold sm:text-4xl">Find trusted professionals for the work you need done.</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-[#637067] sm:text-base">
                Discover services, compare location and starting price, then send the provider a booking request inside SabiWay.
              </p>
            </div>
            <button onClick={() => setShowPublish((value) => !value)} className="min-h-11 rounded-xl bg-[#17211b] px-5 font-semibold text-white">
              {showPublish ? "Close service form" : "Offer a service"}
            </button>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-3">
            <input value={query} onChange={(event) => setQuery(event.target.value)} aria-label="Search services" placeholder="Search services or providers" className="min-h-12 rounded-xl border border-[#dde7e1] bg-white px-4 outline-none focus:border-[#008753]" />
            <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)} aria-label="Service category" className="min-h-12 rounded-xl border border-[#dde7e1] bg-white px-4 outline-none focus:border-[#008753]">
              <option value="">All categories</option>
              {categories.map((category) => <option key={category.id} value={category.slug}>{category.name}</option>)}
            </select>
            <input value={stateFilter} onChange={(event) => setStateFilter(event.target.value)} aria-label="State" placeholder="Filter by state" className="min-h-12 rounded-xl border border-[#dde7e1] bg-white px-4 outline-none focus:border-[#008753]" />
          </div>
        </section>

        {showPublish ? (
          <section className="mb-8 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5">
            <h2 className="text-xl font-bold">Publish your service</h2>
            <p className="mt-1 text-sm text-[#637067]">Available to professional profiles. SabiWay currently handles discovery and booking requests only; payment is not collected here.</p>
            <form onSubmit={publish} className="mt-5 grid gap-3 md:grid-cols-2">
              <select name="category_id" required className="min-h-12 rounded-xl border border-[#dde7e1] px-4"><option value="">Choose category</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select>
              <input name="title" required maxLength={160} placeholder="Service title" className="min-h-12 rounded-xl border border-[#dde7e1] px-4" />
              <textarea name="description" required placeholder="Describe what you offer" className="min-h-28 rounded-xl border border-[#dde7e1] p-4 md:col-span-2" />
              <input name="price_from" required type="number" min="0" step="0.01" placeholder="Starting price (NGN)" className="min-h-12 rounded-xl border border-[#dde7e1] px-4" />
              <select name="delivery_mode" defaultValue="in_person" className="min-h-12 rounded-xl border border-[#dde7e1] px-4"><option value="in_person">In person</option><option value="remote">Remote</option><option value="both">In person or remote</option></select>
              <input name="state" placeholder="State" className="min-h-12 rounded-xl border border-[#dde7e1] px-4" />
              <input name="area" placeholder="Area" className="min-h-12 rounded-xl border border-[#dde7e1] px-4" />
              <div className="md:col-span-2">
                <button disabled={publishState === "sending"} className="rounded-xl bg-[#008753] px-5 py-3 font-semibold text-white disabled:opacity-60">{publishState === "sending" ? "Publishing..." : "Publish service"}</button>
                {publishState === "sent" ? <p className="mt-2 text-sm font-medium text-[#008753]">Service published successfully.</p> : null}
                {publishError ? <p className="mt-2 text-sm text-red-700">{publishError}</p> : null}
              </div>
            </form>
          </section>
        ) : null}

        {filtered.length === 0 ? (
          <section className="rounded-3xl bg-white p-8 text-center shadow-sm ring-1 ring-black/5">
            <h2 className="text-xl font-semibold">No active services match that search.</h2>
            <p className="mt-2 text-[#637067]">Try another category or location, or return to the community.</p>
            <Link href="/community" className="mt-5 inline-flex rounded-xl border border-[#008753] px-4 py-2 font-semibold text-[#008753]">Visit SabiForum</Link>
          </section>
        ) : (
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-label="Service listings">
            {filtered.map((listing) => (
              <article key={listing.id} className="flex min-h-72 flex-col rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5">
                <div className="flex items-start justify-between gap-3">
                  <span className="rounded-full bg-[#e8f5ef] px-3 py-1 text-xs font-semibold text-[#006b42]">{listing.category.name}</span>
                  <span className="text-xs capitalize text-[#637067]">{listing.delivery_mode.replaceAll("_", " ")}</span>
                </div>
                <h2 className="mt-4 text-xl font-bold">{listing.title}</h2>
                <p className="mt-2 line-clamp-3 text-sm leading-6 text-[#637067]">{listing.description}</p>
                <div className="mt-4 text-sm"><p className="font-semibold">{listing.provider.full_name}</p><p className="text-[#637067]">{[listing.area, listing.state].filter(Boolean).join(", ") || "Location flexible"}</p></div>
                <div className="mt-auto flex items-end justify-between gap-3 pt-5">
                  <div><p className="text-xs text-[#637067]">From</p><p className="text-lg font-bold">{listing.currency} {Number(listing.price_from).toLocaleString()}</p></div>
                  <button onClick={() => { setSelected(listing); setBookingState("idle"); setBookingError(""); }} className="rounded-xl bg-[#17211b] px-4 py-2 text-sm font-semibold text-white">Request booking</button>
                </div>
              </article>
            ))}
          </section>
        )}
      </div>

      {selected ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/35 p-3 sm:items-center" role="dialog" aria-modal="true" aria-label="Booking request">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-xl">
            <h2 className="text-xl font-bold">Request {selected.title}</h2>
            <p className="mt-2 text-sm leading-6 text-[#637067]">Tell {selected.provider.full_name} what you need. They can accept or decline your request before any payment stage.</p>
            <textarea value={bookingMessage} onChange={(event) => setBookingMessage(event.target.value)} placeholder="Describe the job, timing or anything useful" className="mt-4 min-h-28 w-full rounded-xl border border-[#dde7e1] p-4 outline-none focus:border-[#008753]" />
            {bookingState === "sent" ? <p className="mt-3 text-sm font-medium text-[#008753]">Booking request sent successfully.</p> : null}
            {bookingError ? <p className="mt-3 text-sm text-red-700">{bookingError}</p> : null}
            <div className="mt-5 flex justify-end gap-3">
              <button onClick={() => setSelected(null)} className="rounded-xl border border-[#dde7e1] px-4 py-2 font-semibold">Close</button>
              {bookingState !== "sent" ? <button onClick={sendBooking} disabled={bookingState === "sending"} className="rounded-xl bg-[#008753] px-4 py-2 font-semibold text-white disabled:opacity-60">{bookingState === "sending" ? "Sending..." : "Send request"}</button> : null}
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
