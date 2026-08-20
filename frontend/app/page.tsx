import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  BriefcaseBusiness,
  CheckCircle2,
  CircleDollarSign,
  Globe2,
  MapPin,
  MessageCircleMore,
  Search,
  ShieldCheck,
  Sparkles,
  UsersRound,
} from "lucide-react";

import { PublicShell } from "./_components/v2/PublicShell";
import { serviceCategories } from "./_components/v2/publicData";

const situations = [
  {
    eyebrow: "You need someone nearby",
    title: "Find Professionals around the place where the work will happen.",
    text: "If you are in Manchester, search Manchester. If you are in Lagos, search Lagos. Local discovery is the natural starting point.",
    icon: MapPin,
    href: "/services",
    cta: "Browse services",
  },
  {
    eyebrow: "The work is somewhere else",
    title: "Change the service location and search another city or country.",
    text: "Your account location does not lock your search. A Client in the UK can look in Nigeria, and a Client in Nigeria can search the UK when that is where the service is needed.",
    icon: Globe2,
    href: "/locations",
    cta: "Explore locations",
  },
  {
    eyebrow: "You offer a service",
    title: "Be discovered where you actually work — locally or remotely.",
    text: "Professionals can show where they serve and whether a service is in-person, remote or both, so discovery follows the work rather than nationality.",
    icon: BriefcaseBusiness,
    href: "/for-professionals",
    cta: "See the Professional journey",
  },
];

const journeySteps = [
  { title: "Choose the service location", text: "Start with where the work needs to happen, not simply where your account is registered.", icon: MapPin },
  { title: "Compare relevant Professionals", text: "Use service information, location, verification and reputation before deciding who to contact.", icon: UsersRound },
  { title: "Keep the work together", text: "Move into messaging, scope, booking and scheduling without losing the service context.", icon: MessageCircleMore },
  { title: "Pay in a supported market", text: "SabiPay keeps payment and dispute states explicit; multi-currency support is enabled market by market.", icon: ShieldCheck },
];

const trustSignals = [
  { title: "Location that means something", text: "Service location, Professional location and your account location are treated as separate information.", icon: MapPin, href: "/how-it-works" },
  { title: "Trust before commitment", text: "Profiles, verification context and reviews help replace anonymous listings with more useful signals.", icon: BadgeCheck, href: "/trust-and-safety" },
  { title: "Clearer money journeys", text: "Service price, payment currency and payout currency can be different when cross-border payments are supported.", icon: CircleDollarSign, href: "/sabipay-explained" },
];

