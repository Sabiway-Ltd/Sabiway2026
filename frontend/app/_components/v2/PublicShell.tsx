"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Menu, X, ArrowRight, ShieldCheck } from "lucide-react";

const navigation = [
  { href: "/marketplace", label: "Marketplace" },
  { href: "/community", label: "SabiForum" },
  { href: "/about-us", label: "About" },
  { href: "/helpcenter", label: "Help" },
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
    <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur">
      <div className="mx-auto flex min-h-18 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex min-h-11 items-center rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2" aria-label="SabiWay home">
          <BrandLockup />
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Primary navigation">
          {navigation.map((item) => (
            <Link key={item.href} href={item.href} className="flex min-h-11 items-center rounded-xl px-4 py-2 text-sm font-bold text-muted-foreground transition-colors hover:bg-muted hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <Link href="/login" className="flex min-h-11 items-center rounded-xl px-4 py-2 text-sm font-extrabold text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">Sign in</Link>
          <Link href="/signup" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-black text-accent-foreground shadow-sm transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 motion-reduce:transform-none">
            Join SabiWay <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-border text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary md:hidden"
          aria-label={open ? "Close navigation" : "Open navigation"}
          aria-expanded={open}
          aria-controls="mobile-primary-navigation"
        >
          {open ? <X size={22} aria-hidden="true" /> : <Menu size={22} aria-hidden="true" />}
        </button>
      </div>

      {open ? (
        <div id="mobile-primary-navigation" className="border-t border-border bg-card px-4 py-4 md:hidden">
          <nav className="mx-auto grid max-w-7xl gap-1" aria-label="Mobile navigation">
            {navigation.map((item) => (
              <Link key={item.href} href={item.href} onClick={() => setOpen(false)} className="flex min-h-11 items-center rounded-xl px-3 py-3 font-bold text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">{item.label}</Link>
            ))}
            <div className="mt-2 grid grid-cols-2 gap-2 border-t border-border pt-3">
              <Link href="/login" onClick={() => setOpen(false)} className="flex min-h-11 items-center justify-center rounded-xl border border-border px-3 py-3 text-center font-extrabold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">Sign in</Link>
              <Link href="/signup" onClick={() => setOpen(false)} className="flex min-h-11 items-center justify-center rounded-xl bg-accent px-3 py-3 text-center font-black text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">Join</Link>
            </div>
          </nav>
        </div>
      ) : null}
    </header>
  );
}

export function PublicFooter() {
  return (
    <footer className="mt-auto bg-[var(--sabi-primary-strong)] text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.3fr_1fr_1fr] lg:px-8">
        <div>
          <BrandLockup footer />
          <p className="mt-4 max-w-md text-sm leading-6 text-white/80">A Nigerian-led marketplace and community helping people discover trusted services, share useful knowledge and build stronger local connections.</p>
          <p className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-white"><ShieldCheck size={17} aria-hidden="true"/> Trust-led by design</p>
        </div>
        <div>
          <p className="text-xs font-black uppercase tracking-[.16em] text-white/75">Explore</p>
          <div className="mt-4 grid gap-1 text-sm font-semibold text-white/85">
            <Link className="flex min-h-11 items-center rounded-lg hover:text-white" href="/marketplace">Marketplace</Link>
            <Link className="flex min-h-11 items-center rounded-lg hover:text-white" href="/community">SabiForum</Link>
            <Link className="flex min-h-11 items-center rounded-lg hover:text-white" href="/about-us">About SabiWay</Link>
            <Link className="flex min-h-11 items-center rounded-lg hover:text-white" href="/helpcenter">Help Centre</Link>
          </div>
        </div>
        <div>
          <p className="text-xs font-black uppercase tracking-[.16em] text-white/75">Legal</p>
          <div className="mt-4 grid gap-1 text-sm font-semibold text-white/85">
            <Link className="flex min-h-11 items-center rounded-lg hover:text-white" href="/privacy-policy">Privacy Policy</Link>
            <Link className="flex min-h-11 items-center rounded-lg hover:text-white" href="/terms-of-use">Terms of Use</Link>
          </div>
        </div>
      </div>
      <div className="border-t border-white/20 px-4 py-5 text-center text-xs text-white/75">© {new Date().getFullYear()} SabiWay. Built for Nigerians at home and across the diaspora.</div>
    </footer>
  );
}

export function PublicShell({ children }: { children: React.ReactNode }) {
  return <div className="flex min-h-screen flex-col bg-background text-foreground"><PublicHeader />{children}<PublicFooter /></div>;
}

export function V2ContentHero({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return (
    <section className="px-4 pt-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl overflow-hidden rounded-[var(--sabi-radius-xl)] bg-primary px-6 py-12 text-primary-foreground shadow-[var(--sabi-shadow-lg)] sm:px-10 lg:px-14 lg:py-16">
        <p className="text-xs font-black uppercase tracking-[.18em] text-white/85">{eyebrow}</p>
        <h1 className="mt-3 max-w-4xl text-3xl font-black leading-tight sm:text-4xl lg:text-5xl">{title}</h1>
        <p className="mt-5 max-w-3xl text-base leading-7 text-white/90 sm:text-lg">{description}</p>
      </div>
    </section>
  );
}
