import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  BriefcaseBusiness,
  CheckCircle2,
  Laptop,
  MapPin,
  MessageCircleMore,
  Scissors,
  Search,
  ShieldCheck,
  Sparkles,
  UsersRound,
  Wrench,
  Zap,
} from "lucide-react";

import { PublicShell } from "./_components/v2/PublicShell";
import { serviceCategories } from "./_components/v2/publicData";

const categoryIcons = {
  cleaning: Sparkles,
  plumbing: Wrench,
  electrical: Zap,
  tutors: UsersRound,
  "hair-beauty": Scissors,
  "tech-support": Laptop,
} as const;

const trustPoints = [
  { title: "Search where the work is", text: "Choose the city, area or country where you actually need the service.", icon: MapPin },
  { title: "See useful trust context", text: "Review profile details, service information and verification status where available.", icon: BadgeCheck },
  { title: "Keep the conversation together", text: "Move from discovery into messaging and the next steps without losing context.", icon: MessageCircleMore },
] as const;

const howItWorks = [
  { step: "01", title: "Tell us what you need", text: "Search by service and the location where the work should happen." },
  { step: "02", title: "Compare the right options", text: "Look at service details, profiles and trust signals before deciding." },
  { step: "03", title: "Start the conversation", text: "Sign in when you are ready to message, post work, book or pay." },
] as const;

