import Link from "next/link";
import { ArrowRight, CheckCircle2, Globe2, ShieldCheck } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { PublicShell } from "./PublicShell";

export type MarketingFeature = {
  title: string;
  text: string;
  icon: LucideIcon;
};

export function MarketingPage({
  eyebrow,
  title,
  description,
  features,
  steps,
  primaryCta = { href: "/signup", label: "Join SabiWay" },
  secondaryCta = { href: "/services", label: "Browse services" },
  note,
}: {
  eyebrow: string;
  title: string;
  description: string;
  features: MarketingFeature[];
  steps?: { title: string; text: string }[];
  primaryCta?: { href: string; label: string };
  secondaryCta?: { href: string; label: string };
  note?: string;
}) {
  return (
    <PublicShell>
      <main className="pb-16">
        <section className="overflow-hidden bg-[#f6faf8] px-4 pb-12 pt-8 sm:px-6 sm:pb-16 sm:pt-12 lg:px-8 lg:pb-20">
          <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1.2fr_.8fr] lg:items-center">
            <div>
              <p className="text-xs font-black uppercase tracking-[.18em] text-[#008753]">{eyebrow}</p>
              <h1 className="mt-4 max-w-4xl text-4xl font-black leading-[1.04] tracking-[-.04em] text-[#173126] sm:text-5xl lg:text-6xl">{title}</h1>
              <p className="mt-5 max-w-3xl text-base leading-7 text-[#607168] sm:text-lg">{description}</p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Link href={primaryCta.href} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#008753] px-5 font-black text-white shadow-[0_12px_30px_rgba(0,135,83,.18)]">{primaryCta.label}<ArrowRight size={17} aria-hidden="true"/></Link>
                <Link href={secondaryCta.href} className="inline-flex min-h-12 items-center justify-center rounded-xl border border-[#bfd4c8] bg-white px-5 font-black text-[#173126]">{secondaryCta.label}</Link>
              </div>
            </div>
            <aside className="rounded-[2rem] bg-[#073522] p-6 text-white shadow-[0_24px_70px_rgba(7,53,34,.16)] sm:p-8">
              <p className="text-xs font-black uppercase tracking-[.17em] text-[#8dd1b3]">The SabiWay promise</p>
              <h2 className="mt-3 text-2xl font-black tracking-[-.02em]">Useful context before commitment.</h2>
              <div className="mt-6 grid gap-4 text-sm leading-6 text-white/80">
                <p className="flex gap-3"><ShieldCheck className="mt-0.5 shrink-0 text-[#65d9a0]" size={19} aria-hidden="true"/>Trust, verification and support are explained before you sign up.</p>
                <p className="flex gap-3"><Globe2 className="mt-0.5 shrink-0 text-[#65d9a0]" size={19} aria-hidden="true"/>Built to connect people in Nigeria with Nigerians and communities across the diaspora.</p>
                <p className="flex gap-3"><CheckCircle2 className="mt-0.5 shrink-0 text-[#65d9a0]" size={19} aria-hidden="true"/>Public information pages stay public; sign-in is reserved for actions that genuinely need an account.</p>
              </div>
            </aside>
          </div>
        </section>

        <section className="px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
          <div className="mx-auto max-w-7xl">
            <div className="mb-7 max-w-2xl"><p className="text-xs font-black uppercase tracking-[.17em] text-[#008753]">What this means for you</p><h2 className="mt-2 text-3xl font-black tracking-[-.03em] text-[#173126]">The detail you need, without making you dig for it.</h2></div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {features.map(({ title: featureTitle, text, icon: Icon }) => (
                <article key={featureTitle} className="rounded-3xl border border-[#dce8e1] bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-[#9bcdb4] motion-reduce:transform-none">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#e8f7f0] text-[#008753]"><Icon size={22} aria-hidden="true" /></div>
                  <h3 className="mt-5 text-xl font-black tracking-[-.02em] text-[#173126]">{featureTitle}</h3>
                  <p className="mt-2 text-sm leading-6 text-[#68786f]">{text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {steps?.length ? (
          <section className="bg-[#f4f8f6] px-4 py-14 sm:px-6 lg:px-8 lg:py-18">
            <div className="mx-auto max-w-7xl">
              <p className="text-xs font-black uppercase tracking-[.18em] text-[#008753]">What happens next</p>
              <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {steps.map((step, index) => (
                  <article key={step.title} className="rounded-3xl bg-white p-6 ring-1 ring-[#dce8e1]">
                    <span className="inline-flex h-9 min-w-9 items-center justify-center rounded-full bg-[#008753] px-3 text-sm font-black text-white">{index + 1}</span>
                    <h3 className="mt-4 text-lg font-black text-[#173126]">{step.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-[#68786f]">{step.text}</p>
                  </article>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        <section className="px-4 py-14 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl overflow-hidden rounded-[2rem] bg-[#073522] px-6 py-10 text-white sm:px-10 lg:flex lg:items-center lg:justify-between lg:gap-8 lg:px-12">
            <div className="max-w-2xl">
              <p className="text-xs font-black uppercase tracking-[.18em] text-[#8dd1b3]">Ready when you are</p>
              <h2 className="mt-2 text-3xl font-black tracking-[-.03em]">Take the next step with the right context.</h2>
              <p className="mt-3 text-sm leading-6 text-white/70">{note ?? "Explore publicly first. Create an account only when you are ready to message, post, book, pay or participate."}</p>
            </div>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row lg:mt-0 lg:shrink-0">
              <Link href={primaryCta.href} className="inline-flex min-h-12 items-center justify-center rounded-xl bg-[#FFB800] px-5 font-black text-[#173126]">{primaryCta.label}</Link>
              <Link href={secondaryCta.href} className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/20 px-5 font-black text-white">{secondaryCta.label}</Link>
            </div>
          </div>
        </section>
      </main>
    </PublicShell>
  );
}
