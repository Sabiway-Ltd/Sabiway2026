import Link from "next/link";

import { environment } from "@/app/config/environment";

type Listing = {
  id: string;
  title: string;
  description: string;
  price_from: string;
  currency: string;
  delivery_mode: "in_person" | "remote" | "both";
  state: string;
  area: string;
  provider: { full_name: string; username: string; job?: string | null };
  category: { name: string; slug: string };
};

async function getListings(): Promise<Listing[]> {
  try {
    const response = await fetch(`${environment.djangoUrl}/api/marketplace/listings/`, {
      next: { revalidate: 60 },
    });
    if (!response.ok) return [];
    const payload = await response.json();
    return Array.isArray(payload) ? payload : payload.results ?? [];
  } catch {
    return [];
  }
}

export const metadata = {
  title: "Find trusted services | SabiWay",
  description: "Discover service professionals in the SabiWay marketplace.",
};

export default async function MarketplacePage() {
  const listings = await getListings();

  return (
    <main className="min-h-screen bg-[#f7faf8] px-4 py-8 text-[#17211b] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5 sm:p-8">
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.18em] text-[#008753]">SabiWay Marketplace</p>
          <h1 className="max-w-3xl text-3xl font-bold sm:text-4xl">Find trusted professionals for the work you need done.</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#637067] sm:text-base">
            Browse active service listings by category, location and delivery mode. Booking requests are handled inside SabiWay; payments are not part of this phase yet.
          </p>
          <form className="mt-6 grid gap-3 sm:grid-cols-[1fr_180px_auto]" action="/marketplace">
            <input
              name="q"
              aria-label="Search services"
              placeholder="Search electricians, tutors, tailors..."
              className="min-h-12 rounded-xl border border-[#dde7e1] bg-white px-4 outline-none focus:border-[#008753]"
            />
            <input
              name="state"
              aria-label="State"
              placeholder="State"
              className="min-h-12 rounded-xl border border-[#dde7e1] bg-white px-4 outline-none focus:border-[#008753]"
            />
            <button className="min-h-12 rounded-xl bg-[#008753] px-5 font-semibold text-white hover:bg-[#006b42]">Search</button>
          </form>
        </div>

        {listings.length === 0 ? (
          <section className="rounded-3xl bg-white p-8 text-center shadow-sm ring-1 ring-black/5">
            <h2 className="text-xl font-semibold">Marketplace listings are being prepared.</h2>
            <p className="mt-2 text-[#637067]">When professionals publish active services, they will appear here.</p>
            <Link href="/community" className="mt-5 inline-flex rounded-xl border border-[#008753] px-4 py-2 font-semibold text-[#008753]">
              Visit SabiForum
            </Link>
          </section>
        ) : (
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-label="Service listings">
            {listings.map((listing) => (
              <article key={listing.id} className="flex min-h-72 flex-col rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5">
                <div className="flex items-start justify-between gap-3">
                  <span className="rounded-full bg-[#e8f5ef] px-3 py-1 text-xs font-semibold text-[#006b42]">{listing.category.name}</span>
                  <span className="text-xs text-[#637067]">{listing.delivery_mode.replaceAll("_", " ")}</span>
                </div>
                <h2 className="mt-4 text-xl font-bold">{listing.title}</h2>
                <p className="mt-2 line-clamp-3 text-sm leading-6 text-[#637067]">{listing.description}</p>
                <div className="mt-4 text-sm">
                  <p className="font-semibold">{listing.provider.full_name}</p>
                  <p className="text-[#637067]">{[listing.area, listing.state].filter(Boolean).join(", ") || "Location flexible"}</p>
                </div>
                <div className="mt-auto flex items-end justify-between gap-3 pt-5">
                  <div>
                    <p className="text-xs text-[#637067]">From</p>
                    <p className="text-lg font-bold">{listing.currency} {Number(listing.price_from).toLocaleString()}</p>
                  </div>
                  <span className="rounded-xl bg-[#17211b] px-4 py-2 text-sm font-semibold text-white">View service</span>
                </div>
              </article>
            ))}
          </section>
        )}
      </div>
    </main>
  );
}
