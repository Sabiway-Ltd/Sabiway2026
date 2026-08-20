import Link from "next/link";
import { ArrowRight, BadgeCheck, BriefcaseBusiness, CheckCircle2, CircleDollarSign, Globe2, MapPin, MessageCircleMore, Search, ShieldCheck, Sparkles, Star, UsersRound } from "lucide-react";

import { PublicShell } from "./_components/v2/PublicShell";
import { serviceCategories } from "./_components/v2/publicData";

const situations = [
  { eyebrow: "Near you", title: "Find trusted help around where you are.", text: "Search by service and location, compare useful trust signals and move into a clear job journey when you are ready.", icon: MapPin, href: "/services", cta: "Browse services" },
  { eyebrow: "Somewhere else", title: "Need a service in another city or country? Change the location.", text: "Your account location does not limit where you can search. Look for a professional where the work actually needs to happen.", icon: Globe2, href: "/locations", cta: "Browse locations" },
  { eyebrow: "You offer a service", title: "Make your work discoverable where you actually operate.", text: "Professionals can publish local or remote services, build reputation and respond to relevant demand.", icon: BriefcaseBusiness, href: "/for-professionals", cta: "For professionals" },
];

const journeySteps = [
  { title: "Choose the service location", text: "Start with where the work needs to happen — not simply where your account was created.", icon: MapPin },
  { title: "Compare relevant professionals", text: "Use category, location, profile, verification and reputation to make a better choice.", icon: Search },
  { title: "Keep the job context together", text: "Move from discovery into messaging, scope, booking and scheduling without losing context.", icon: MessageCircleMore },
  { title: "Complete with clearer support", text: "Where supported, follow payment, completion, review and dispute states inside SabiWay.", icon: ShieldCheck },
];

const trustSignals = [
  { title: "Useful trust signals", text: "Profiles, verification context and reviews help reduce guesswork before you choose.", icon: BadgeCheck, href: "/verification-info" },
  { title: "Clear money journey", text: "SabiPay explains supported payment, payout and dispute states before money moves.", icon: CircleDollarSign, href: "/sabipay-explained" },
  { title: "Reputation that travels", text: "Completed work and reviews help professionals build visible credibility over time.", icon: Star, href: "/trust-and-safety" },
];

