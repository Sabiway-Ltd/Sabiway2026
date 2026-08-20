"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Globe2, Menu, ShieldCheck, X } from "lucide-react";

const navigation = [
  { href: "/services", label: "Find services" },
  { href: "/locations", label: "Locations" },
  { href: "/for-clients", label: "For clients" },
  { href: "/for-professionals", label: "For professionals" },
  { href: "/how-it-works", label: "How it works" },
];

const footerGroups = [
  {
    title: "Discover",
    links: [
      { href: "/services", label: "Browse services" },
      { href: "/locations", label: "Browse locations" },
      { href: "/sabiforum", label: "Discover SabiForum" },
      { href: "/download", label: "Download the app" },
    ],
  },
  {
    title: "How SabiWay helps",
    links: [
      { href: "/for-clients", label: "For clients" },
      { href: "/for-professionals", label: "For professionals" },
      { href: "/how-it-works", label: "How it works" },
      { href: "/fees", label: "Fees & charges" },
      { href: "/sabipay-explained", label: "SabiPay explained" },
    ],
  },
  {
    title: "Trust & support",
    links: [
      { href: "/trust-and-safety", label: "Trust & safety" },
      { href: "/verification-info", label: "Verification" },
      { href: "/helpcenter", label: "Help Centre" },
      { href: "/contact", label: "Contact us" },
      { href: "/accessibility", label: "Accessibility" },
    ],
  },
  {
    title: "SabiWay",
    links: [
      { href: "/about-us", label: "About us" },
      { href: "/partners", label: "Partnerships" },
      { href: "/careers", label: "Careers" },
      { href: "/privacy-policy", label: "Privacy Policy" },
      { href: "/terms-of-use", label: "Terms of Use" },
    ],
  },
];

function BrandLockup({ footer = false }: { footer?: boolean }) {
  return (
    <span className={`inline-flex items-center rounded-2xl ${footer ? "bg-white/8 px-3 py-2" : "bg-primary px-3 py-2 shadow-sm"}`}>
      <Image src="/Footerlogo.svg" alt="SabiWay" width={1600} height={519} className="h-7 w-auto sm:h-8" priority={!footer} />
    </span>
  );
}

export function PublicHeader() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/90">
      <div className="mx-auto flex min-h-[72px] max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex min-h-11 shrink-0 items-center rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2" aria-label="SabiWay home"><BrandLockup /></Link>
        <nav className="hidden items-center gap-0.5 xl:flex" aria-label="Primary navigation">
          {navigation.map((item) => <Link key={item.href} href={item.href} className="flex min-h-11 items-center rounded-xl px-3 py-2 text-sm font-bold text-muted-foreground transition-colors hover:bg-muted hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">{item.label}</Link>)}
        </nav>
        <div className="hidden shrink-0 items-center gap-2 md:flex">
          <Link href="/login" className="flex min-h-11 items-center rounded-xl px-4 py-2 text-sm font-extrabold text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">Sign in</Link>
          <Link href="/signup" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-black text-accent-foreground shadow-sm transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 motion-reduce:transform-none">Join SabiWay <ArrowRight size={16} aria-hidden="true" /></Link>
        </div>
        <button type="button" onClick={() => setOpen((value) => !value)} className="flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-border text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary xl:hidden" aria-label={open ? "Close navigation" : "Open navigation"} aria-expanded={open} aria-controls="mobile-primary-navigation">{open ? <X size={22} aria-hidden="true" /> : <Menu size={22} aria-hidden="true" />}</button>
      </div>
      {open ? <div id="mobile-primary-navigation" className="border-t border-border bg-card px-4 py-4 xl:hidden"><nav className="mx-auto grid max-w-7xl gap-1" aria-label="Mobile navigation">{navigation.map((item) => <Link key={item.href} href={item.href} onClick={() => setOpen(false)} className="flex min-h-11 items-center rounded-xl px-3 py-3 font-bold text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">{item.label}</Link>)}<Link href="/sabiforum" onClick={() => setOpen(false)} className="flex min-h-11 items-center rounded-xl px-3 py-3 font-bold text-foreground hover:bg-muted">SabiForum</Link><div className="mt-2 grid grid-cols-2 gap-2 border-t border-border pt-3 md:hidden"><Link href="/login" onClick={() => setOpen(false)} className="flex min-h-11 items-center justify-center rounded-xl border border-border px-3 py-3 text-center font-extrabold">Sign in</Link><Link href="/signup" onClick={() => setOpen(false)} className="flex min-h-11 items-center justify-center rounded-xl bg-accent px-3 py-3 text-center font-black text-accent-foreground">Join</Link></div></nav></div> : null}
    </header>
  );
}

export function PublicFooter() {
  return (
    <footer className="mt-auto bg-[var(--sabi-primary-strong)] text-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 border-b border-white/15 pb-10 lg:grid-cols-[1.2fr_2.8fr]">
          <div><BrandLockup footer /><p className="mt-4 max-w-md text-sm leading-6 text-white/80">SabiWay helps people find trusted professionals where they are — or wherever they need a service. We are optimising first for Nigeria and the UK while keeping the marketplace global by design.</p><div className="mt-5 grid gap-2 text-sm font-bold text-white/90"><p className="inline-flex items-center gap-2"><Globe2 size={17} aria-hidden="true" /> Local-first. Global by design.</p><p className="inline-flex items-center gap-2"><ShieldCheck size={17} aria-hidden="true" /> Trust-led by design.</p></div></div>
          <div className="grid grid-cols-2 gap-x-6 gap-y-9 sm:grid-cols-4">{footerGroups.map((group) => <div key={group.title}><p className="text-xs font-black uppercase tracking-[.16em] text-white/70">{group.title}</p><div className="mt-3 grid gap-1 text-sm font-semibold text-white/85">{group.links.map((link) => <Link key={link.href} className="flex min-h-10 items-center rounded-lg hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white" href={link.href}>{link.label}</Link>)}</div></div>)}</div>
        </div>
        <div className="flex flex-col gap-2 pt-5 text-xs text-white/70 sm:flex-row sm:items-center sm:justify-between"><p>© {new Date().getFullYear()} SabiWay. Find trusted services where you are — and wherever you need them.</p><p>Services · Opportunity · Community · Trust</p></div>
      </div>
    </footer>
  );
}

export function PublicShell({ children }: { children: React.ReactNode }) { return <div className="flex min-h-screen flex-col bg-background text-foreground"><PublicHeader />{children}<PublicFooter /></div>; }

export function V2ContentHero({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return <section className="px-4 pt-8 sm:px-6 sm:pt-10 lg:px-8"><div className="mx-auto max-w-7xl overflow-hidden rounded-[var(--sabi-radius-xl)] bg-primary px-6 py-11 text-primary-foreground shadow-[var(--sabi-shadow-lg)] sm:px-10 sm:py-14 lg:px-14 lg:py-16"><p className="text-xs font-black uppercase tracking-[.18em] text-white/85">{eyebrow}</p><h1 className="mt-3 max-w-4xl text-3xl font-black leading-tight tracking-[-.025em] sm:text-4xl lg:text-5xl">{title}</h1><p className="mt-5 max-w-3xl text-base leading-7 text-white/90 sm:text-lg">{description}</p></div></section>;
}
