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
  title: "SabiWay Marketplace | Find trusted Nigerian professionals",
  description: "Search services, discover trusted Nigerian professionals by location, or post a job and receive professional responses.",
};

export default async function MarketplacePage() {
  const { listings, jobs, categories } = await getMarketplaceData();
  return (
    <MarketplaceShell>
      <MarketplaceClient initialListings={listings} initialJobs={jobs} categories={categories} />
    </MarketplaceShell>
  );
}
