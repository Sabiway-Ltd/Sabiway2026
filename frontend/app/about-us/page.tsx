import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Globe2, HeartHandshake, ShieldCheck, UsersRound } from "lucide-react";

import { PublicShell, V2ContentHero } from "../_components/v2/PublicShell";

const principles = [
  { title: "Trust first", text: "Discovery, moderation, identity and transaction controls are designed to reduce uncertainty for both clients and professionals.", icon: ShieldCheck },
  { title: "Built for both sides", text: "Clients can search or post jobs. Professionals can publish services and respond to relevant demand.", icon: HeartHandshake },
  { title: "Community matters", text: "SabiForum adds a knowledge and relationship layer around the marketplace instead of treating every interaction as a cold transaction.", icon: UsersRound },
  { title: "Nigerian by context, global by reach", text: "SabiWay is designed for Nigerians at home and across the diaspora while keeping location, currency and service context explicit.", icon: Globe2 },
];

export const metadata = {
  title: "About SabiWay",
  description: "Learn why SabiWay is building a trusted Nigerian marketplace and community across web and mobile.",
};

export default function AboutUsPage() {
  return (
    <PublicShell>
      <main className="pb-16">
        <V2ContentHero
          eyebrow="About SabiWay"
          title="We are building the trusted infrastructure behind everyday services and local opportunity."
          description="SabiWay brings service discovery, job demand, professional supply and community context into one shared experience for Nigerians at home and across the diaspora."
        />

        <section className="px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
          <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1fr_.9fr] lg:items-center">
            <div>
              <p className="text-xs font-black uppercase tracking-[.17em] text-[#008753]">Why we exist</p>
              <h2 className="mt-3 text-3xl font-black tracking-[-.025em] sm:text-4xl">Finding good help should not depend on luck, endless calls or unfiltered recommendations.</h2>
              <div className="mt-5 space-y-4 text-base leading-7 text-[#63736a]">
                <p>SabiWay is designed around a simple reality: clients need trustworthy professionals, while good professionals need credible access to demand and a way to build reputation over time.</p>
                <p>Our V2 marketplace supports both directions. People can discover services directly, or post the problem and allow relevant professionals to respond. SabiForum sits alongside that marketplace as the community layer for useful knowledge, discussion and professional visibility.</p>
                <p>The product is being built as one shared platform across responsive web and mobile, with common identity, business rules, moderation and later transaction controls.</p>
              </div>
              <div className="mt-7 flex flex-wrap gap-3"><Link href="/marketplace" className="inline-flex items-center gap-2 rounded-xl bg-[#008753] px-5 py-3 font-black text-white">Explore marketplace <ArrowRight size={18}/></Link><Link href="/community" className="rounded-xl border border-[#cddbd3] bg-white px-5 py-3 font-black">Visit SabiForum</Link></div>
            </div>
            <div className="overflow-hidden rounded-[2rem] border border-[#dce8e1] bg-white p-3 shadow-[0_20px_60px_rgba(0,80,50,.10)]"><Image src="/about-us-image.png" alt="SabiWay community and service marketplace" width={900} height={700} className="h-auto w-full rounded-[1.5rem] object-cover"/></div>
          </div>
        </section>

        <section className="bg-white px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
          <div className="mx-auto max-w-7xl">
            <div className="max-w-3xl"><p className="text-xs font-black uppercase tracking-[.17em] text-[#008753]">Our product principles</p><h2 className="mt-3 text-3xl font-black sm:text-4xl">Trust is a system, not a marketing line.</h2><p className="mt-4 leading-7 text-[#68776f]">The V2 product is being designed so trust is reinforced through the structure of the experience rather than left entirely to users to figure out themselves.</p></div>
            <div className="mt-8 grid gap-4 md:grid-cols-2">{principles.map(({title,text,icon:Icon}) => <article key={title} className="rounded-3xl border border-[#dce8e1] bg-[#fbfdfc] p-6"><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#e7f7ef] text-[#008753]"><Icon size={22}/></div><h3 className="mt-5 text-xl font-black">{title}</h3><p className="mt-2 text-sm leading-6 text-[#68776f]">{text}</p></article>)}</div>
          </div>
        </section>

        <section className="px-4 pt-14 sm:px-6 lg:px-8 lg:pt-20">
          <div className="mx-auto max-w-7xl rounded-[2rem] bg-[#073522] p-7 text-white sm:p-10 lg:p-12"><p className="text-xs font-black uppercase tracking-[.17em] text-[#8dd1b3]">Where we are going</p><div className="mt-3 grid gap-8 lg:grid-cols-[1fr_.8fr] lg:items-end"><div><h2 className="text-3xl font-black sm:text-4xl">From discovery to a complete trusted transaction journey.</h2><p className="mt-4 max-w-2xl leading-7 text-white/70">The current V2 build already covers identity, SabiForum and marketplace discovery/jobs. Messaging, booking, verification, SabiPay, reviews and dispute controls follow in the later delivery phases.</p></div><div className="lg:text-right"><Link href="/signup" className="inline-flex items-center gap-2 rounded-xl bg-[#FFB800] px-5 py-3 font-black text-[#173126]">Join SabiWay <ArrowRight size={18}/></Link></div></div></div>
        </section>
      </main>
    </PublicShell>
  );
}
