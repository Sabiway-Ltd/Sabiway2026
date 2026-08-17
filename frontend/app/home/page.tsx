"use client";

import Link from "next/link";
import { ArrowRight, BriefcaseBusiness, MessageCircle, Search, ShieldCheck, UserRound, UsersRound } from "lucide-react";

import { AppShell } from "@/app/_components/v2/AppShell";
import { useAuthStore } from "@/app/store/useAuthStore";

export default function HomePage() {
  const user = useAuthStore((state) => state.user);
  const firstName = user?.full_name?.trim().split(/\s+/)[0] || "there";
  const professional = user?.role === "professional";

  const quickActions = professional
    ? [
        { href: "/marketplace", label: "Find open jobs", text: "Browse client needs that match your skills.", icon: Search },
        { href: "/profile", label: "Strengthen your profile", text: "Keep your service information and trust details current.", icon: UserRound },
        { href: "/messages", label: "Open messages", text: "Continue conversations with potential clients.", icon: MessageCircle },
      ]
    : [
        { href: "/marketplace", label: "Find a professional", text: "Search trusted services by need and location.", icon: Search },
        { href: "/marketplace", label: "Post a job", text: "Describe what you need and receive relevant responses.", icon: BriefcaseBusiness },
        { href: "/messages", label: "Open messages", text: "Continue conversations with professionals.", icon: MessageCircle },
      ];

  return (
    <AppShell>
      <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
        <section className="overflow-hidden rounded-[var(--sabi-radius-xl)] bg-primary px-5 py-8 text-primary-foreground shadow-[var(--sabi-shadow-md)] sm:px-8 lg:px-10 lg:py-10">
          <p className="text-xs font-black uppercase tracking-[.16em] text-white/80">Your SabiWay</p>
          <div className="mt-2 grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <h1 className="text-3xl font-black tracking-tight sm:text-4xl">Welcome, {firstName}.</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-white/85 sm:text-base">{professional ? "Manage your professional presence, discover relevant jobs and keep client conversations moving." : "Discover trusted professionals, post what you need and keep every conversation in one place."}</p>
            </div>
            <Link href="/marketplace" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-accent px-4 py-3 text-sm font-black text-accent-foreground">Explore marketplace <ArrowRight size={17} aria-hidden="true" /></Link>
          </div>
        </section>

        <section className="mt-8" aria-labelledby="quick-actions-heading">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[.14em] text-primary">Start here</p>
              <h2 id="quick-actions-heading" className="mt-1 text-2xl font-black">What would you like to do?</h2>
            </div>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {quickActions.map(({ href, label, text, icon: Icon }) => (
              <Link key={label} href={href} className="group rounded-2xl border border-border bg-card p-5 shadow-[var(--sabi-shadow-sm)] transition hover:border-primary focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[var(--sabi-focus)]">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--sabi-primary-soft)] text-primary"><Icon size={21} aria-hidden="true" /></div>
                <h3 className="mt-4 text-lg font-black">{label}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-black text-primary">Open <ArrowRight size={15} className="transition group-hover:translate-x-0.5" aria-hidden="true" /></span>
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-8 grid gap-4 lg:grid-cols-2">
          <article className="rounded-2xl border border-border bg-card p-5 sm:p-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--sabi-primary-soft)] text-primary"><UsersRound size={20} aria-hidden="true" /></div>
            <h2 className="mt-4 text-xl font-black">SabiForum</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">Learn from the community, discover useful contributors and keep context around the people you interact with.</p>
            <Link href="/community" className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl px-1 text-sm font-black text-primary">Go to SabiForum <ArrowRight size={16} aria-hidden="true" /></Link>
          </article>
          <article className="rounded-2xl border border-border bg-card p-5 sm:p-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--sabi-primary-soft)] text-primary"><ShieldCheck size={20} aria-hidden="true" /></div>
            <h2 className="mt-4 text-xl font-black">Trust matters</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">Keep your profile accurate and use SabiWay conversations and verification signals when deciding who to work with.</p>
            <Link href="/profile" className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl px-1 text-sm font-black text-primary">Review profile <ArrowRight size={16} aria-hidden="true" /></Link>
          </article>
        </section>
      </main>
    </AppShell>
  );
}
