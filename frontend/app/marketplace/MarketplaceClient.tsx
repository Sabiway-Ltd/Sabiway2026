"use client";

import { FormEvent, useMemo, useState } from "react";
import { BriefcaseBusiness, CheckCircle2, Clock3, MapPin, MessageCircle, Search, SlidersHorizontal, Sparkles } from "lucide-react";

import { environment } from "@/app/config/environment";

export type MarketplaceCategory = {
  id: number;
  name: string;
  slug: string;
  description: string;
  icon?: string;
  subcategories?: { id: number; name: string; slug: string }[];
};

export type MarketplaceListing = {
  id: string;
  title: string;
  description: string;
  price_from: string;
  currency: string;
  pricing_note?: string;
  delivery_mode: "in_person" | "remote" | "both";
  country?: string;
  state: string;
  city?: string;
  area: string;
  availability_text?: string;
  available_now?: boolean;
  is_featured?: boolean;
  moderation_status?: string;
  provider: { user_id?: number; full_name: string; username: string; job?: string | null; profile_picture?: string | null };
  category: MarketplaceCategory;
  subcategory?: { id: number; name: string; slug: string } | null;
};

export type MarketplaceJob = {
  id: string;
  title: string;
  description: string;
  budget_min?: string | null;
  budget_max?: string | null;
  currency: string;
  delivery_mode: "in_person" | "remote" | "both";
  country?: string;
  state?: string;
  city?: string;
  area?: string;
  needed_by?: string | null;
  response_count: number;
  client: { user_id?: number; full_name: string; username: string };
  category: MarketplaceCategory;
};

type JobResponsePayload = { id: string };
type ThreadPayload = { id: string };
type Props = { initialListings: MarketplaceListing[]; initialJobs: MarketplaceJob[]; categories: MarketplaceCategory[] };
type Tab = "services" | "jobs";

type Paginated<T> = T[] | { results?: T[] };

const inputClass = "min-h-12 w-full rounded-xl border border-[#d9e4dd] bg-white px-4 text-sm text-[#173126] outline-none transition focus:border-[#008753] focus:ring-2 focus:ring-[#008753]/10";

function unwrap<T>(payload: Paginated<T>): T[] {
  return Array.isArray(payload) ? payload : payload.results ?? [];
}

