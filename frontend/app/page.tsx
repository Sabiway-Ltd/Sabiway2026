import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  BriefcaseBusiness,
  CheckCircle2,
  CircleDollarSign,
  MapPin,
  MessageCircleMore,
  Search,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Star,
  UsersRound,
} from "lucide-react";

import { PublicShell } from "./_components/v2/PublicShell";
import { locations, serviceCategories } from "./_components/v2/publicData";

const journeySteps = [
  { title: "Tell us what you need", text: "Browse a service category, search the marketplace or post a job with the right context.", icon: Search },
  { title: "Compare before you choose", text: "Review professional profiles, verification context, location, service information and reputation.", icon: UsersRound },
  { title: "Agree and keep the work together", text: "Use messaging, booking, scheduling and the shared job context instead of scattered chats.", icon: MessageCircleMore },
  { title: "Pay and complete with clearer protection", text: "Where SabiPay applies, track payment and completion status and raise support or disputes when needed.", icon: ShieldCheck },
];

const trustSignals = [
  { title: "Professional verification", text: "Verification creates stronger identity and professional context without pretending every risk disappears.", icon: BadgeCheck, href: "/verification-info" },
  { title: "Protected payment journey", text: "SabiPay connects eligible bookings, payment status, completion, payout and dispute handling.", icon: CircleDollarSign, href: "/sabipay-explained" },
  { title: "Reviews and reputation", text: "Service history and reviews help clients compare with more context than an anonymous listing.", icon: Star, href: "/trust-and-safety" },
];