export default function Home() {
  return (
    <PublicShell>
      <main>
        <section className="overflow-hidden bg-background px-4 pb-14 pt-10 sm:px-6 lg:px-8 lg:pb-20 lg:pt-16">
          <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[1.08fr_.92fr] xl:gap-16">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full bg-[var(--sabi-primary-soft)] px-3 py-1.5 text-sm font-extrabold text-primary"><MapPin size={16} aria-hidden="true" /> Services where you need them</p>
              <h1 className="mt-5 max-w-4xl text-4xl font-black leading-[1.02] tracking-[-.045em] text-foreground sm:text-5xl lg:text-6xl">Find the right professional for the job — nearby or remote.</h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">Search practical services by what you need and where you need it. Browse first, compare your options, and sign in only when you are ready to take action.</p>

              <form action="/marketplace" method="get" className="mt-7 grid max-w-3xl gap-2 rounded-[var(--sabi-radius-lg)] border border-border bg-card p-2 shadow-[var(--sabi-shadow-md)] md:grid-cols-[1.25fr_1fr_auto]" role="search">
                <label className="flex min-h-12 items-center gap-3 rounded-[var(--sabi-radius-md)] px-3 focus-within:ring-[var(--sabi-focus-ring-width)] focus-within:ring-ring">
                  <Search className="shrink-0 text-primary" size={20} aria-hidden="true" /><span className="sr-only">Search services</span>
                  <input name="q" className="w-full bg-transparent text-base font-semibold text-foreground outline-none placeholder:font-medium placeholder:text-muted-foreground" placeholder="What do you need help with?" />
                </label>
                <label className="flex min-h-12 items-center gap-3 rounded-[var(--sabi-radius-md)] border-t border-border px-3 focus-within:ring-[var(--sabi-focus-ring-width)] focus-within:ring-ring md:border-l md:border-t-0">
                  <MapPin className="shrink-0 text-primary" size={19} aria-hidden="true" /><span className="sr-only">Service location</span>
                  <input name="location" className="w-full bg-transparent text-base font-semibold text-foreground outline-none placeholder:font-medium placeholder:text-muted-foreground" placeholder="City, area or country" />
                </label>
                <button type="submit" className="min-h-12 rounded-[var(--sabi-radius-md)] bg-primary px-6 text-sm font-black text-primary-foreground transition-colors hover:bg-[var(--sabi-primary-strong)]">Search</button>
              </form>

              <div className="mt-5 flex flex-wrap items-center gap-2 text-sm">
                <span className="py-2 font-bold text-muted-foreground">Popular:</span>
                {serviceCategories.slice(0, 4).map((category) => <Link key={category.slug} href={`/services/${category.slug}`} className="rounded-full border border-border bg-card px-3 py-2 font-bold text-foreground transition-colors hover:border-primary hover:text-primary">{category.name}</Link>)}
              </div>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Link href="/services" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-[var(--sabi-radius-md)] bg-primary px-5 font-black text-primary-foreground">Browse services <ArrowRight size={18} aria-hidden="true" /></Link>
                <Link href="/for-professionals" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-[var(--sabi-radius-md)] border border-border bg-card px-5 font-black text-foreground hover:bg-muted">Offer your services</Link>
              </div>
            </div>

            <aside className="rounded-[calc(var(--sabi-radius-xl)+8px)] bg-primary p-4 shadow-[var(--sabi-shadow-lg)] sm:p-6" aria-label="Popular service categories">
              <div className="rounded-[var(--sabi-radius-xl)] bg-card p-5 sm:p-6">
                <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[.15em] text-primary">Explore services</p><h2 className="mt-2 text-2xl font-black tracking-[-.025em]">Start with what you need.</h2></div><Search className="shrink-0 text-primary" aria-hidden="true" /></div>
                <div className="mt-5 grid grid-cols-2 gap-3">
                  {serviceCategories.map((category) => { const Icon = categoryIcons[category.slug]; return <Link key={category.slug} href={`/services/${category.slug}`} className="group rounded-[var(--sabi-radius-lg)] border border-border bg-background p-4 transition-colors hover:border-primary hover:bg-[var(--sabi-surface-selected)]"><span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--sabi-primary-soft)] text-primary"><Icon size={19} aria-hidden="true" /></span><span className="mt-3 block text-sm font-black text-foreground group-hover:text-primary">{category.name}</span></Link>; })}
                </div>
                <Link href="/services" className="mt-5 inline-flex min-h-11 items-center gap-2 font-black text-primary">See all services <ArrowRight size={17} aria-hidden="true" /></Link>
              </div>
            </aside>
          </div>
        </section>

        <section className="border-y border-border bg-card px-4 py-7 sm:px-6 lg:px-8"><div className="mx-auto grid max-w-7xl gap-6 md:grid-cols-3">{trustPoints.map(({ title, text, icon: Icon }) => <div key={title} className="flex items-start gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--sabi-primary-soft)] text-primary"><Icon size={19} aria-hidden="true" /></span><div><h2 className="font-black">{title}</h2><p className="mt-1 text-sm leading-6 text-muted-foreground">{text}</p></div></div>)}</div></section>

        <section className="px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="mx-auto max-w-7xl">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div className="max-w-2xl"><p className="text-xs font-black uppercase tracking-[.17em] text-primary">Popular categories</p><h2 className="mt-2 text-3xl font-black tracking-[-.03em] sm:text-4xl">Find help for everyday work.</h2><p className="mt-3 text-base leading-7 text-muted-foreground">Browse service categories first, then narrow results by the place where you need the work.</p></div><Link href="/services" className="inline-flex min-h-11 items-center gap-2 font-black text-primary">Browse all categories <ArrowRight size={17} aria-hidden="true" /></Link></div>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {serviceCategories.map((category) => { const Icon = categoryIcons[category.slug]; return <Link key={category.slug} href={`/services/${category.slug}`} className="group rounded-[var(--sabi-radius-xl)] border border-border bg-card p-5 shadow-[var(--sabi-shadow-sm)] transition hover:border-primary focus-visible:outline-none"><div className="flex items-center justify-between gap-4"><span className="flex h-12 w-12 items-center justify-center rounded-[var(--sabi-radius-lg)] bg-[var(--sabi-primary-soft)] text-primary"><Icon size={22} aria-hidden="true" /></span><ArrowRight className="text-muted-foreground transition group-hover:translate-x-1 group-hover:text-primary motion-reduce:transform-none" size={18} aria-hidden="true" /></div><h3 className="mt-5 text-xl font-black group-hover:text-primary">{category.name}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{category.description}</p></Link>; })}
            </div>
          </div>
        </section>

        <section className="bg-muted px-4 py-16 sm:px-6 lg:px-8 lg:py-20"><div className="mx-auto grid max-w-7xl gap-5 lg:grid-cols-2">
          <article className="rounded-[var(--sabi-radius-xl)] bg-primary p-7 text-primary-foreground shadow-[var(--sabi-shadow-md)] sm:p-9"><span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-foreground/12"><Search aria-hidden="true" /></span><p className="mt-6 text-xs font-black uppercase tracking-[.16em] text-primary-foreground/75">For clients</p><h2 className="mt-2 text-3xl font-black tracking-[-.03em]">Find someone who can get the work done.</h2><p className="mt-3 max-w-xl leading-7 text-primary-foreground/80">Browse services publicly, compare relevant options, and create an account when you are ready to contact a Professional or post a job.</p><Link href="/for-clients" className="mt-7 inline-flex min-h-12 items-center gap-2 rounded-[var(--sabi-radius-md)] bg-primary-foreground px-5 font-black text-[var(--sabi-primary-strong)]">See how it works for Clients <ArrowRight size={17} aria-hidden="true" /></Link></article>
          <article className="rounded-[var(--sabi-radius-xl)] border border-border bg-card p-7 shadow-[var(--sabi-shadow-sm)] sm:p-9"><span className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--sabi-primary-soft)] text-primary"><BriefcaseBusiness aria-hidden="true" /></span><p className="mt-6 text-xs font-black uppercase tracking-[.16em] text-primary">For professionals</p><h2 className="mt-2 text-3xl font-black tracking-[-.03em]">Make your services easier to discover.</h2><p className="mt-3 max-w-xl leading-7 text-muted-foreground">Build your Professional presence, show where and how you work, and respond to relevant opportunities as the marketplace grows.</p><Link href="/for-professionals" className="mt-7 inline-flex min-h-12 items-center gap-2 rounded-[var(--sabi-radius-md)] bg-primary px-5 font-black text-primary-foreground">Explore the Professional journey <ArrowRight size={17} aria-hidden="true" /></Link></article>
        </div></section>

        <section className="px-4 py-16 sm:px-6 lg:px-8 lg:py-20"><div className="mx-auto max-w-7xl"><div className="max-w-2xl"><p className="text-xs font-black uppercase tracking-[.17em] text-primary">How it works</p><h2 className="mt-2 text-3xl font-black tracking-[-.03em] sm:text-4xl">From need to conversation in three steps.</h2></div><ol className="mt-8 grid gap-4 md:grid-cols-3">{howItWorks.map((item) => <li key={item.step} className="rounded-[var(--sabi-radius-xl)] border border-border bg-card p-6"><span className="text-sm font-black text-primary">{item.step}</span><h3 className="mt-4 text-xl font-black">{item.title}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{item.text}</p></li>)}</ol><div className="mt-8 flex flex-wrap gap-3 text-sm font-bold text-muted-foreground"><span className="inline-flex items-center gap-2"><CheckCircle2 className="text-primary" size={17} aria-hidden="true" /> Browse before signing in</span><span className="inline-flex items-center gap-2"><ShieldCheck className="text-primary" size={17} aria-hidden="true" /> Trust information stays visible</span><span className="inline-flex items-center gap-2"><MapPin className="text-primary" size={17} aria-hidden="true" /> Starting with Nigeria and the UK</span></div></div></section>

        <section className="px-4 pb-16 sm:px-6 lg:px-8 lg:pb-20"><div className="mx-auto flex max-w-7xl flex-col gap-6 rounded-[calc(var(--sabi-radius-xl)+4px)] bg-[var(--sabi-primary-strong)] px-6 py-9 text-primary-foreground sm:px-9 lg:flex-row lg:items-center lg:justify-between"><div className="max-w-2xl"><h2 className="text-2xl font-black sm:text-3xl">Ready to find the right service?</h2><p className="mt-2 leading-7 text-primary-foreground/80">Start with what you need. You can browse the marketplace before creating an account.</p></div><div className="flex flex-col gap-3 sm:flex-row"><Link href="/marketplace" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-[var(--sabi-radius-md)] bg-accent px-5 font-black text-accent-foreground">Explore marketplace <ArrowRight size={17} aria-hidden="true" /></Link><Link href="/how-it-works" className="inline-flex min-h-12 items-center justify-center rounded-[var(--sabi-radius-md)] border border-primary-foreground/25 px-5 font-black text-primary-foreground hover:bg-primary-foreground/10">How SabiWay works</Link></div></div></section>
      </main>
    </PublicShell>
  );
}
