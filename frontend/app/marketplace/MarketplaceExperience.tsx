"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BriefcaseBusiness, CheckCircle2, Clock3, MapPin, Search, ShieldCheck } from "lucide-react";

import Button from "@/app/_components/common/Button";
import { Field, InlineAlert, SelectField, StatePanel, StatusBadge, Surface, TextareaField } from "@/app/_components/common/DesignPrimitives";
import { environment } from "@/app/config/environment";
import { useAuthStore } from "@/app/store/useAuthStore";
import ServiceContactButton from "@/app/profile/[username]/ServiceContactButton";

export type MarketplaceCategory = {
  id: number;
  name: string;
  slug: string;
  description?: string;
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
  state?: string;
  city?: string;
  area?: string;
  availability_text?: string;
  available_now?: boolean;
  provider: {
    user_id?: number;
    full_name: string;
    username: string;
    job?: string | null;
    is_verified?: boolean;
    verification_status?: string;
  };
  category?: MarketplaceCategory;
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
  client: { full_name: string; username: string };
  category?: MarketplaceCategory;
};

type Availability = { listings: boolean; jobs: boolean; categories: boolean };
type Paginated<T> = T[] | { results?: T[] };

type Props = {
  initialListings: MarketplaceListing[];
  initialJobs: MarketplaceJob[];
  categories: MarketplaceCategory[];
  availability: Availability;
  initialQuery?: string;
  initialLocation?: string;
  initialCategory?: string;
};

function unwrap<T>(payload: Paginated<T>): T[] {
  return Array.isArray(payload) ? payload : payload.results ?? [];
}

function buildSearch(q: string, location: string, category: string) {
  const params = new URLSearchParams();
  if (q.trim()) params.set("q", q.trim());
  if (location.trim()) params.set("location", location.trim());
  if (category) params.set("category", category);
  return params;
}

function deliveryLabel(mode: "in_person" | "remote" | "both") {
  if (mode === "remote") return "Remote";
  if (mode === "both") return "In person or remote";
  return "In person";
}

function serviceLocation(listing: MarketplaceListing) {
  if (listing.delivery_mode === "remote") return "Remote";
  return [listing.area, listing.city, listing.state, listing.country].filter(Boolean).join(", ") || "Location confirmed in conversation";
}

function jobLocation(job: MarketplaceJob) {
  if (job.delivery_mode === "remote") return "Remote";
  return [job.area, job.city, job.state, job.country].filter(Boolean).join(", ") || "Location confirmed by Client";
}

function budgetLabel(job: MarketplaceJob) {
  if (job.budget_min && job.budget_max) return `${job.currency} ${Number(job.budget_min).toLocaleString("en-GB")}–${Number(job.budget_max).toLocaleString("en-GB")}`;
  if (job.budget_max) return `Up to ${job.currency} ${Number(job.budget_max).toLocaleString("en-GB")}`;
  if (job.budget_min) return `From ${job.currency} ${Number(job.budget_min).toLocaleString("en-GB")}`;
  return "Budget to discuss";
}