export default function MarketplaceClient({ initialListings, initialJobs, categories }: Props) {
  const [tab, setTab] = useState<Tab>("services");
  const [listings, setListings] = useState(initialListings);
  const [jobs, setJobs] = useState(initialJobs);
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [selectedListing, setSelectedListing] = useState<MarketplaceListing | null>(null);
  const [selectedJob, setSelectedJob] = useState<MarketplaceJob | null>(null);
  const [showOfferService, setShowOfferService] = useState(false);
  const [showPostJob, setShowPostJob] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [startingConversation, setStartingConversation] = useState(false);
  const [searching, setSearching] = useState(false);

  const accessToken = () => typeof window === "undefined" ? null : window.localStorage.getItem("access");
  const requireAccess = () => {
    const access = accessToken();
    if (!access) window.location.href = "/login?next=/marketplace";
    return access;
  };

  const locationListings = useMemo(() => {
    const place = location.trim().toLowerCase();
    if (!place) return listings;
    return listings.filter((item) => [item.area, item.city ?? "", item.state, item.country ?? ""].some((value) => value.toLowerCase().includes(place)));
  }, [listings, location]);

  const locationJobs = useMemo(() => {
    const place = location.trim().toLowerCase();
    if (!place) return jobs;
    return jobs.filter((item) => [item.area ?? "", item.city ?? "", item.state ?? "", item.country ?? ""].some((value) => value.toLowerCase().includes(place)));
  }, [jobs, location]);

  async function searchMarketplace(overrides?: { category?: string; query?: string }) {
    const q = (overrides?.query ?? query).trim();
    const category = overrides?.category ?? categoryFilter;
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (category) params.set("category", category);
    const suffix = params.size ? `?${params.toString()}` : "";

    setSearching(true);
    setError("");
    try {
      const [listingResponse, jobResponse] = await Promise.all([
        fetch(`${environment.djangoUrl}/api/marketplace/listings/${suffix}`, { cache: "no-store" }),
        fetch(`${environment.djangoUrl}/api/marketplace/jobs/${suffix}`, { cache: "no-store" }),
      ]);
      if (!listingResponse.ok || !jobResponse.ok) throw new Error("Marketplace search is temporarily unavailable.");
      const [listingPayload, jobPayload] = await Promise.all([listingResponse.json(), jobResponse.json()]);
      setListings(unwrap<MarketplaceListing>(listingPayload));
      setJobs(unwrap<MarketplaceJob>(jobPayload));
    } catch (searchError) {
      setError(searchError instanceof Error ? searchError.message : "Could not search the marketplace. Please try again.");
    } finally {
      setSearching(false);
    }
  }

  async function postService(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const access = requireAccess(); if (!access) return;
    const data = new FormData(event.currentTarget); setError(""); setNotice("");
    const response = await fetch(`${environment.djangoUrl}/api/marketplace/listings/`, {
      method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${access}` },
      body: JSON.stringify({ category_id: Number(data.get("category_id")), title: data.get("title"), description: data.get("description"), price_from: data.get("price_from"), pricing_note: data.get("pricing_note"), currency: "NGN", delivery_mode: data.get("delivery_mode"), country: data.get("country"), state: data.get("state"), city: data.get("city"), area: data.get("area"), availability_text: data.get("availability_text"), available_now: data.get("available_now") === "on" }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) { setError(payload.detail || payload.non_field_errors?.[0] || "Could not submit your service."); return; }
    setListings((current) => [payload as MarketplaceListing, ...current]); setNotice("Service submitted for review."); event.currentTarget.reset();
  }

  async function postJob(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const access = requireAccess(); if (!access) return;
    const data = new FormData(event.currentTarget); setError(""); setNotice("");
    const response = await fetch(`${environment.djangoUrl}/api/marketplace/jobs/`, {
      method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${access}` },
      body: JSON.stringify({ category_id: Number(data.get("category_id")), title: data.get("title"), description: data.get("description"), budget_min: data.get("budget_min") || null, budget_max: data.get("budget_max") || null, currency: "NGN", delivery_mode: data.get("delivery_mode"), country: data.get("country"), state: data.get("state"), city: data.get("city"), area: data.get("area"), needed_by: data.get("needed_by") || null }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) { setError(payload.detail || payload.non_field_errors?.[0] || "Could not post your job."); return; }
    setJobs((current) => [payload as MarketplaceJob, ...current]); setNotice("Job submitted for review."); event.currentTarget.reset();
  }

  async function startListingConversation(listing: MarketplaceListing) {
    const access = requireAccess(); if (!access) return;
    setStartingConversation(true); setError("");
    try {
      const response = await fetch(`${environment.djangoUrl}/api/marketplace/threads/`, {
        method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${access}` }, body: JSON.stringify({ listing_id: listing.id }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) { setError(payload.non_field_errors?.[0] || payload.detail || "Could not start conversation."); return; }
      window.location.href = `/messages?thread=${(payload as ThreadPayload).id}`;
    } finally { setStartingConversation(false); }
  }

  async function respondToJob(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!selectedJob) return;
    const access = requireAccess(); if (!access) return;
    const data = new FormData(event.currentTarget); setError(""); setNotice(""); setStartingConversation(true);
    try {
      const response = await fetch(`${environment.djangoUrl}/api/marketplace/job-responses/`, {
        method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${access}` }, body: JSON.stringify({ job_id: selectedJob.id, message: data.get("message"), proposed_price: data.get("proposed_price") || null, currency: "NGN" }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) { setError(payload.non_field_errors?.[0] || payload.detail || "Could not send your response."); return; }
      const responseId = (payload as JobResponsePayload).id;
      const threadResponse = await fetch(`${environment.djangoUrl}/api/marketplace/threads/`, {
        method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${access}` }, body: JSON.stringify({ job_response_id: responseId }),
      });
      const threadPayload = await threadResponse.json().catch(() => ({}));
      if (!threadResponse.ok) { setNotice("Response sent. Open Messages when the conversation is available."); setSelectedJob(null); return; }
      window.location.href = `/messages?thread=${(threadPayload as ThreadPayload).id}`;
    } finally { setStartingConversation(false); }
  }

  return (
    <main className="min-h-screen bg-[#f7faf8] text-[#173126]">
      <section className="bg-[#008753] px-4 pb-12 pt-10 text-white sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/12 px-3 py-1 text-sm font-semibold"><Sparkles size={16} aria-hidden="true"/> Nigerians helping Nigerians</p>
            <h1 className="text-4xl font-black leading-tight sm:text-5xl">Find trusted Nigerian professionals near you or anywhere.</h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-white/85">Discover services, post a job, message safely, agree scope and price, then schedule the work in one auditable journey.</p>
          </div>
          <form onSubmit={(event) => { event.preventDefault(); void searchMarketplace(); }} className="mt-8 grid gap-3 rounded-2xl bg-white p-3 shadow-xl md:grid-cols-[1fr_1fr_220px_auto]" role="search">
            <label className="relative"><span className="sr-only">Service or problem</span><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#708077]" size={18} aria-hidden="true"/><input value={query} onChange={(e) => setQuery(e.target.value)} className={`${inputClass} pl-11`} placeholder="What service or problem do you have?"/></label>
            <label className="relative"><span className="sr-only">Location</span><MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-[#708077]" size={18} aria-hidden="true"/><input value={location} onChange={(e) => setLocation(e.target.value)} className={`${inputClass} pl-11`} placeholder="City, state or country"/></label>
            <label><span className="sr-only">Category</span><select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className={inputClass}><option value="">All categories</option>{categories.map((c) => <option key={c.id} value={c.slug}>{c.name}</option>)}</select></label>
            <button type="submit" disabled={searching} className="min-h-12 rounded-xl bg-[#FFB800] px-5 font-extrabold text-[#173126] disabled:opacity-60">{searching ? "Searching…" : "Search"}</button>
          </form>
          <p className="mt-2 text-xs text-white/75">Text and category filters run on SabiWay servers. Location is currently refined on the returned result set while the shared generic-location API is finalised.</p>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="mb-10">
          <div className="mb-4 flex items-end justify-between gap-4"><div><p className="text-sm font-bold uppercase tracking-[.14em] text-[#008753]">Browse services</p><h2 className="mt-1 text-2xl font-black">Popular categories</h2></div><button onClick={() => { setCategoryFilter(""); void searchMarketplace({ category: "" }); }} className="text-sm font-bold text-[#008753]">View all</button></div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">{categories.slice(0,10).map((category) => <button key={category.id} onClick={() => { setTab("services"); setCategoryFilter(category.slug); void searchMarketplace({ category: category.slug }); }} className="rounded-2xl border border-[#dce7e1] bg-white p-4 text-left shadow-sm hover:border-[#008753]"><div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[#e8f7f0] text-[#008753]"><BriefcaseBusiness size={20} aria-hidden="true"/></div><p className="font-extrabold">{category.name}</p><p className="mt-1 line-clamp-2 text-xs leading-5 text-[#6c7a72]">{category.description}</p></button>)}</div>
        </section>

        <section>
          <div className="flex flex-col gap-4 border-b border-[#dce7e1] pb-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex rounded-xl bg-[#eaf4ef] p-1" role="tablist" aria-label="Marketplace result type"><button role="tab" aria-selected={tab === "services"} onClick={() => setTab("services")} className={`rounded-lg px-4 py-2 text-sm font-extrabold ${tab === "services" ? "bg-white text-[#008753] shadow-sm" : "text-[#53645a]"}`}>Find services</button><button role="tab" aria-selected={tab === "jobs"} onClick={() => setTab("jobs")} className={`rounded-lg px-4 py-2 text-sm font-extrabold ${tab === "jobs" ? "bg-white text-[#008753] shadow-sm" : "text-[#53645a]"}`}>Open jobs</button></div><div className="flex flex-wrap gap-2"><button onClick={() => { setShowPostJob((v) => !v); setShowOfferService(false); }} className="rounded-xl border border-[#008753] px-4 py-2 text-sm font-extrabold text-[#008753]">Post a job</button><button onClick={() => { setShowOfferService((v) => !v); setShowPostJob(false); }} className="rounded-xl bg-[#008753] px-4 py-2 text-sm font-extrabold text-white">Offer a service</button></div></div>

          {(showPostJob || showOfferService) && <div className="my-6 rounded-2xl border border-[#dce7e1] bg-white p-5 shadow-sm"><h3 className="text-xl font-black">{showPostJob ? "Tell professionals what you need" : "Create your service listing"}</h3><form onSubmit={showPostJob ? postJob : postService} className="mt-5 grid gap-3 md:grid-cols-2"><select name="category_id" required className={inputClass}><option value="">Choose category</option>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select><input name="title" required className={inputClass} placeholder={showPostJob ? "What do you need done?" : "Service title"}/><textarea name="description" required className={`${inputClass} min-h-28 py-3 md:col-span-2`} placeholder="Describe the work clearly"/>{showPostJob ? <><input name="budget_min" type="number" min="0" className={inputClass} placeholder="Minimum budget (NGN)"/><input name="budget_max" type="number" min="0" className={inputClass} placeholder="Maximum budget (NGN)"/><input name="needed_by" type="date" className={inputClass}/></> : <><input name="price_from" required type="number" min="0" className={inputClass} placeholder="Starting price (NGN)"/><input name="pricing_note" className={inputClass} placeholder="Pricing note"/><input name="availability_text" className={inputClass} placeholder="Availability"/></>}<select name="delivery_mode" defaultValue="in_person" className={inputClass}><option value="in_person">In person</option><option value="remote">Remote</option><option value="both">In person or remote</option></select><input name="country" className={inputClass} placeholder="Country"/><input name="state" className={inputClass} placeholder="State/region"/><input name="city" className={inputClass} placeholder="City"/><input name="area" className={inputClass} placeholder="Area"/>{!showPostJob && <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" name="available_now"/> Available now</label>}<div className="flex gap-3 md:col-span-2"><button className="rounded-xl bg-[#008753] px-5 py-3 font-extrabold text-white">Submit for review</button><button type="button" onClick={() => { setShowPostJob(false); setShowOfferService(false); }} className="rounded-xl border border-[#d6e0da] px-5 py-3 font-bold">Cancel</button></div></form></div>}

          {notice && <div className="my-4 flex items-center gap-2 rounded-xl bg-[#eaf8f1] p-4 text-sm font-bold text-[#006b42]" role="status"><CheckCircle2 size={18} aria-hidden="true"/>{notice}</div>}
          {error && <div className="my-4 flex items-center justify-between gap-3 rounded-xl bg-red-50 p-4 text-sm font-semibold text-red-700" role="alert"><span>{error}</span><button type="button" onClick={() => void searchMarketplace()} className="rounded-lg border border-red-200 px-3 py-2 font-bold">Retry</button></div>}

          {tab === "services" ? <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{locationListings.map((listing) => <article key={listing.id} className="overflow-hidden rounded-2xl border border-[#dde7e1] bg-white shadow-sm"><div className="h-2 bg-[#008753]"/><div className="p-5"><div className="flex items-start justify-between gap-3"><div><span className="rounded-full bg-[#fff5d6] px-3 py-1 text-xs font-bold text-[#7a5a00]">{listing.category.name}</span><h3 className="mt-3 text-xl font-black">{listing.title}</h3></div>{listing.available_now && <span className="rounded-full bg-[#e7f7ef] px-2 py-1 text-xs font-bold text-[#008753]">Available now</span>}</div><p className="mt-2 line-clamp-3 text-sm leading-6 text-[#66756d]">{listing.description}</p><div className="mt-4 border-t border-[#edf2ef] pt-4"><p className="font-extrabold">{listing.provider.full_name}</p><p className="text-sm text-[#66756d]">{listing.provider.job || "SabiWay professional"}</p><p className="mt-2 flex items-center gap-1 text-xs text-[#66756d]"><MapPin size={14} aria-hidden="true"/>{[listing.area, listing.city, listing.state, listing.country].filter(Boolean).join(", ") || "Location flexible"}</p></div><div className="mt-5 flex items-end justify-between gap-3"><div><p className="text-xs text-[#66756d]">Starting from</p><p className="text-lg font-black">{listing.currency} {Number(listing.price_from).toLocaleString()}</p></div><button onClick={() => setSelectedListing(listing)} className="rounded-xl bg-[#008753] px-4 py-2 text-sm font-extrabold text-white">View provider</button></div></div></article>)}</div> : <div className="mt-6 grid gap-4 lg:grid-cols-2">{locationJobs.map((job) => <article key={job.id} className="rounded-2xl border border-[#dde7e1] bg-white p-5 shadow-sm"><div className="flex items-start justify-between gap-3"><span className="rounded-full bg-[#eaf8f1] px-3 py-1 text-xs font-bold text-[#008753]">{job.category.name}</span><span className="text-xs font-semibold text-[#6b7a72]">{job.response_count} responses</span></div><h3 className="mt-3 text-xl font-black">{job.title}</h3><p className="mt-2 line-clamp-3 text-sm leading-6 text-[#66756d]">{job.description}</p><div className="mt-4 grid grid-cols-2 gap-3 text-sm"><div><p className="text-xs text-[#75827b]">Location</p><p className="font-bold">{[job.city, job.state, job.country].filter(Boolean).join(", ") || "Flexible"}</p></div><div><p className="text-xs text-[#75827b]">Budget</p><p className="font-bold">{job.budget_min || job.budget_max ? `${job.currency} ${Number(job.budget_min || 0).toLocaleString()} – ${Number(job.budget_max || job.budget_min || 0).toLocaleString()}` : "Open to quote"}</p></div></div><div className="mt-5 flex items-center justify-between border-t border-[#edf2ef] pt-4"><p className="text-xs text-[#66756d]">Posted by {job.client.full_name}</p><button onClick={() => setSelectedJob(job)} className="rounded-xl bg-[#FFB800] px-4 py-2 text-sm font-extrabold text-[#173126]">Respond & message</button></div></article>)}</div>}
          {((tab === "services" && locationListings.length === 0) || (tab === "jobs" && locationJobs.length === 0)) && <div className="mt-6 rounded-2xl border border-dashed border-[#bfd2c7] bg-white p-10 text-center" role="status"><SlidersHorizontal className="mx-auto text-[#008753]" aria-hidden="true"/><h3 className="mt-3 text-lg font-black">No results yet</h3><p className="mt-1 text-sm text-[#66756d]">Try another service, category or location.</p></div>}
        </section>
      </div>

      {selectedListing && <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-3 sm:items-center"><div className="w-full max-w-xl rounded-3xl bg-white p-6 shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="listing-dialog-title"><div className="flex items-start justify-between gap-4"><div><p className="text-sm font-bold text-[#008753]">{selectedListing.category.name}</p><h2 id="listing-dialog-title" className="mt-1 text-2xl font-black">{selectedListing.title}</h2></div><button onClick={() => setSelectedListing(null)} className="rounded-lg border px-3 py-2 text-sm font-bold">Close</button></div><p className="mt-4 leading-7 text-[#5d6d64]">{selectedListing.description}</p><div className="mt-5 rounded-2xl bg-[#f5f9f7] p-4"><p className="text-lg font-black">{selectedListing.provider.full_name}</p><p className="text-sm text-[#68776f]">{selectedListing.provider.job || "Professional"}</p><p className="mt-2 flex items-center gap-2 text-sm"><MapPin size={16} aria-hidden="true"/>{[selectedListing.area, selectedListing.city, selectedListing.state, selectedListing.country].filter(Boolean).join(", ") || "Location flexible"}</p>{selectedListing.availability_text && <p className="mt-2 flex items-center gap-2 text-sm"><Clock3 size={16} aria-hidden="true"/>{selectedListing.availability_text}</p>}</div><div className="mt-5 rounded-xl bg-[#eef8f3] p-3 text-sm font-semibold">Message securely first. Once scope and price are agreed, create the booking summary and schedule the work.</div><button disabled={startingConversation} onClick={() => startListingConversation(selectedListing)} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#008753] px-5 py-3 font-black text-white disabled:opacity-60"><MessageCircle size={18} aria-hidden="true"/>{startingConversation ? "Starting…" : "Message provider"}</button></div></div>}

      {selectedJob && <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-3 sm:items-center"><div className="w-full max-w-xl rounded-3xl bg-white p-6 shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="job-dialog-title"><div className="flex items-start justify-between gap-4"><div><p className="text-sm font-bold text-[#008753]">Professional response</p><h2 id="job-dialog-title" className="mt-1 text-2xl font-black">{selectedJob.title}</h2></div><button onClick={() => setSelectedJob(null)} className="rounded-lg border px-3 py-2 text-sm font-bold">Close</button></div><form onSubmit={respondToJob} className="mt-5 space-y-3"><textarea name="message" required className={`${inputClass} min-h-32 py-3`} placeholder="Explain how you can help, relevant experience and availability"/><input name="proposed_price" type="number" min="0" className={inputClass} placeholder="Proposed price (NGN, optional)"/><button disabled={startingConversation} className="w-full rounded-xl bg-[#008753] px-5 py-3 font-extrabold text-white disabled:opacity-60">{startingConversation ? "Starting conversation…" : "Send response & start conversation"}</button></form></div></div>}
    </main>
  );
}