export default function Home() {
  return (
    <PublicShell>
      <main>
        <section className="overflow-hidden bg-[#f6faf8] px-4 pb-14 pt-8 sm:px-6 sm:pt-12 lg:px-8 lg:pb-20 lg:pt-16">
          <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[1.08fr_.92fr] xl:gap-16">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full bg-[#e5f6ed] px-3 py-1.5 text-sm font-extrabold text-[#007046]"><Sparkles size={16} aria-hidden="true" /> Local-first marketplace. Global by design.</p>
              <h1 className="mt-5 max-w-4xl text-4xl font-black leading-[1.03] tracking-[-.04em] text-[#173126] sm:text-5xl lg:text-6xl">Find trusted services where you are — and wherever you need them.</h1>
              <p className="mt-6 max-w-2xl text-base leading-7 text-[#607168] sm:text-lg">SabiWay connects clients and professionals by the location of the service. We are focusing first on Nigeria and the UK, while keeping the marketplace open to professionals in other countries as supply grows.</p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Link href="/services" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#008753] px-5 font-black text-white shadow-[0_12px_30px_rgba(0,135,83,.18)] transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#008753] focus-visible:ring-offset-2 motion-reduce:transform-none">Find a service <ArrowRight size={18} aria-hidden="true" /></Link>
                <Link href="/for-professionals" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-[#bfd4c8] bg-white px-5 font-black text-[#173126] hover:border-[#008753]">Offer your service</Link>
              </div>
              <div className="mt-6 flex flex-wrap gap-2 text-sm"><span className="py-2 font-bold text-[#6c7a73]">Popular services:</span>{serviceCategories.slice(0, 4).map((category) => <Link key={category.slug} href={`/services/${category.slug}`} className="rounded-full border border-[#d6e3dc] bg-white px-3 py-2 font-bold text-[#315044] hover:border-[#008753] hover:text-[#008753]">{category.name}</Link>)}</div>
            </div>

            <div className="rounded-[2rem] bg-[#008753] p-4 shadow-[0_30px_80px_rgba(0,80,50,.18)] sm:p-7">
              <div className="rounded-[1.6rem] bg-white p-5 sm:p-6">
                <p className="text-xs font-black uppercase tracking-[.14em] text-[#008753]">Location works around the job</p>
                <h2 className="mt-2 text-2xl font-black tracking-[-.02em] text-[#173126]">You can be in one country and need a service in another.</h2>
                <p className="mt-3 text-sm leading-6 text-[#68786f]">A client in Manchester can search Manchester, Lagos, New York or another location. A professional in Lagos can offer local work and remote services without pretending to be somewhere else.</p>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">{["UK user → UK professional", "Nigeria user → Nigeria professional", "UK user → service needed in Nigeria", "Remote professional → clients across markets"].map((item) => <div key={item} className="flex gap-2 rounded-2xl bg-[#f4f8f6] p-3 text-sm font-bold text-[#315044]"><CheckCircle2 className="mt-0.5 shrink-0 text-[#008753]" size={18} aria-hidden="true" />{item}</div>)}</div>
                <Link href="/how-it-works" className="mt-5 inline-flex min-h-12 items-center gap-2 font-black text-[#008753]">See how location and discovery work <ArrowRight size={17} aria-hidden="true" /></Link>
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-[#e3ece7] bg-white px-4 py-7 sm:px-6 lg:px-8"><div className="mx-auto grid max-w-7xl gap-5 sm:grid-cols-3"><div className="flex items-start gap-3"><MapPin className="mt-0.5 shrink-0 text-[#008753]" /><div><p className="font-black text-[#173126]">Relevant to where the work is</p><p className="mt-1 text-sm leading-5 text-[#718078]">Local services prioritise the service location, not nationality or account origin.</p></div></div><div className="flex items-start gap-3"><Globe2 className="mt-0.5 shrink-0 text-[#008753]" /><div><p className="font-black text-[#173126]">Search beyond your home market</p><p className="mt-1 text-sm leading-5 text-[#718078]">Change location when you need a professional somewhere else.</p></div></div><div className="flex items-start gap-3"><UsersRound className="mt-0.5 shrink-0 text-[#008753]" /><div><p className="font-black text-[#173126]">Built for both sides</p><p className="mt-1 text-sm leading-5 text-[#718078]">Clients get clearer choices; professionals get a stronger route to demand and reputation.</p></div></div></div></section>

        <section className="px-4 py-16 sm:px-6 lg:px-8 lg:py-20"><div className="mx-auto max-w-7xl"><div className="max-w-3xl"><p className="text-xs font-black uppercase tracking-[.17em] text-[#008753]">Start from your situation</p><h2 className="mt-3 text-3xl font-black tracking-[-.03em] text-[#173126] sm:text-4xl">One marketplace, different service locations.</h2><p className="mt-4 text-base leading-7 text-[#69786f]">Your account location helps personalise discovery, but you stay in control of where you search and where the work needs to happen.</p></div><div className="mt-8 grid gap-5 lg:grid-cols-3">{situations.map(({ eyebrow, title, text, icon: Icon, href, cta }) => <article key={eyebrow} className="flex flex-col rounded-[2rem] border border-[#dce8e1] bg-white p-6 shadow-sm sm:p-7"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e8f7f0] text-[#008753]"><Icon size={23} aria-hidden="true" /></div><p className="mt-5 text-xs font-black uppercase tracking-[.14em] text-[#008753]">{eyebrow}</p><h3 className="mt-2 text-2xl font-black tracking-[-.025em] text-[#173126]">{title}</h3><p className="mt-3 flex-1 text-sm leading-6 text-[#68786f]">{text}</p><Link href={href} className="mt-6 inline-flex min-h-11 items-center gap-2 font-black text-[#008753]">{cta}<ArrowRight size={17} aria-hidden="true" /></Link></article>)}</div></div></section>

        <section className="bg-[#073522] px-4 py-16 text-white sm:px-6 lg:px-8 lg:py-20"><div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[.9fr_1.1fr] lg:items-center"><div><p className="text-xs font-black uppercase tracking-[.17em] text-[#8dd1b3]">First markets: Nigeria + UK</p><h2 className="mt-3 text-3xl font-black tracking-[-.03em] sm:text-4xl">Focused rollout without building a country-locked product.</h2><p className="mt-4 max-w-xl leading-7 text-white/72">Nigeria and the UK are the first markets we are optimising for service discovery, trust and operational support. Professionals in other countries can still register and become discoverable where they operate as the marketplace expands.</p><Link href="/locations" className="mt-7 inline-flex min-h-12 items-center gap-2 rounded-xl bg-[#FFB800] px-5 font-black text-[#173126]">Explore locations <ArrowRight size={17} aria-hidden="true" /></Link></div><div className="grid gap-3 sm:grid-cols-2">{[{city:"London",copy:"Find professionals around London or change the location for work elsewhere."},{city:"Manchester",copy:"Search locally for in-person services or discover remote professionals."},{city:"Lagos",copy:"Find nearby services or search another city when the job is elsewhere."},{city:"Abuja",copy:"Professionals can serve local areas and also offer remote work where appropriate."}].map((item)=><div key={item.city} className="rounded-3xl border border-white/10 bg-white/8 p-5"><MapPin className="text-[#65d9a0]" size={20} aria-hidden="true"/><p className="mt-4 text-lg font-black">{item.city}</p><p className="mt-2 text-sm leading-6 text-white/70">{item.copy}</p></div>)}</div></div></section>

        <section className="bg-[#f4f8f6] px-4 py-16 sm:px-6 lg:px-8 lg:py-20"><div className="mx-auto max-w-7xl"><div className="max-w-3xl"><p className="text-xs font-black uppercase tracking-[.17em] text-[#008753]">How it works</p><h2 className="mt-3 text-3xl font-black tracking-[-.03em] text-[#173126] sm:text-4xl">A clearer path from “I need this” to “the work is complete”.</h2></div><div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">{journeySteps.map(({ title, text, icon: Icon }, index) => <article key={title} className="rounded-3xl border border-[#dce8e1] bg-white p-6 shadow-sm"><div className="flex items-center justify-between"><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#e8f7f0] text-[#008753]"><Icon size={22} aria-hidden="true" /></div><span className="text-sm font-black text-[#aebdb5]">0{index + 1}</span></div><h3 className="mt-5 text-xl font-black text-[#173126]">{title}</h3><p className="mt-2 text-sm leading-6 text-[#6b7a72]">{text}</p></article>)}</div><Link href="/how-it-works" className="mt-7 inline-flex min-h-11 items-center gap-2 font-black text-[#008753]">See the complete journey <ArrowRight size={17} aria-hidden="true" /></Link></div></section>

        <section className="px-4 py-16 sm:px-6 lg:px-8 lg:py-20"><div className="mx-auto max-w-7xl"><div className="max-w-3xl"><p className="text-xs font-black uppercase tracking-[.17em] text-[#008753]">Trust before transaction</p><h2 className="mt-3 text-3xl font-black tracking-[-.03em] text-[#173126] sm:text-4xl">Understand who you are dealing with and what SabiWay supports.</h2></div><div className="mt-8 grid gap-4 md:grid-cols-3">{trustSignals.map(({ title, text, icon: Icon, href }) => <Link key={title} href={href} className="rounded-3xl border border-[#dce8e1] bg-white p-6 shadow-sm transition hover:-translate-y-0.5 motion-reduce:transform-none"><Icon className="text-[#008753]" size={24} aria-hidden="true"/><h3 className="mt-5 text-xl font-black text-[#173126]">{title}</h3><p className="mt-2 text-sm leading-6 text-[#6b7a72]">{text}</p><span className="mt-5 inline-flex items-center gap-2 font-black text-[#008753]">Learn more <ArrowRight size={16} /></span></Link>)}</div></div></section>
      </main>
    </PublicShell>
  );
}
