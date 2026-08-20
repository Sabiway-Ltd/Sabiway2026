import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  BriefcaseBusiness,
  CheckCircle2,
  CircleDollarSign,
  Globe2,
  HeartHandshake,
  MapPin,
  MessageCircleMore,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  UsersRound,
} from "lucide-react";

import { PublicShell } from "./_components/v2/PublicShell";
import { serviceCategories } from "./_components/v2/publicData";

const stories = [
  {
    eyebrow: "You are abroad",
    title: "You need something done back home — without calling ten different people.",
    text: "Find the right service, understand who you are dealing with and keep the conversation in one place when arranging help for family, property or a project in Nigeria.",
    icon: Globe2,
    href: "/diaspora",
    cta: "See the diaspora journey",
  },
  {
    eyebrow: "You need a service",
    title: "You want a professional you can compare before you commit.",
    text: "Browse by service, review profile and trust signals, clarify the work and move into supported booking and payment journeys when appropriate.",
    icon: Search,
    href: "/for-clients",
    cta: "See how clients use SabiWay",
  },
  {
    eyebrow: "You offer a service",
    title: "You are good at what you do. You need more than another social-media post to prove it.",
    text: "Build a professional presence, become easier to discover, respond to relevant work and grow reputation through completed jobs and reviews.",
    icon: BriefcaseBusiness,
    href: "/for-professionals",
    cta: "See the professional journey",
  },
];

const journeySteps = [
  { title: "Start with the real need", text: "Browse a service or understand the right route before creating an account.", icon: Search },
  { title: "Compare with context", text: "Use profiles, service information, location, verification and reputation to make a better choice.", icon: UsersRound },
  { title: "Keep the conversation together", text: "Move from discovery into messaging, scope, booking and scheduling without losing the job context.", icon: MessageCircleMore },
  { title: "Complete with clearer support", text: "Where supported, follow transaction status, completion, review and dispute routes inside SabiWay.", icon: ShieldCheck },
];

const trustSignals = [
  { title: "Know more before you choose", text: "Profiles, verification context and reviews help replace guesswork with useful signals.", icon: BadgeCheck, href: "/verification-info" },
  { title: "Understand the money journey", text: "SabiPay explains eligible payment, completion, payout and dispute states before you use them.", icon: CircleDollarSign, href: "/sabipay-explained" },
  { title: "Build reputation over time", text: "Completed work and reviews create a stronger professional history than a one-off advert or recommendation.", icon: Star, href: "/trust-and-safety" },
];

