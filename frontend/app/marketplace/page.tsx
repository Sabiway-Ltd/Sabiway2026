import { environment } from "@/app/config/environment";
import MarketplaceClient, { type MarketplaceCategory, type MarketplaceListing } from "./MarketplaceClient";

async function getMarketplaceData(): Promise<{ listings: MarketplaceListing[]; categories: MarketplaceCategory[] }> {
  try {
    const [listingResponse, categoryResponse] = await Promise.all([
      fetch(`${environment.djangoUrl}/api/marketplace/listings/`, { next: { revalidate: 60 } }),
      fetch(`${environment.djangoUrl}/api/marketplace/categories/`, { next: { revalidate: 300 } }),
    ]);

    const listingPayload = listingResponse.ok ? await listingResponse.json() : [];
    const categoryPayload = categoryResponse.ok ? await categoryResponse.json() : [];
    return {
      listings: Array.isArray(listingPayload) ? listingPayload : listingPayload.results ?? [],
      categories: Array.isArray(categoryPayload) ? categoryPayload : categoryPayload.results ?? [],
    };
  } catch {
    return { listings: [], categories: [] };
  }
}

export const metadata = {
  title: "Find trusted services | SabiWay",
  description: "Discover service professionals and send booking requests in the SabiWay marketplace.",
};

export default async function MarketplacePage() {
  const { listings, categories } = await getMarketplaceData();
  return <MarketplaceClient initialListings={listings} categories={categories} />;
}
