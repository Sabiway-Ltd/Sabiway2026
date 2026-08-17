import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BriefcaseBusiness, CheckCircle2, MapPin, MessageCircleMore, Search, ShieldCheck, Sparkles, UsersRound } from "lucide-react";

import { PublicShell } from "./_components/v2/PublicShell";

const categories = ["Electricians", "Plumbing", "Tailors", "Hair & Beauty", "Tutors", "Tech Support"];

const steps = [
  { title: "Search or post the job", text: "Tell SabiWay what you need and where you need it.", icon: Search },
  { title: "Compare trusted professionals", text: "Review providers, location, pricing and availability before you decide.", icon: UsersRound },
  { title: "Move the work forward safely", text: "Continue into messaging, booking, protected payment, progress tracking and support without losing context.", icon: ShieldCheck },
];

const trustPoints = [
  "Marketplace and SabiForum use one shared identity",
  "Client and professional journeys are designed separately",
  "Listings and jobs pass through moderation controls",
  "Web and mobile share the same marketplace rules",
];

export default function Home() {
  return (
    <PublicShell>
      <main>
        <section className="overflow-hidden bg-[#f7faf8] px-4 pb-14 pt-10 sm:px-6 lg:px-8 lg:pb-20 lg:pt-16">
          <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[1.05fr_.95fr]">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full bg-[#e7f7ef] px-3 py-1.5 text-sm font-extrabold text-[#007046]"><Sparkles size={16}/> Built for Nigerians at home and abroad</p>
              <h1 className="mt-5 max-w-4xl text-4xl font-black leading-[1.04] tracking-[-.035em] text-[#173126] sm:text-5xl lg:text-6xl">Trusted services, real opportunities and useful community — in one place.</h1>
              <p className="mt-6 max-w-2xl text-base leading-7 text-[#607168] sm:text-lg">SabiWay connects clients with Nigerian professionals, lets people post jobs and discover services by location, and keeps the wider community connected through SabiForum.</p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Link href="/marketplace" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#008753] px-5 font-black text-white shadow-[0_12px_30px_rgba(0,135,83,.18)] transition hover:-translate-y-0.5">Explore marketplace <ArrowRight size={18}/></Link>
                <Link href="/signup" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-[#bfd4c8] bg-white px-5 font-black text-[#173126]">Create free account</Link>
              </div>
              <div className="mt-7 grid max-w-xl grid-cols-2 gap-3 text-sm sm:grid-cols-3">
                <div className="rounded-2xl border border-[#e0ebe5] bg-white p-4"><p className="text-xl font-black text-[#008753]">Web + mobile</p><p className="mt-1 text-[#718078]">Shared experience</p></div>
                <div className="rounded-2xl border border-[#e0ebe5] bg-white p-4"><p className="text-xl font-black text-[#008753]">Services + jobs</p><p className="mt-1 text-[#718078]">Two-sided marketplace</p></div>
                <div className="col-span-2 rounded-2xl border border-[#e0ebe5] bg-white p-4 sm:col-span-1"><p className="text-xl font-black text-[#008753]">SabiForum</p><p className="mt-1 text-[#718078]">Community layer</p></div>
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-[620px]">
              <div className="absolute -left-5 top-8 hidden rounded-2xl bg-[#FFB800] px-4 py-3 text-sm font-black text-[#173126] shadow-lg sm:block"><MapPin className="mb-1" size={18}/> Find nearby services</div>
              <div className="overflow-hidden rounded-[2rem] bg-[#008753] p-5 shadow-[0_30px_80px_rgba(0,80,50,.18)] sm:p-8">
                <div className="rounded-[1.6rem] bg-white p-4 sm:p-6">
                  <div className="flex items-center justify-between"><div><p className="text-xs font-black uppercase tracking-[.14em] text-[#008753]">Marketplace preview</p><h2 className="mt-1 text-2xl font-black text-[#173126]">What do you need today?</h2></div><span className="rounded-full bg-[#e8f7f0] px-3 py-1 text-xs font-extrabold text-[#008753]">V2</span></div>
                  <div className="mt-5 rounded-2xl border border-[#dce8e1] p-3 text-sm text-[#728078]">Search services, skills or problems</div>
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    {categories.slice(0,4).map((category) => <div key={category} className="rounded-2xl bg-[#f4f8f6] p-4"><BriefcaseBusiness size={20} className="text-[#008753]"/><p className="mt-2 font-extrabold text-[#173126]">{category}</p></div>)}
                  </div>
                  <div className="mt-5 flex items-center gap-3 rounded-2xl bg-[#fff7dc] p-4"><MessageCircleMore className="text-[#9a7200]"/><div><p className="font-black text-[#173126]">Post the job instead</p><p className="text-xs leading-5 text-[#74653b]">Let relevant professionals respond to your need.</p></div></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-[#e3ece7] bg-white px-4 py-8 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl"><p className="text-center text-xs font-black uppercase tracking-[.17em] text-[#718078]">Popular service categories</p><div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">{categories.map((category) => <Link key={category} href="/marketplace" className="rounded-2xl border border-[#dce8e1] bg-[#fbfdfc] px-4 py-4 text-center text-sm font-extrabold text-[#31483b] transition hover:border-[#008753] hover:text-[#008753]">{category}</Link>)}</div></div>
        </section>

        <section className="px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="mx-auto max-w-7xl">
            <div className="max-w-3xl"><p className="text-xs font-black uppercase tracking-[.17em] text-[#008753]">How SabiWay works</p><h2 className="mt-3 text-3xl font-black tracking-[-.025em] sm:text-4xl">Designed around the real journey, not just a directory.</h2><p className="mt-4 text-base leading-7 text-[#69786f]">Discovery, jobs, messaging, booking, protected payments, community and support are designed as one connected experience instead of separate tools.</p></div>
            <div className="mt-8 grid gap-4 md:grid-cols-3">{steps.map(({title,text,icon:Icon}, index) => <article key={title} className="rounded-3xl border border-[#dce8e1] bg-white p-6 shadow-sm"><div className="flex items-center justify-between"><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#e8f7f0] text-[#008753]"><Icon size={22}/></div><span className="text-sm font-black text-[#bdc9c2]">0{index+1}</span></div><h3 className="mt-5 text-xl font-black">{title}</h3><p className="mt-2 text-sm leading-6 text-[#6b7a72]">{text}</p></article>)}</div>
          </div>
        </section>

        <section className="bg-[#073522] px-4 py-16 text-white sm:px-6 lg:px-8 lg:py-20">
          <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1fr_.9fr] lg:items-center">
            <div><p className="text-xs font-black uppercase tracking-[.17em] text-[#8dd1b3]">Trust and community</p><h2 className="mt-3 text-3xl font-black tracking-[-.025em] sm:text-4xl">A marketplace strengthened by community context.</h2><p className="mt-4 max-w-2xl text-base leading-7 text-white/70">SabiForum gives SabiWay a community layer where people can share knowledge, follow useful contributors and discover context around the people and services they interact with.</p><Link href="/community" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#FFB800] px-5 py-3 font-black text-[#173126]">Explore SabiForum <ArrowRight size={18}/></Link></div>
            <div className="grid gap-3">{trustPoints.map((point) => <div key={point} className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-4"><CheckCircle2 className="mt-0.5 shrink-0 text-[#57d696]" size={20}/><p className="font-semibold text-white/85">{point}</p></div>)}</div>
          </div>
        </section>

        <section className="px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="mx-auto max-w-7xl overflow-hidden rounded-[2rem] border border-[#dce8e1] bg-white p-6 sm:p-10 lg:p-12">
            <div className="grid gap-8 lg:grid-cols-[1fr_.8fr] lg:items-center">
              <div><p className="text-xs font-black uppercase tracking-[.17em] text-[#008753]">One SabiWay</p><h2 className="mt-3 text-3xl font-black sm:text-4xl">Move from discovery to action without losing context.</h2><p className="mt-4 max-w-2xl leading-7 text-[#68776f]">Clients, professionals and community members use one connected SabiWay identity and shared platform across web and mobile.</p><div className="mt-6 flex flex-wrap gap-3"><Link href="/marketplace" className="rounded-xl bg-[#008753] px-5 py-3 font-black text-white">Browse services</Link><Link href="/about-us" className="rounded-xl border border-[#cddbd3] px-5 py-3 font-black">Why SabiWay</Link></div></div>
              <div className="relative mx-auto w-full max-w-sm"><Image src="/Hero-phone-mockup.png" alt="SabiWay mobile app preview" width={520} height={720} className="h-auto w-full object-contain" priority={false}/></div>
            </div>
          </div>
        </section>
      </main>
    </PublicShell>
  );
}
