import Link from "next/link";
import { ArrowRight, MapPin } from "lucide-react";

import { PublicShell, V2ContentHero } from "../_components/v2/PublicShell";
import { locations } from "../_components/v2/publicData";

export const metadata = {
  title: "Service locations | SabiWay",
  description: "Explore SabiWay service discovery and professional opportunities by location.",
};

export default function Page() {
  return (
    <PublicShell>
      <main className="pb-16">
        <V2ContentHero eyebrow="Locations" title="Start with where the work is." description="Explore major SabiWay locations, then continue into the marketplace to search by service, skill and area." />
        <section className="px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-7xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {locations.map((location) => (
              <Link key={location.slug} href={`/locations/${location.slug}`} className="group rounded-3xl border border-border bg-card p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary motion-reduce:transform-none">
                <MapPin className="text-primary" aria-hidden="true" />
                <h2 className="mt-5 text-xl font-black">{location.name}</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{location.description}</p>
                <span className="mt-5 inline-flex items-center gap-2 text-sm font-black text-primary">Explore {location.name}<ArrowRight size={16} aria-hidden="true" /></span>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </PublicShell>
  );
}
