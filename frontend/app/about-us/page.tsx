import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Globe2, HeartHandshake, MapPin, ShieldCheck, UsersRound } from "lucide-react";

import { PublicShell, V2ContentHero } from "../_components/v2/PublicShell";

const principles = [
  { title: "Location first", text: "Discovery should reflect where a service is needed. Users can search near themselves or deliberately switch to another location.", icon: MapPin },
  { title: "Trust first", text: "Identity, moderation, verification, reputation and transaction controls are designed to reduce uncertainty for both sides.", icon: ShieldCheck },
  { title: "Built for both sides", text: "Clients can search or post jobs. Professionals can publish services, define where they operate and respond to relevant demand.", icon: HeartHandshake },
  { title: "Global by design", text: "Nigeria and the UK are the first priority markets, but the marketplace architecture is not country-locked. Other countries can grow as professionals and demand appear.", icon: Globe2 },
  { title: "Community matters", text: "SabiForum adds a knowledge and relationship layer around the marketplace instead of treating every interaction as a cold transaction.", icon: UsersRound },
];

export const metadata = { title: "About SabiWay", description: "Learn why SabiWay is building a location-based global services marketplace, starting with Nigeria and the UK." };

export default function AboutUsPage() {
  return (
    <PublicShell>
      <main className="pb-16">
        <V2ContentHero eyebrow="About SabiWay" title="We are building a better way to find trusted services where the work actually needs to happen." description="SabiWay connects clients and professionals through location, service context, trust and community. Nigeria and the UK are our first priority markets, while the product remains global by design." />
        <section className="px-4 py-14 sm:px-6 lg:px-8 lg:py-20"><div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1fr_.9fr] lg:items-center"><div><p className="text-xs font-black uppercase tracking-[.17em] text-[#008753]">Why we exist</p><h2 className="mt-3 text-3xl font-black tracking-[-.025em] sm:text-4xl">Finding good help should not depend on luck, endless calls or unfiltered recommendations.</h2><div className="mt-5 space-y-4 text-base leading-7 text-[#63736a]"><p>Clients need trustworthy professionals near the place where work is needed. Good professionals need credible access to demand and a way to build reputation over time.</p><p>SabiWay supports both directions: people can discover services directly or post the problem and allow relevant professionals to respond. A user can search their own location or intentionally choose another city or country.</p><p>Local and remote work are treated differently. Physical services depend on service areas and proximity; remote services can be discovered across markets when location is not a delivery constraint.</p></div><div className="mt-7 flex flex-wrap gap-3"><Link href="/services" className="inline-flex items-center gap-2 rounded-xl bg-[#008753] px-5 py-3 font-black text-white">Explore services <ArrowRight size={18}/></Link><Link href="/how-it-works" className="rounded-xl border border-[#cddbd3] bg-white px-5 py-3 font-black">How SabiWay works</Link></div></div><div className="overflow-hidden rounded-[2rem] border border-[#dce8e1] bg-white p-3 shadow-[0_20px_60px_rgba(0,80,50,.10)]"><Image src="/about-us-image.png" alt="SabiWay community and service marketplace" width={900} height={700} className="h-auto w-full rounded-[1.5rem] object-cover"/></div></div></section>
        <section className="bg-white px-4 py-14 sm:px-6 lg:px-8 lg:py-20"><div className="mx-auto max-w-7xl"><div className="max-w-3xl"><p className="text-xs font-black uppercase tracking-[.17em] text-[#008753]">Our product principles</p><h2 className="mt-3 text-3xl font-black sm:text-4xl">Local relevance without building a country-locked platform.</h2></div><div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{principles.map(({title,text,icon:Icon}) => <article key={title} className="rounded-3xl border border-[#dce8e1] bg-[#fbfdfc] p-6"><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#e7f7ef] text-[#008753]"><Icon size={22}/></div><h3 className="mt-5 text-xl font-black">{title}</h3><p className="mt-2 text-sm leading-6 text-[#68776f]">{text}</p></article>)}</div></div></section>
      </main>
    </PublicShell>
  );
}
