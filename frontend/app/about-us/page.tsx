import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Globe2, HeartHandshake, ShieldCheck, UsersRound } from "lucide-react";

import { PublicShell, V2ContentHero } from "../_components/v2/PublicShell";

const principles = [
  { title: "Trust before commitment", text: "Discovery, identity, moderation and transaction controls are designed to reduce uncertainty without pretending risk disappears.", icon: ShieldCheck },
  { title: "Built for both sides", text: "Clients need better ways to find and compare. Professionals need better ways to become discoverable and build reputation.", icon: HeartHandshake },
  { title: "Community matters", text: "SabiForum adds a knowledge and relationship layer so SabiWay is more than a cold transaction directory.", icon: UsersRound },
  { title: "Nigeria-first, diaspora-connected", text: "SabiWay connects people and professionals in Nigeria with Nigerians around the world while keeping service availability and location context explicit.", icon: Globe2 },
];

export const metadata = {
  title: "About SabiWay",
  description: "Learn why SabiWay is connecting Nigeria and the Nigerian diaspora around trusted services, professional opportunity and community.",
};

export default function AboutUsPage() {
  return (
    <PublicShell>
      <main className="pb-16">
        <V2ContentHero eyebrow="About SabiWay" title="We are building a stronger bridge between trusted services, professional opportunity and the Nigerian diaspora." description="SabiWay starts with Nigeria, but it is not limited by geography. It is designed for people at home, professionals building credibility and Nigerians abroad who still need trusted ways to get things done and stay connected." />

        <section className="px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
          <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1fr_.9fr] lg:items-center">
            <div>
              <p className="text-xs font-black uppercase tracking-[.17em] text-[#008753]">Why we exist</p>
              <h2 className="mt-3 text-3xl font-black tracking-[-.025em] sm:text-4xl">Too many important service decisions still start with “Do you know somebody?”</h2>
              <div className="mt-5 space-y-4 text-base leading-7 text-[#63736a]">
                <p>That works until you are in another city, another country or simply need better information than a forwarded phone number can give you.</p>
                <p>SabiWay is designed around that gap. Clients need useful context before choosing. Good professionals need credible access to demand and a way to build reputation beyond their immediate network. Nigerians abroad need a better bridge to trusted services and opportunity back home.</p>
                <p>Marketplace discovery, professional profiles, messaging, verification, SabiPay, reviews, support and SabiForum are parts of one connected service journey rather than isolated features.</p>
              </div>
              <div className="mt-7 flex flex-wrap gap-3"><Link href="/services" className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-[#008753] px-5 py-3 font-black text-white">Browse services <ArrowRight size={18}/></Link><Link href="/diaspora" className="inline-flex min-h-12 items-center rounded-xl border border-[#cddbd3] bg-white px-5 py-3 font-black">Explore the diaspora journey</Link></div>
            </div>
            <div className="overflow-hidden rounded-[2rem] border border-[#dce8e1] bg-white p-3 shadow-[0_20px_60px_rgba(0,80,50,.10)]"><Image src="/about-us-image.png" alt="SabiWay connecting services, professionals and community" width={900} height={700} className="h-auto w-full rounded-[1.5rem] object-cover"/></div>
          </div>
        </section>

        <section className="bg-white px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
          <div className="mx-auto max-w-7xl">
            <div className="max-w-3xl"><p className="text-xs font-black uppercase tracking-[.17em] text-[#008753]">Our product principles</p><h2 className="mt-3 text-3xl font-black sm:text-4xl">Trust is a system, not a slogan.</h2><p className="mt-4 leading-7 text-[#68776f]">The experience should help people understand who they are dealing with, what happens next and where support exists before they commit.</p></div>
            <div className="mt-8 grid gap-4 md:grid-cols-2">{principles.map(({title,text,icon:Icon}) => <article key={title} className="rounded-3xl border border-[#dce8e1] bg-[#fbfdfc] p-6"><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#e7f7ef] text-[#008753]"><Icon size={22}/></div><h3 className="mt-5 text-xl font-black">{title}</h3><p className="mt-2 text-sm leading-6 text-[#68776f]">{text}</p></article>)}</div>
          </div>
        </section>

        <section className="px-4 pt-14 sm:px-6 lg:px-8 lg:pt-20">
          <div className="mx-auto max-w-7xl rounded-[2rem] bg-[#073522] p-7 text-white sm:p-10 lg:p-12"><p className="text-xs font-black uppercase tracking-[.17em] text-[#8dd1b3]">What SabiWay is becoming</p><div className="mt-3 grid gap-8 lg:grid-cols-[1fr_.8fr] lg:items-end"><div><h2 className="text-3xl font-black sm:text-4xl">A connected service and community layer between Nigeria and Nigerians everywhere.</h2><p className="mt-4 max-w-2xl leading-7 text-white/70">The product brings discovery, messaging, booking, verification, payment states, reviews, support and community into one shared system while keeping public information accessible before login.</p></div><div className="lg:text-right"><Link href="/how-it-works" className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-[#FFB800] px-5 py-3 font-black text-[#173126]">See how SabiWay works <ArrowRight size={18}/></Link></div></div></div>
        </section>
      </main>
    </PublicShell>
  );
}