export default function Home() {
  return (
    <PublicShell>
      <main>
        <section className="overflow-hidden bg-[#f6faf8] px-4 pb-14 pt-8 sm:px-6 sm:pt-12 lg:px-8 lg:pb-20 lg:pt-16">
          <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[1.08fr_.92fr] xl:gap-16">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full bg-[#e5f6ed] px-3 py-1.5 text-sm font-extrabold text-[#007046]"><Sparkles size={16} aria-hidden="true" /> Services, opportunities and community in one place</p>
              <h1 className="mt-5 max-w-4xl text-4xl font-black leading-[1.03] tracking-[-.04em] text-[#173126] sm:text-5xl lg:text-6xl">Find trusted help. Build professional opportunity. Stay connected.</h1>
              <p className="mt-6 max-w-2xl text-base leading-7 text-[#607168] sm:text-lg">SabiWay helps clients find Nigerian professionals, helps professionals find work and build reputation, and keeps both sides connected through a shared marketplace, messaging, SabiPay and SabiForum experience.</p>

              <form action="/marketplace" method="get" className="mt-7 flex max-w-2xl flex-col gap-2 rounded-2xl border border-[#d9e6df] bg-white p-2 shadow-[0_14px_40px_rgba(22,75,49,.08)] sm:flex-row" role="search">
                <label className="flex min-h-12 flex-1 items-center gap-3 px-3">
                  <Search className="shrink-0 text-[#008753]" size={20} aria-hidden="true" />
                  <span className="sr-only">Search services or professionals</span>
                  <input name="q" className="w-full bg-transparent text-sm font-semibold text-[#173126] outline-none placeholder:font-medium placeholder:text-[#7d8b84]" placeholder="What service do you need?" />
                </label>
                <button type="submit" className="min-h-12 rounded-xl bg-[#008753] px-5 text-sm font-black text-white transition hover:bg-[#007046] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#008753] focus-visible:ring-offset-2">Search SabiWay</button>
              </form>

              <div className="mt-5 flex flex-wrap gap-2 text-sm">
                <span className="py-2 font-bold text-[#6c7a73]">Popular:</span>
                {serviceCategories.slice(0, 4).map((category) => <Link key={category.slug} href={`/services/${category.slug}`} className="rounded-full border border-[#d6e3dc] bg-white px-3 py-2 font-bold text-[#315044] hover:border-[#008753] hover:text-[#008753]">{category.name}</Link>)}
              </div>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Link href="/for-clients" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#008753] px-5 font-black text-white shadow-[0_12px_30px_rgba(0,135,83,.18)] transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#008753] focus-visible:ring-offset-2 motion-reduce:transform-none">I need a service <ArrowRight size={18} aria-hidden="true" /></Link>
                <Link href="/for-professionals" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-[#bfd4c8] bg-white px-5 font-black text-[#173126] hover:border-[#008753]">I offer services</Link>
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-[600px]">
              <div className="absolute -left-4 top-8 z-10 hidden rounded-2xl bg-[#FFB800] px-4 py-3 text-sm font-black text-[#173126] shadow-lg sm:block"><MapPin className="mb-1" size={18} aria-hidden="true" /> Find services near you</div>
              <div className="overflow-hidden rounded-[2rem] bg-[#008753] p-4 shadow-[0_30px_80px_rgba(0,80,50,.18)] sm:p-7">
                <div className="rounded-[1.6rem] bg-white p-4 sm:p-6">
                  <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[.14em] text-[#008753]">Start with your need</p><h2 className="mt-1 text-2xl font-black tracking-[-.02em] text-[#173126]">What can SabiWay help with?</h2></div><ShieldCheck className="shrink-0 text-[#008753]" aria-hidden="true" /></div>
                  <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {serviceCategories.map((category) => <Link key={category.slug} href={`/services/${category.slug}`} className="min-h-24 rounded-2xl bg-[#f4f8f6] p-3 transition hover:bg-[#e7f6ee] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#008753]"><BriefcaseBusiness size={20} className="text-[#008753]" aria-hidden="true" /><p className="mt-2 text-sm font-extrabold text-[#173126]">{category.name}</p></Link>)}
                  </div>
                  <Link href="/marketplace" className="mt-5 flex min-h-14 items-center gap-3 rounded-2xl bg-[#fff7dc] p-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9a7200]"><MessageCircleMore className="shrink-0 text-[#9a7200]" aria-hidden="true" /><div><p className="font-black text-[#173126]">Not sure what category fits?</p><p className="text-xs leading-5 text-[#74653b]">Open the marketplace and describe what you need.</p></div><ArrowRight className="ml-auto shrink-0 text-[#9a7200]" size={18} aria-hidden="true" /></Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-[#e3ece7] bg-white px-4 py-7 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-7xl gap-5 sm:grid-cols-3">
            <div className="flex items-start gap-3"><BadgeCheck className="mt-0.5 shrink-0 text-[#008753]" /><div><p className="font-black text-[#173126]">Trust context</p><p className="mt-1 text-sm leading-5 text-[#718078]">Profiles, verification and reviews help you compare.</p></div></div>
            <div className="flex items-start gap-3"><CircleDollarSign className="mt-0.5 shrink-0 text-[#008753]" /><div><p className="font-black text-[#173126]">Connected transactions</p><p className="mt-1 text-sm leading-5 text-[#718078]">Eligible jobs can move through booking and SabiPay.</p></div></div>
            <div className="flex items-start gap-3"><UsersRound className="mt-0.5 shrink-0 text-[#008753]" /><div><p className="font-black text-[#173126]">Built for both sides</p><p className="mt-1 text-sm leading-5 text-[#718078]">Separate Client and Professional journeys share one platform.</p></div></div>
          </div>
        </section>

        <section className="px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="mx-auto max-w-7xl">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between"><div className="max-w-3xl"><p className="text-xs font-black uppercase tracking-[.17em] text-[#008753]">Choose your SabiWay journey</p><h2 className="mt-3 text-3xl font-black tracking-[-.03em] text-[#173126] sm:text-4xl">One platform, designed differently for Clients and Professionals.</h2></div><Link href="/how-it-works" className="inline-flex min-h-11 w-fit items-center gap-2 rounded-xl font-black text-[#008753]">See the full journey <ArrowRight size={18} aria-hidden="true" /></Link></div>
            <div className="mt-8 grid gap-5 lg:grid-cols-2">
              <article className="rounded-[2rem] border border-[#dce8e1] bg-[#f7fbf9] p-6 sm:p-8"><span className="inline-flex rounded-full bg-[#e4f5ec] px-3 py-1.5 text-xs font-black uppercase tracking-[.12em] text-[#008753]">For Clients</span><h3 className="mt-4 text-2xl font-black text-[#173126]">Get the right person for the job with more context.</h3><p className="mt-3 max-w-xl leading-7 text-[#69786f]">Discover services, post a need, compare professionals, keep communication connected and use supported transaction tools when you are ready to proceed.</p><div className="mt-6 grid gap-2 text-sm font-semibold text-[#385145]">{["Discover by service and location", "Compare profiles and reputation", "Message, book and track work", "Use support and dispute routes when needed"].map((item) => <p key={item} className="flex gap-2"><CheckCircle2 size={18} className="mt-0.5 shrink-0 text-[#008753]" aria-hidden="true" />{item}</p>)}</div><Link href="/for-clients" className="mt-7 inline-flex min-h-12 items-center gap-2 rounded-xl bg-[#008753] px-5 font-black text-white">Explore the Client journey <ArrowRight size={17} aria-hidden="true" /></Link></article>
              <article className="rounded-[2rem] bg-[#073522] p-6 text-white sm:p-8"><span className="inline-flex rounded-full bg-white/10 px-3 py-1.5 text-xs font-black uppercase tracking-[.12em] text-[#9be0be]">For Professionals</span><h3 className="mt-4 text-2xl font-black">Turn your skills into visible, trusted opportunity.</h3><p className="mt-3 max-w-xl leading-7 text-white/70">Build your professional profile, show service context, respond to relevant work, manage conversations and bookings, and grow reputation through completed work.</p><div className="mt-6 grid gap-2 text-sm font-semibold text-white/85">{["Create a clear professional presence", "Use verification to add trust context", "Discover jobs and service demand", "Track earnings, reviews and reputation"].map((item) => <p key={item} className="flex gap-2"><CheckCircle2 size={18} className="mt-0.5 shrink-0 text-[#65d9a0]" aria-hidden="true" />{item}</p>)}</div><Link href="/for-professionals" className="mt-7 inline-flex min-h-12 items-center gap-2 rounded-xl bg-[#FFB800] px-5 font-black text-[#173126]">Become a SabiWay Professional <ArrowRight size={17} aria-hidden="true" /></Link></article>
            </div>
          </div>
        </section>

        <section className="bg-[#f4f8f6] px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="mx-auto max-w-7xl">
            <div className="max-w-3xl"><p className="text-xs font-black uppercase tracking-[.17em] text-[#008753]">How it works</p><h2 className="mt-3 text-3xl font-black tracking-[-.03em] text-[#173126] sm:text-4xl">A clearer path from “I need help” to “the work is complete”.</h2><p className="mt-4 text-base leading-7 text-[#69786f]">SabiWay is designed around the whole service journey, not only a directory listing.</p></div>
            <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">{journeySteps.map(({ title, text, icon: Icon }, index) => <article key={title} className="rounded-3xl border border-[#dce8e1] bg-white p-6 shadow-sm"><div className="flex items-center justify-between"><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#e8f7f0] text-[#008753]"><Icon size={22} aria-hidden="true" /></div><span className="text-sm font-black text-[#aebdb5]">0{index + 1}</span></div><h3 className="mt-5 text-xl font-black text-[#173126]">{title}</h3><p className="mt-2 text-sm leading-6 text-[#6b7a72]">{text}</p></article>)}</div>
          </div>
        </section>

        <section className="px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="mx-auto max-w-7xl">
            <div className="max-w-3xl"><p className="text-xs font-black uppercase tracking-[.17em] text-[#008753]">Trust before transaction</p><h2 className="mt-3 text-3xl font-black tracking-[-.03em] text-[#173126] sm:text-4xl">Understand who you are dealing with and what happens next.</h2></div>
            <div className="mt-8 grid gap-4 md:grid-cols-3">{trustSignals.map(({ title, text, icon: Icon, href }) => <Link key={title} href={href} className="group rounded-3xl border border-[#dce8e1] bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-[#9bcdb4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#008753] motion-reduce:transform-none"><Icon className="text-[#008753]" aria-hidden="true" /><h3 className="mt-5 text-xl font-black text-[#173126]">{title}</h3><p className="mt-2 text-sm leading-6 text-[#6b7a72]">{text}</p><span className="mt-5 inline-flex items-center gap-2 text-sm font-black text-[#008753]">Learn more <ArrowRight size={16} aria-hidden="true" /></span></Link>)}</div>
          </div>
        </section>

        <section className="bg-[#073522] px-4 py-16 text-white sm:px-6 lg:px-8 lg:py-20">
          <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1fr_.9fr] lg:items-center">
            <div><p className="text-xs font-black uppercase tracking-[.17em] text-[#8dd1b3]">More than a marketplace</p><h2 className="mt-3 text-3xl font-black tracking-[-.03em] sm:text-4xl">SabiForum keeps useful community context close to the work.</h2><p className="mt-4 max-w-2xl text-base leading-7 text-white/70">Ask practical questions, share useful knowledge and discover people beyond a single transaction. The community and marketplace use the same SabiWay identity.</p><Link href="/sabiforum" className="mt-6 inline-flex min-h-12 items-center gap-2 rounded-xl bg-[#FFB800] px-5 font-black text-[#173126]">Discover SabiForum <ArrowRight size={18} aria-hidden="true" /></Link></div>
            <div className="grid gap-3">{["One profile across marketplace and community", "Follow useful contributors and conversations", "Move from knowledge to service discovery without losing context"].map((point) => <div key={point} className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-4"><CheckCircle2 className="mt-0.5 shrink-0 text-[#57d696]" size={20} aria-hidden="true" /><p className="font-semibold text-white/85">{point}</p></div>)}</div>
          </div>
        </section>

        <section className="px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="mx-auto max-w-7xl">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between"><div><p className="text-xs font-black uppercase tracking-[.17em] text-[#008753]">Explore by location</p><h2 className="mt-3 text-3xl font-black tracking-[-.03em] text-[#173126]">Start where the work is.</h2></div><Link href="/services" className="inline-flex min-h-11 w-fit items-center gap-2 font-black text-[#008753]">Browse all services <ArrowRight size={17} aria-hidden="true" /></Link></div>
            <div className="mt-7 grid grid-cols-2 gap-3 md:grid-cols-4">{locations.map((location) => <Link key={location.slug} href={`/locations/${location.slug}`} className="rounded-2xl border border-[#dce8e1] bg-white p-5 transition hover:border-[#008753] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#008753]"><MapPin className="text-[#008753]" size={20} aria-hidden="true" /><p className="mt-3 font-black text-[#173126]">{location.name}</p><p className="mt-1 text-xs leading-5 text-[#718078]">Explore services and opportunities</p></Link>)}</div>
          </div>
        </section>

        <section className="px-4 pb-16 sm:px-6 lg:px-8 lg:pb-20">
          <div className="mx-auto max-w-7xl overflow-hidden rounded-[2rem] border border-[#dce8e1] bg-[#f8fbf9] p-6 sm:p-10 lg:p-12">
            <div className="grid gap-8 lg:grid-cols-[1fr_.8fr] lg:items-center">
              <div><p className="text-xs font-black uppercase tracking-[.17em] text-[#008753]">Web + mobile</p><h2 className="mt-3 text-3xl font-black tracking-[-.03em] text-[#173126] sm:text-4xl">Take the same SabiWay journey with you.</h2><p className="mt-4 max-w-2xl leading-7 text-[#68776f]">The mobile experience is designed around the same Client, Professional, marketplace, messaging, community and SabiPay journeys as the web experience.</p><div className="mt-6 flex flex-col gap-3 sm:flex-row"><Link href="/download" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#008753] px-5 font-black text-white"><Smartphone size={18} aria-hidden="true" /> App availability</Link><Link href="/how-it-works" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-[#cddbd3] bg-white px-5 font-black text-[#173126]">See how SabiWay works</Link></div></div>
              <div className="relative mx-auto w-full max-w-sm"><Image src="/Hero-phone-mockup.png" alt="SabiWay mobile app preview" width={520} height={720} className="h-auto w-full object-contain" priority={false} /></div>
            </div>
          </div>
        </section>
      </main>
    </PublicShell>
  );
}
