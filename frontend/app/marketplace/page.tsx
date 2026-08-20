import { environment } from "@/app/config/environment";
import MarketplaceClient, { type MarketplaceCategory, type MarketplaceJob, type MarketplaceListing } from "./MarketplaceClient";
import { MarketplaceShell } from "./MarketplaceShell";

async function getMarketplaceData(): Promise<{ listings: MarketplaceListing[]; jobs: MarketplaceJob[]; categories: MarketplaceCategory[] }> {
  try {
    const [listingResponse, jobResponse, categoryResponse] = await Promise.all([
      fetch(`${environment.djangoUrl}/api/marketplace/listings/`, { next: { revalidate: 60 } }),
      fetch(`${environment.djangoUrl}/api/marketplace/jobs/`, { next: { revalidate: 30 } }),
      fetch(`${environment.djangoUrl}/api/marketplace/categories/`, { next: { revalidate: 300 } }),
    ]);

    const listingPayload = listingResponse.ok ? await listingResponse.json() : [];
    const jobPayload = jobResponse.ok ? await jobResponse.json() : [];
    const categoryPayload = categoryResponse.ok ? await categoryResponse.json() : [];
    return {
      listings: Array.isArray(listingPayload) ? listingPayload : listingPayload.results ?? [],
      jobs: Array.isArray(jobPayload) ? jobPayload : jobPayload.results ?? [],
      categories: Array.isArray(categoryPayload) ? categoryPayload : categoryPayload.results ?? [],
    };
  } catch {
    return { listings: [], jobs: [], categories: [] };
  }
}

export const metadata = {
  title: "SabiWay Marketplace | Find trusted Professionals by location",
  description: "Search services by where the work needs to happen, discover relevant Professionals or post a job for a specific service location.",
};

export default async function MarketplacePage({ searchParams }: { searchParams: Promise<{ q?: string; location?: string; category?: string }> }) {
  const [{ listings, jobs, categories }, params] = await Promise.all([getMarketplaceData(), searchParams]);
  return (
    <MarketplaceShell>
      <MarketplaceClient
        initialListings={listings}
        initialJobs={jobs}
        categories={categories}
        initialQuery={params.q || ""}
        initialLocation={params.location || ""}
        initialCategory={params.category || ""}
      />
    </MarketplaceShell>
  );
}