export default function Home() {
  return (
    <PublicShell>
      <main>
        <section className="overflow-hidden bg-[#f6faf8] px-4 pb-14 pt-8 sm:px-6 sm:pt-12 lg:px-8 lg:pb-20 lg:pt-16">
          <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[1.05fr_.95fr] xl:gap-16">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full bg-[#e5f6ed] px-3 py-1.5 text-sm font-extrabold text-[#007046]"><Sparkles size={16} aria-hidden="true" /> Starting with Nigeria and the UK · Global by design</p>
              <h1 className="mt-5 max-w-4xl text-4xl font-black leading-[1.03] tracking-[-.04em] text-[#173126] sm:text-5xl lg:text-6xl">Find trusted services where you are — or wherever you need them.</h1>
              <p className="mt-6 max-w-2xl text-base leading-7 text-[#607168] sm:text-lg">SabiWay is a location-based services marketplace. Discover Professionals near the place where the work will happen, or deliberately search another city or country. Nigeria and the UK are our first priority markets, while Professionals elsewhere can still register and become discoverable where they operate.</p>

              <form action="/marketplace" method="get" className="mt-7 grid max-w-2xl gap-2 rounded-2xl border border-[#d9e6df] bg-white p-2 shadow-[0_14px_40px_rgba(22,75,49,.08)] sm:grid-cols-[1fr_.75fr_auto]" role="search">
                <label className="flex min-h-12 items-center gap-3 px-3"><Search className="shrink-0 text-[#008753]" size={20} aria-hidden="true" /><span className="sr-only">Search services</span><input name="q" className="w-full bg-transparent text-sm font-semibold text-[#173126] outline-none placeholder:font-medium placeholder:text-[#7d8b84]" placeholder="What service do you need?" /></label>
                <label className="flex min-h-12 items-center gap-3 border-t border-[#edf2ef] px-3 sm:border-l sm:border-t-0"><MapPin className="shrink-0 text-[#008753]" size={19} aria-hidden="true" /><span className="sr-only">Service location</span><input name="location" className="w-full bg-transparent text-sm font-semibold text-[#173126] outline-none placeholder:font-medium placeholder:text-[#7d8b84]" placeholder="Where is the service needed?" /></label>
                <button type="submit" className="min-h-12 rounded-xl bg-[#008753] px-5 text-sm font-black text-white hover:bg-[#007046] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#008753] focus-visible:ring-offset-2">Search</button>
              </form>

              <div className="mt-5 flex flex-wrap gap-2 text-sm"><span className="py-2 font-bold text-[#6c7a73]">Popular:</span>{serviceCategories.slice(0, 4).map((category) => <Link key={category.slug} href={`/services/${category.slug}`} className="rounded-full border border-[#d6e3dc] bg-white px-3 py-2 font-bold text-[#315044] hover:border-[#008753] hover:text-[#008753]">{category.name}</Link>)}</div>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row"><Link href="/for-clients" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#008753] px-5 font-black text-white">I need a service <ArrowRight size={18} aria-hidden="true" /></Link><Link href="/for-professionals" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-[#bfd4c8] bg-white px-5 font-black text-[#173126]">I offer services</Link></div>
            </div>

            <div className="rounded-[2rem] bg-[#008753] p-4 shadow-[0_30px_80px_rgba(0,80,50,.18)] sm:p-7">
              <div className="rounded-[1.6rem] bg-white p-5 sm:p-6">
                <p className="text-xs font-black uppercase tracking-[.14em] text-[#008753]">Location follows the work</p>
                <h2 className="mt-2 text-2xl font-black tracking-[-.02em] text-[#173126]">Your location is not the same thing as the service location.</h2>
                <div className="mt-5 grid gap-3">
                  {["UK Client → UK Professional for a nearby service", "Nigeria Client → Nigeria Professional for a nearby service", "UK Client → Nigeria Professional when the work is in Nigeria", "Nigeria Client → UK Professional when the work is in the UK", "Remote service → location can become secondary"].map((item) => <div key={item} className="flex gap-2 rounded-2xl bg-[#f4f8f6] p-3 text-sm font-bold text-[#315044]"><CheckCircle2 className="mt-0.5 shrink-0 text-[#008753]" size={18} aria-hidden="true" />{item}</div>)}
                </div>
                <Link href="/how-it-works" className="mt-5 flex min-h-14 items-center gap-3 rounded-2xl bg-[#fff7dc] p-4"><Globe2 className="shrink-0 text-[#9a7200]" aria-hidden="true" /><div><p className="font-black text-[#173126]">See how location works</p><p className="text-xs leading-5 text-[#74653b]">Account location, service location and payment market stay separate.</p></div><ArrowRight className="ml-auto shrink-0 text-[#9a7200]" size={18} aria-hidden="true" /></Link>
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-[#e3ece7] bg-white px-4 py-7 sm:px-6 lg:px-8"><div className="mx-auto grid max-w-7xl gap-5 sm:grid-cols-3"><div className="flex items-start gap-3"><MapPin className="mt-0.5 shrink-0 text-[#008753]" /><div><p className="font-black text-[#173126]">Nearby first</p><p className="mt-1 text-sm leading-5 text-[#718078]">Local discovery is the default when location is known.</p></div></div><div className="flex items-start gap-3"><Globe2 className="mt-0.5 shrink-0 text-[#008753]" /><div><p className="font-black text-[#173126]">Search elsewhere</p><p className="mt-1 text-sm leading-5 text-[#718078]">Change location whenever the work is in another place.</p></div></div><div className="flex items-start gap-3"><BadgeCheck className="mt-0.5 shrink-0 text-[#008753]" /><div><p className="font-black text-[#173126]">Trust context</p><p className="mt-1 text-sm leading-5 text-[#718078]">Compare profiles, verification and reputation before committing.</p></div></div></div></section>

        <section className="px-4 py-16 sm:px-6 lg:px-8 lg:py-20"><div className="mx-auto max-w-7xl"><div className="max-w-3xl"><p className="text-xs font-black uppercase tracking-[.17em] text-[#008753]">Start from your situation</p><h2 className="mt-3 text-3xl font-black tracking-[-.03em] text-[#173126] sm:text-4xl">The marketplace should adapt to where the work is happening.</h2></div><div className="mt-8 grid gap-5 lg:grid-cols-3">{situations.map(({ eyebrow, title, text, icon: Icon, href, cta }) => <article key={eyebrow} className="flex flex-col rounded-[2rem] border border-[#dce8e1] bg-white p-6 shadow-sm sm:p-7"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e8f7f0] text-[#008753]"><Icon size={23} aria-hidden="true" /></div><p className="mt-5 text-xs font-black uppercase tracking-[.14em] text-[#008753]">{eyebrow}</p><h3 className="mt-2 text-2xl font-black tracking-[-.025em] text-[#173126]">{title}</h3><p className="mt-3 flex-1 text-sm leading-6 text-[#68786f]">{text}</p><Link href={href} className="mt-6 inline-flex min-h-11 items-center gap-2 font-black text-[#008753]">{cta}<ArrowRight size={17} aria-hidden="true" /></Link></article>)}</div></div></section>

        <section className="bg-[#073522] px-4 py-16 text-white sm:px-6 lg:px-8 lg:py-20"><div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[.85fr_1.15fr] lg:items-center"><div><p className="text-xs font-black uppercase tracking-[.17em] text-[#8dd1b3]">Our first focus markets</p><h2 className="mt-3 text-3xl font-black tracking-[-.03em] sm:text-4xl">Nigeria and the UK first. The architecture stays global.</h2><p className="mt-4 max-w-xl leading-7 text-white/72">We are optimising discovery, operations and payment support first for Nigeria and the United Kingdom. That does not prevent a Professional in another country from registering and becoming discoverable where they operate.</p><Link href="/locations" className="mt-7 inline-flex min-h-12 items-center gap-2 rounded-xl bg-[#FFB800] px-5 font-black text-[#173126]">Explore locations <ArrowRight size={17} aria-hidden="true" /></Link></div><div className="grid gap-3 sm:grid-cols-2">{[{city:"London, UK",copy:"Find nearby Professionals for work that needs to happen in the UK."},{city:"Manchester, UK",copy:"Search by service and location instead of browsing a country-wide directory."},{city:"Lagos, Nigeria",copy:"Discover relevant local Professionals and service availability."},{city:"Anywhere else",copy:"Registered Professionals can still be discoverable where supply exists."}].map((item)=><div key={item.city} className="rounded-3xl border border-white/10 bg-white/8 p-5"><MapPin className="text-[#65d9a0]" size={20} aria-hidden="true"/><p className="mt-4 text-lg font-black">{item.city}</p><p className="mt-2 text-sm leading-6 text-white/70">{item.copy}</p></div>)}</div></div></section>

        <section className="bg-[#f4f8f6] px-4 py-16 sm:px-6 lg:px-8 lg:py-20"><div className="mx-auto max-w-7xl"><div className="max-w-3xl"><p className="text-xs font-black uppercase tracking-[.17em] text-[#008753]">How it works</p><h2 className="mt-3 text-3xl font-black tracking-[-.03em] text-[#173126] sm:text-4xl">A clearer path from location and need to completed work.</h2></div><div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">{journeySteps.map(({ title, text, icon: Icon }, index) => <article key={title} className="rounded-3xl border border-[#dce8e1] bg-white p-6 shadow-sm"><div className="flex items-center justify-between"><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#e8f7f0] text-[#008753]"><Icon size={22} aria-hidden="true" /></div><span className="text-sm font-black text-[#aebdb5]">0{index + 1}</span></div><h3 className="mt-5 text-xl font-black text-[#173126]">{title}</h3><p className="mt-2 text-sm leading-6 text-[#6b7a72]">{text}</p></article>)}</div></div></section>

        <section className="px-4 py-16 sm:px-6 lg:px-8 lg:py-20"><div className="mx-auto max-w-7xl"><div className="max-w-3xl"><p className="text-xs font-black uppercase tracking-[.17em] text-[#008753]">Trust and transactions</p><h2 className="mt-3 text-3xl font-black tracking-[-.03em] text-[#173126] sm:text-4xl">Location and currency should stay explicit throughout the journey.</h2></div><div className="mt-8 grid gap-4 md:grid-cols-3">{trustSignals.map(({ title, text, icon: Icon, href }) => <Link key={title} href={href} className="rounded-3xl border border-[#dce8e1] bg-white p-6 shadow-sm transition hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#008753] motion-reduce:transform-none"><Icon className="text-[#008753]" aria-hidden="true" /><h3 className="mt-5 text-xl font-black text-[#173126]">{title}</h3><p className="mt-2 text-sm leading-6 text-[#6b7a72]">{text}</p><span className="mt-5 inline-flex items-center gap-2 text-sm font-black text-[#008753]">Learn more <ArrowRight size={16} aria-hidden="true" /></span></Link>)}</div></div></section>

        <section className="px-4 pb-16 sm:px-6 lg:px-8 lg:pb-20"><div className="mx-auto max-w-7xl overflow-hidden rounded-[2rem] bg-[#008753] px-6 py-10 text-white sm:px-10 lg:flex lg:items-center lg:justify-between lg:gap-8 lg:px-12"><div className="max-w-2xl"><p className="text-xs font-black uppercase tracking-[.17em] text-white/75">Ready to explore?</p><h2 className="mt-2 text-3xl font-black tracking-[-.03em]">Start with what you need and where you need it.</h2><p className="mt-3 leading-7 text-white/80">Browse publicly first. Create an account when you are ready to message, post, book or transact.</p></div><div className="mt-6 flex flex-col gap-3 sm:flex-row lg:mt-0"><Link href="/services" className="inline-flex min-h-12 items-center justify-center rounded-xl bg-[#FFB800] px-5 font-black text-[#173126]">Browse services</Link><Link href="/signup" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/30 px-5 font-black text-white">Join SabiWay</Link></div></div></section>
      </main>
    </PublicShell>
  );
}