export default function Home() {
  return (
    <PublicShell>
      <main>
        <section className="overflow-hidden bg-[#f6faf8] px-4 pb-14 pt-8 sm:px-6 sm:pt-12 lg:px-8 lg:pb-20 lg:pt-16">
          <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[1.08fr_.92fr] xl:gap-16">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full bg-[#e5f6ed] px-3 py-1.5 text-sm font-extrabold text-[#007046]"><Sparkles size={16} aria-hidden="true" /> Nigeria at home. Nigerians everywhere.</p>
              <h1 className="mt-5 max-w-4xl text-4xl font-black leading-[1.03] tracking-[-.04em] text-[#173126] sm:text-5xl lg:text-6xl">Get things done back home. Find opportunities. Stay connected wherever you are.</h1>
              <p className="mt-6 max-w-2xl text-base leading-7 text-[#607168] sm:text-lg">SabiWay connects people in Nigeria with Nigerians across the diaspora around trusted services, professional opportunity and community. Whether you are in Lagos, London, Toronto, New York or elsewhere, you can understand the people, process and support before you commit.</p>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Link href="/services" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#008753] px-5 font-black text-white shadow-[0_12px_30px_rgba(0,135,83,.18)] transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#008753] focus-visible:ring-offset-2 motion-reduce:transform-none">Browse services <ArrowRight size={18} aria-hidden="true" /></Link>
                <Link href="/diaspora" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-[#bfd4c8] bg-white px-5 font-black text-[#173126] hover:border-[#008753]"><Globe2 size={18} aria-hidden="true" /> I live outside Nigeria</Link>
              </div>

              <div className="mt-6 flex flex-wrap gap-2 text-sm">
                <span className="py-2 font-bold text-[#6c7a73]">Popular services:</span>
                {serviceCategories.slice(0, 4).map((category) => <Link key={category.slug} href={`/services/${category.slug}`} className="rounded-full border border-[#d6e3dc] bg-white px-3 py-2 font-bold text-[#315044] hover:border-[#008753] hover:text-[#008753]">{category.name}</Link>)}
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-[600px]">
              <div className="absolute -left-4 top-8 z-10 hidden rounded-2xl bg-[#FFB800] px-4 py-3 text-sm font-black text-[#173126] shadow-lg sm:block"><HeartHandshake className="mb-1" size={18} aria-hidden="true" /> Built around real-life needs</div>
              <div className="overflow-hidden rounded-[2rem] bg-[#008753] p-4 shadow-[0_30px_80px_rgba(0,80,50,.18)] sm:p-7">
                <div className="rounded-[1.6rem] bg-white p-4 sm:p-6">
                  <p className="text-xs font-black uppercase tracking-[.14em] text-[#008753]">A familiar situation</p>
                  <h2 className="mt-2 text-2xl font-black tracking-[-.02em] text-[#173126]">“I’m abroad and need someone reliable to sort something out in Nigeria.”</h2>
                  <p className="mt-3 text-sm leading-6 text-[#68786f]">Instead of depending only on a forwarded number, a group-chat recommendation or a social-media post, SabiWay is designed to give you more context before the work begins.</p>
                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    {["Find the right service", "See professional context", "Keep the conversation together", "Understand supported payment and dispute routes"].map((item) => <div key={item} className="flex gap-2 rounded-2xl bg-[#f4f8f6] p-3 text-sm font-bold text-[#315044]"><CheckCircle2 className="mt-0.5 shrink-0 text-[#008753]" size={18} aria-hidden="true" />{item}</div>)}
                  </div>
                  <Link href="/diaspora" className="mt-5 flex min-h-14 items-center gap-3 rounded-2xl bg-[#fff7dc] p-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9a7200]"><Globe2 className="shrink-0 text-[#9a7200]" aria-hidden="true" /><div><p className="font-black text-[#173126]">Living outside Nigeria?</p><p className="text-xs leading-5 text-[#74653b]">See how SabiWay is designed to bridge distance and trust.</p></div><ArrowRight className="ml-auto shrink-0 text-[#9a7200]" size={18} aria-hidden="true" /></Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-[#e3ece7] bg-white px-4 py-7 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-7xl gap-5 sm:grid-cols-3">
            <div className="flex items-start gap-3"><Globe2 className="mt-0.5 shrink-0 text-[#008753]" /><div><p className="font-black text-[#173126]">Diaspora-connected</p><p className="mt-1 text-sm leading-5 text-[#718078]">Designed for people in Nigeria and those coordinating needs from abroad.</p></div></div>
            <div className="flex items-start gap-3"><BadgeCheck className="mt-0.5 shrink-0 text-[#008753]" /><div><p className="font-black text-[#173126]">Trust before commitment</p><p className="mt-1 text-sm leading-5 text-[#718078]">Understand profiles, verification and reputation before taking the next step.</p></div></div>
            <div className="flex items-start gap-3"><UsersRound className="mt-0.5 shrink-0 text-[#008753]" /><div><p className="font-black text-[#173126]">Built for both sides</p><p className="mt-1 text-sm leading-5 text-[#718078]">Clients get clearer choices; professionals get a better way to build visible credibility.</p></div></div>
          </div>
        </section>

        <section className="px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="mx-auto max-w-7xl">
            <div className="max-w-3xl"><p className="text-xs font-black uppercase tracking-[.17em] text-[#008753]">Start from your situation</p><h2 className="mt-3 text-3xl font-black tracking-[-.03em] text-[#173126] sm:text-4xl">SabiWay should feel useful before you even create an account.</h2><p className="mt-4 text-base leading-7 text-[#69786f]">Choose the situation that sounds most like you. Each route explains what SabiWay can help with and where sign-in actually becomes necessary.</p></div>
            <div className="mt-8 grid gap-5 lg:grid-cols-3">
              {stories.map(({ eyebrow, title, text, icon: Icon, href, cta }) => <article key={eyebrow} className="flex flex-col rounded-[2rem] border border-[#dce8e1] bg-white p-6 shadow-sm sm:p-7"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e8f7f0] text-[#008753]"><Icon size={23} aria-hidden="true" /></div><p className="mt-5 text-xs font-black uppercase tracking-[.14em] text-[#008753]">{eyebrow}</p><h3 className="mt-2 text-2xl font-black tracking-[-.025em] text-[#173126]">{title}</h3><p className="mt-3 flex-1 text-sm leading-6 text-[#68786f]">{text}</p><Link href={href} className="mt-6 inline-flex min-h-11 items-center gap-2 font-black text-[#008753]">{cta}<ArrowRight size={17} aria-hidden="true" /></Link></article>)}
            </div>
          </div>
        </section>

        <section className="bg-[#073522] px-4 py-16 text-white sm:px-6 lg:px-8 lg:py-20">
          <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[.9fr_1.1fr] lg:items-center">
            <div><p className="text-xs font-black uppercase tracking-[.17em] text-[#8dd1b3]">Across borders, still connected</p><h2 className="mt-3 text-3xl font-black tracking-[-.03em] sm:text-4xl">Distance should not mean losing visibility or relying only on who knows who.</h2><p className="mt-4 max-w-xl leading-7 text-white/72">SabiWay is Nigeria-first in service supply, but the relationship is global: Nigerians abroad can discover, coordinate and stay connected to people and opportunities back home, while Nigerian professionals can build reputation that travels further than their immediate network.</p><Link href="/diaspora" className="mt-7 inline-flex min-h-12 items-center gap-2 rounded-xl bg-[#FFB800] px-5 font-black text-[#173126]">Explore SabiWay for the diaspora <ArrowRight size={17} aria-hidden="true" /></Link></div>
            <div className="grid gap-3 sm:grid-cols-2">
              {[{city:"London",copy:"Arrange trusted support for family or property back home."},{city:"Toronto",copy:"Find professional help in Nigeria without starting from a forwarded phone number."},{city:"New York",copy:"Stay connected to Nigerian services, opportunities and community."},{city:"Lagos",copy:"Build professional reputation that can be discovered locally and from abroad."}].map((item)=><div key={item.city} className="rounded-3xl border border-white/10 bg-white/8 p-5"><MapPin className="text-[#65d9a0]" size={20} aria-hidden="true"/><p className="mt-4 text-lg font-black">{item.city}</p><p className="mt-2 text-sm leading-6 text-white/70">{item.copy}</p></div>)}
            </div>
          </div>
        </section>

        <section className="bg-[#f4f8f6] px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="mx-auto max-w-7xl">
            <div className="max-w-3xl"><p className="text-xs font-black uppercase tracking-[.17em] text-[#008753]">How it works</p><h2 className="mt-3 text-3xl font-black tracking-[-.03em] text-[#173126] sm:text-4xl">A clearer path from “I need this sorted” to “the work is complete”.</h2></div>
            <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">{journeySteps.map(({ title, text, icon: Icon }, index) => <article key={title} className="rounded-3xl border border-[#dce8e1] bg-white p-6 shadow-sm"><div className="flex items-center justify-between"><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#e8f7f0] text-[#008753]"><Icon size={22} aria-hidden="true" /></div><span className="text-sm font-black text-[#aebdb5]">0{index + 1}</span></div><h3 className="mt-5 text-xl font-black text-[#173126]">{title}</h3><p className="mt-2 text-sm leading-6 text-[#6b7a72]">{text}</p></article>)}</div>
            <Link href="/how-it-works" className="mt-7 inline-flex min-h-11 items-center gap-2 font-black text-[#008753]">See the complete journey <ArrowRight size={17} aria-hidden="true" /></Link>
          </div>
        </section>

        <section className="px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="mx-auto max-w-7xl">
            <div className="max-w-3xl"><p className="text-xs font-black uppercase tracking-[.17em] text-[#008753]">Trust before transaction</p><h2 className="mt-3 text-3xl font-black tracking-[-.03em] text-[#173126] sm:text-4xl">Know what SabiWay checks, what it supports and what it does not promise.</h2></div>
            <div className="mt-8 grid gap-4 md:grid-cols-3">{trustSignals.map(({ title, text, icon: Icon, href }) => <Link key={title} href={href} className="group rounded-3xl border border-[#dce8e1] bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-[#9bcdb4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#008753] motion-reduce:transform-none"><Icon className="text-[#008753]" aria-hidden="true" /><h3 className="mt-5 text-xl font-black text-[#173126]">{title}</h3><p className="mt-2 text-sm leading-6 text-[#6b7a72]">{text}</p><span className="mt-5 inline-flex items-center gap-2 text-sm font-black text-[#008753]">Understand this <ArrowRight size={16} aria-hidden="true" /></span></Link>)}</div>
          </div>
        </section>

        <section className="px-4 pb-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl overflow-hidden rounded-[2rem] bg-[#008753] px-6 py-10 text-white sm:px-10 lg:flex lg:items-center lg:justify-between lg:gap-8 lg:px-12">
            <div className="max-w-2xl"><p className="text-xs font-black uppercase tracking-[.18em] text-white/75">Start publicly</p><h2 className="mt-2 text-3xl font-black tracking-[-.03em]">Explore first. Create an account when you are ready to act.</h2><p className="mt-3 text-sm leading-6 text-white/80">Public pages should help you understand SabiWay without forcing a login. Sign-in is for actions such as messaging, posting, booking, payment and participation.</p></div>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row lg:mt-0 lg:shrink-0"><Link href="/services" className="inline-flex min-h-12 items-center justify-center rounded-xl bg-[#FFB800] px-5 font-black text-[#173126]">Browse services</Link><Link href="/signup" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/25 px-5 font-black text-white">Join SabiWay</Link></div>
          </div>
        </section>
      </main>
    </PublicShell>
  );
}