export default function MarketplaceExperience({
  initialListings,
  initialJobs,
  categories,
  availability,
  initialQuery = "",
  initialLocation = "",
  initialCategory = "",
}: Props) {
  const router = useRouter();
  const role = useAuthStore((state) => state.user?.role);
  const access = useAuthStore((state) => state.access);
  const professionalMode = role === "professional";

  const [listings, setListings] = useState(initialListings);
  const [jobs, setJobs] = useState(initialJobs);
  const [query, setQuery] = useState(initialQuery);
  const [location, setLocation] = useState(initialLocation);
  const [category, setCategory] = useState(initialCategory);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [selectedJob, setSelectedJob] = useState<MarketplaceJob | null>(null);
  const [sendingProposal, setSendingProposal] = useState(false);
  const [proposalNotice, setProposalNotice] = useState("");
  const [proposalError, setProposalError] = useState("");

  const initialUnavailable = professionalMode ? !availability.jobs : !availability.listings;
  const activeResults = professionalMode ? jobs.length : listings.length;

  const resultDescription = useMemo(() => {
    if (searching) return "Updating results…";
    if (professionalMode) return `${jobs.length} open ${jobs.length === 1 ? "opportunity" : "opportunities"}`;
    return `${listings.length} approved ${listings.length === 1 ? "service" : "services"}`;
  }, [jobs.length, listings.length, professionalMode, searching]);

  async function runSearch(event?: FormEvent) {
    event?.preventDefault();
    const params = buildSearch(query, location, category);
    setSearching(true);
    setSearchError("");
    try {
      const endpoint = professionalMode ? "jobs" : "listings";
      const response = await fetch(`${environment.djangoUrl}/api/marketplace/${endpoint}/${params.size ? `?${params.toString()}` : ""}`, { cache: "no-store" });
      if (!response.ok) throw new Error("Marketplace search is temporarily unavailable.");
      const payload = await response.json();
      if (professionalMode) setJobs(unwrap<MarketplaceJob>(payload));
      else setListings(unwrap<MarketplaceListing>(payload));
      router.replace(`/marketplace${params.size ? `?${params.toString()}` : ""}`, { scroll: false });
    } catch (caught) {
      setSearchError(caught instanceof Error ? caught.message : "Could not update marketplace results.");
    } finally {
      setSearching(false);
    }
  }

  async function sendProposal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedJob || !access || role !== "professional") return;
    const data = new FormData(event.currentTarget);
    setSendingProposal(true);
    setProposalError("");
    setProposalNotice("");
    try {
      const response = await fetch(`${environment.djangoUrl}/api/marketplace/job-responses/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${access}` },
        body: JSON.stringify({
          job_id: selectedJob.id,
          message: data.get("message"),
          proposed_price: data.get("proposed_price") || null,
          currency: selectedJob.currency,
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.non_field_errors?.[0] || payload.detail || "Could not send proposal.");
      setProposalNotice("Proposal sent. Track the Client decision from Proposals.");
      setSelectedJob(null);
    } catch (caught) {
      setProposalError(caught instanceof Error ? caught.message : "Could not send proposal.");
    } finally {
      setSendingProposal(false);
    }
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="bg-primary px-4 py-10 text-primary-foreground sm:px-6 lg:px-8 lg:py-14">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs font-black uppercase tracking-[.18em] text-white/75">{professionalMode ? "Professional opportunities" : "SabiWay marketplace"}</p>
          <h1 className="mt-3 max-w-4xl text-4xl font-black leading-[1.05] tracking-[-.035em] sm:text-5xl">
            {professionalMode ? "Find work that fits your services." : "Find the right Professional for the work."}
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-white/85">
            {professionalMode
              ? "Search open Client needs by service and location. Proposals stay separate from messages, bookings and payment state."
              : "Browse approved services without signing in. Compare service scope, price, delivery, location and visible trust evidence before you start a conversation."}
          </p>

          <form onSubmit={runSearch} role="search" className="mt-7 grid gap-3 rounded-[var(--sabi-radius-xl)] bg-card p-4 text-foreground shadow-[var(--sabi-shadow-lg)] lg:grid-cols-[1.2fr_1fr_240px_auto] lg:items-end">
            <Field label={professionalMode ? "What work are you looking for?" : "What service do you need?"} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={professionalMode ? "e.g. dashboard, plumbing, tutoring" : "e.g. electrician, data analyst, cleaner"} />
            <Field label="Service location" value={location} onChange={(event) => setLocation(event.target.value)} placeholder="City, region or country" />
            <SelectField label="Category" value={category} onChange={(event) => setCategory(event.target.value)}>
              <option value="">All categories</option>
              {categories.map((item) => <option key={item.id} value={item.slug}>{item.name}</option>)}
            </SelectField>
            <Button type="submit" variant="primary" size="lg" loading={searching} loadingLabel="Searching…" leadingIcon={<Search size={18} />} className="w-full lg:w-auto">Search</Button>
          </form>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {!availability.categories ? <InlineAlert tone="warning">Categories are temporarily unavailable. Keyword and location search can still be used.</InlineAlert> : null}
        {initialUnavailable && !searchError ? <InlineAlert tone="warning" className="mt-3">Live marketplace results were unavailable when this page loaded. Search again to retry.</InlineAlert> : null}
        {searchError ? <InlineAlert tone="error" className="mt-3">{searchError}</InlineAlert> : null}
        {proposalNotice ? <InlineAlert tone="success" className="mt-3">{proposalNotice}</InlineAlert> : null}
        {proposalError ? <InlineAlert tone="error" className="mt-3">{proposalError}</InlineAlert> : null}

        <div className="mt-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[.14em] text-primary">{professionalMode ? "Open Client needs" : "Approved services"}</p>
            <h2 className="mt-1 text-2xl font-black">{professionalMode ? "Opportunities" : "Service results"}</h2>
          </div>
          <p className="text-sm font-semibold text-muted-foreground" aria-live="polite">{resultDescription}</p>
        </div>

        {!searching && !searchError && !initialUnavailable && activeResults === 0 ? (
          <StatePanel
            className="mt-5"
            title={professionalMode ? "No open opportunities match these filters" : "No approved services match these filters"}
            description={professionalMode ? "Try a broader service term or location. A genuine empty result is different from marketplace unavailability." : "Try a nearby location, broader category or fewer search terms. You can browse publicly without creating an account."}
          />
        ) : null}

        {professionalMode ? (
          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            {jobs.map((job) => (
              <Surface key={job.id} className="flex h-full flex-col p-5 sm:p-6">
                <div className="flex flex-wrap items-center gap-2">{job.category?.name ? <StatusBadge>{job.category.name}</StatusBadge> : null}<StatusBadge tone="info">{deliveryLabel(job.delivery_mode)}</StatusBadge></div>
                <h3 className="mt-3 text-xl font-black">{job.title}</h3>
                <p className="mt-2 line-clamp-3 text-sm leading-6 text-muted-foreground">{job.description}</p>
                <div className="mt-4 grid gap-2 text-sm font-semibold text-muted-foreground">
                  <p className="inline-flex items-start gap-2"><MapPin size={16} className="mt-0.5 shrink-0 text-primary" aria-hidden="true" /> {jobLocation(job)}</p>
                  <p className="inline-flex items-center gap-2"><BriefcaseBusiness size={16} className="text-primary" aria-hidden="true" /> {budgetLabel(job)}</p>
                  {job.needed_by ? <p className="inline-flex items-center gap-2"><Clock3 size={16} className="text-primary" aria-hidden="true" /> Needed by {new Date(job.needed_by).toLocaleDateString("en-GB", { dateStyle: "medium" })}</p> : null}
                </div>
                <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-5"><p className="text-xs font-bold text-muted-foreground">{job.response_count} {job.response_count === 1 ? "response" : "responses"}</p><Button variant="primary" onClick={() => setSelectedJob(job)}>Send proposal</Button></div>
              </Surface>
            ))}
          </div>
        ) : (
          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            {listings.map((listing) => {
              const cleanUsername = listing.provider.username.replace(/^@/, "");
              const profilePath = `/profile/${encodeURIComponent(cleanUsername)}`;
              return (
                <Surface key={listing.id} className="flex h-full flex-col p-5 sm:p-6">
                  <div className="flex flex-wrap items-center gap-2">
                    {listing.category?.name ? <StatusBadge>{listing.category.name}</StatusBadge> : null}
                    {listing.provider.is_verified ? <StatusBadge tone="success"><ShieldCheck size={13} className="mr-1" aria-hidden="true" /> Verified identity</StatusBadge> : null}
                    {listing.available_now ? <StatusBadge tone="success"><CheckCircle2 size={13} className="mr-1" aria-hidden="true" /> Available now</StatusBadge> : null}
                  </div>
                  <h3 className="mt-3 text-xl font-black">{listing.title}</h3>
                  <Link href={profilePath} className="mt-1 inline-flex min-h-10 items-center text-sm font-black text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">{listing.provider.full_name}{listing.provider.job ? ` · ${listing.provider.job}` : ""}</Link>
                  <p className="mt-2 line-clamp-3 text-sm leading-6 text-muted-foreground">{listing.description}</p>
                  <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                    <div><dt className="text-xs font-black uppercase tracking-wide text-muted-foreground">From</dt><dd className="mt-1 text-lg font-black">{listing.currency} {Number(listing.price_from).toLocaleString("en-GB")}</dd></div>
                    <div><dt className="text-xs font-black uppercase tracking-wide text-muted-foreground">Delivery</dt><dd className="mt-1 font-bold">{deliveryLabel(listing.delivery_mode)}</dd></div>
                    <div className="sm:col-span-2"><dt className="text-xs font-black uppercase tracking-wide text-muted-foreground">Service location</dt><dd className="mt-1 inline-flex items-start gap-2 font-bold"><MapPin size={16} className="mt-0.5 shrink-0 text-primary" aria-hidden="true" /> {serviceLocation(listing)}</dd></div>
                  </dl>
                  <div className="mt-auto flex flex-wrap gap-3 pt-5"><Link href={profilePath} className="inline-flex min-h-11 items-center justify-center rounded-[var(--sabi-radius-md)] border border-border px-4 text-sm font-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">View Professional profile</Link><ServiceContactButton listingId={listing.id} profilePath={profilePath} /></div>
                </Surface>
              );
            })}
          </div>
        )}
      </div>

      {selectedJob ? (
        <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/45 p-4 sm:items-center" role="presentation" onMouseDown={(event) => { if (event.currentTarget === event.target) setSelectedJob(null); }}>
          <Surface role="dialog" aria-modal="true" aria-labelledby="proposal-heading" className="max-h-[90vh] w-full max-w-xl overflow-y-auto p-5 sm:p-6">
            <p className="text-xs font-black uppercase tracking-[.12em] text-primary">Professional proposal</p>
            <h2 id="proposal-heading" className="mt-1 text-2xl font-black">{selectedJob.title}</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">Your proposal is a work offer. Messaging, booking and payment remain separate states after the Client responds.</p>
            <form onSubmit={sendProposal} className="mt-5 grid gap-4">
              <TextareaField name="message" label="Proposal message" required minLength={20} hint="Explain your approach, availability and any scope assumptions. Do not share off-platform contact details before booking." />
              <Field name="proposed_price" type="number" min="0" step="0.01" label={`Proposed price (${selectedJob.currency})`} hint="Optional. The final agreed booking amount may differ." />
              <div className="flex flex-wrap justify-end gap-2"><Button type="button" variant="secondary" onClick={() => setSelectedJob(null)}>Cancel</Button><Button type="submit" variant="primary" loading={sendingProposal} loadingLabel="Sending…">Send proposal</Button></div>
            </form>
          </Surface>
        </div>
      ) : null}
    </main>
  );
}
