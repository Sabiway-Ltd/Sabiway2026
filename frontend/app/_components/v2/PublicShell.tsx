"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X, ArrowRight, ShieldCheck } from "lucide-react";

const navigation = [
  { href: "/marketplace", label: "Marketplace" },
  { href: "/community", label: "SabiForum" },
  { href: "/about-us", label: "About" },
  { href: "/helpcenter", label: "Help" },
];

export function PublicHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-[#dce8e1] bg-white/95 backdrop-blur">
      <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2 text-2xl font-black tracking-tight text-[#173126]" aria-label="SabiWay home">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#008753] text-sm font-black text-white">SW</span>
          SabiWay
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Primary navigation">
          {navigation.map((item) => (
            <Link key={item.href} href={item.href} className="rounded-xl px-4 py-2 text-sm font-bold text-[#4f6358] transition hover:bg-[#eef7f2] hover:text-[#008753]">
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <Link href="/login" className="rounded-xl px-4 py-2 text-sm font-extrabold text-[#173126]">Sign in</Link>
          <Link href="/signup" className="inline-flex items-center gap-2 rounded-xl bg-[#FFB800] px-4 py-2.5 text-sm font-black text-[#173126] shadow-sm transition hover:-translate-y-0.5">
            Join SabiWay <ArrowRight size={16} />
          </Link>
        </div>

        <button onClick={() => setOpen((value) => !value)} className="rounded-xl border border-[#dce8e1] p-2 text-[#173126] md:hidden" aria-label="Toggle navigation" aria-expanded={open}>
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {open ? (
        <div className="border-t border-[#e6eee9] bg-white px-4 py-4 md:hidden">
          <nav className="mx-auto grid max-w-7xl gap-1" aria-label="Mobile navigation">
            {navigation.map((item) => (
              <Link key={item.href} href={item.href} onClick={() => setOpen(false)} className="rounded-xl px-3 py-3 font-bold text-[#42564b] hover:bg-[#eef7f2]">{item.label}</Link>
            ))}
            <div className="mt-2 grid grid-cols-2 gap-2 border-t border-[#edf2ef] pt-3">
              <Link href="/login" onClick={() => setOpen(false)} className="rounded-xl border border-[#cddbd3] px-3 py-3 text-center font-extrabold">Sign in</Link>
              <Link href="/signup" onClick={() => setOpen(false)} className="rounded-xl bg-[#FFB800] px-3 py-3 text-center font-black text-[#173126]">Join</Link>
            </div>
          </nav>
        </div>
      ) : null}
    </header>
  );
}

export function PublicFooter() {
  return (
    <footer className="mt-auto bg-[#062e20] text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.3fr_1fr_1fr] lg:px-8">
        <div>
          <div className="flex items-center gap-2 text-2xl font-black"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FFB800] text-xs font-black text-[#173126]">SW</span>SabiWay</div>
          <p className="mt-4 max-w-md text-sm leading-6 text-white/70">A Nigerian-led marketplace and community helping people discover trusted services, share useful knowledge and build stronger local connections.</p>
          <p className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-[#bdebd6]"><ShieldCheck size={17}/> Trust-led by design</p>
        </div>
        <div>
          <p className="text-xs font-black uppercase tracking-[.16em] text-[#8ccdb0]">Explore</p>
          <div className="mt-4 grid gap-3 text-sm font-semibold text-white/75">
            <Link href="/marketplace">Marketplace</Link><Link href="/community">SabiForum</Link><Link href="/about-us">About SabiWay</Link><Link href="/helpcenter">Help Centre</Link>
          </div>
        </div>
        <div>
          <p className="text-xs font-black uppercase tracking-[.16em] text-[#8ccdb0]">Legal</p>
          <div className="mt-4 grid gap-3 text-sm font-semibold text-white/75"><Link href="/privacy-policy">Privacy Policy</Link><Link href="/terms-of-use">Terms of Use</Link></div>
        </div>
      </div>
      <div className="border-t border-white/10 px-4 py-5 text-center text-xs text-white/55">© {new Date().getFullYear()} SabiWay. Built for Nigerians at home and across the diaspora.</div>
    </footer>
  );
}

export function PublicShell({ children }: { children: React.ReactNode }) {
  return <div className="flex min-h-screen flex-col bg-[#f7faf8] text-[#173126]"><PublicHeader />{children}<PublicFooter /></div>;
}

export function V2ContentHero({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return (
    <section className="px-4 pt-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl overflow-hidden rounded-[2rem] bg-[#008753] px-6 py-12 text-white shadow-[0_20px_60px_rgba(0,135,83,.16)] sm:px-10 lg:px-14 lg:py-16">
        <p className="text-xs font-black uppercase tracking-[.18em] text-[#c8f1dd]">{eyebrow}</p>
        <h1 className="mt-3 max-w-4xl text-3xl font-black leading-tight sm:text-4xl lg:text-5xl">{title}</h1>
        <p className="mt-5 max-w-3xl text-base leading-7 text-white/82 sm:text-lg">{description}</p>
      </div>
    </section>
  );
}
