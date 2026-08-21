import { environment } from "@/app/config/environment";
import MarketplaceDefaultLocation from "./MarketplaceDefaultLocation";
import MarketplaceExperience, { type MarketplaceCategory, type MarketplaceJob, type MarketplaceListing } from "./MarketplaceExperience";
import { MarketplaceShell } from "./MarketplaceShell";

type Availability = { listings: boolean; jobs: boolean; categories: boolean };
type MarketplaceData = {
  listings: MarketplaceListing[];
  jobs: MarketplaceJob[];
  categories: MarketplaceCategory[];
  availability: Availability;
};

function unwrap<T>(payload: T[] | { results?: T[] }): T[] {
  return Array.isArray(payload) ? payload : payload.results ?? [];
}

async function readCollection<T>(response: Response): Promise<{ values: T[]; available: boolean }> {
  if (!response.ok) return { values: [], available: false };
  try {
    return { values: unwrap<T>(await response.json()), available: true };
  } catch {
    return { values: [], available: false };
  }
}

async function getMarketplaceData(params: { q?: string; location?: string; category?: string }): Promise<MarketplaceData> {
  const query = new URLSearchParams();
  if (params.q) query.set("q", params.q);
  if (params.location) query.set("location", params.location);
  if (params.category) query.set("category", params.category);
  const suffix = query.size ? `?${query.toString()}` : "";

  try {
    const settled = await Promise.allSettled([
      fetch(`${environment.djangoUrl}/api/marketplace/listings/${suffix}`, { next: { revalidate: 60 } }),
      fetch(`${environment.djangoUrl}/api/marketplace/jobs/${suffix}`, { next: { revalidate: 30 } }),
      fetch(`${environment.djangoUrl}/api/marketplace/categories/`, { next: { revalidate: 300 } }),
    ]);

    const listingResult = settled[0].status === "fulfilled" ? await readCollection<MarketplaceListing>(settled[0].value) : { values: [], available: false };
    const jobResult = settled[1].status === "fulfilled" ? await readCollection<MarketplaceJob>(settled[1].value) : { values: [], available: false };
    const categoryResult = settled[2].status === "fulfilled" ? await readCollection<MarketplaceCategory>(settled[2].value) : { values: [], available: false };

    return {
      listings: listingResult.values,
      jobs: jobResult.values,
      categories: categoryResult.values,
      availability: {
        listings: listingResult.available,
        jobs: jobResult.available,
        categories: categoryResult.available,
      },
    };
  } catch {
    return {
      listings: [],
      jobs: [],
      categories: [],
      availability: { listings: false, jobs: false, categories: false },
    };
  }
}

export const metadata = {
  title: "SabiWay Marketplace | Find trusted Professionals by location",
  description: "Browse approved services publicly by service and location, compare Professional trust context, or discover relevant Client opportunities from a Professional account.",
};

export default async function MarketplacePage({ searchParams }: { searchParams: Promise<{ q?: string; location?: string; category?: string }> }) {
  const params = await searchParams;
  const { listings, jobs, categories, availability } = await getMarketplaceData(params);

  return (
    <MarketplaceShell>
      <MarketplaceDefaultLocation hasExplicitLocation={Boolean(params.location)} />
      <MarketplaceExperience
        initialListings={listings}
        initialJobs={jobs}
        categories={categories}
        availability={availability}
        initialQuery={params.q}
        initialLocation={params.location}
        initialCategory={params.category}
      />
    </MarketplaceShell>
  );
}
