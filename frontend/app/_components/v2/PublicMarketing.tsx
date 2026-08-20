import Link from "next/link";
import type { LucideIcon } from "lucide-react";

import { PublicShell, V2ContentHero } from "./PublicShell";

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
  secondaryCta = { href: "/marketplace", label: "Explore marketplace" },
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
        <V2ContentHero eyebrow={eyebrow} title={title} description={description} />

        <section className="px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {features.map(({ title: featureTitle, text, icon: Icon }) => (
                <article key={featureTitle} className="rounded-3xl border border-border bg-card p-6 shadow-sm">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Icon size={22} aria-hidden="true" />
                  </div>
                  <h2 className="mt-5 text-xl font-black tracking-[-.02em] text-foreground">{featureTitle}</h2>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {steps?.length ? (
          <section className="bg-muted/60 px-4 py-14 sm:px-6 lg:px-8 lg:py-18">
            <div className="mx-auto max-w-7xl">
              <p className="text-xs font-black uppercase tracking-[.18em] text-primary">What happens next</p>
              <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {steps.map((step, index) => (
                  <article key={step.title} className="rounded-3xl bg-card p-6 ring-1 ring-border">
                    <span className="inline-flex h-9 min-w-9 items-center justify-center rounded-full bg-primary px-3 text-sm font-black text-primary-foreground">{index + 1}</span>
                    <h3 className="mt-4 text-lg font-black">{step.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{step.text}</p>
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
              <h2 className="mt-2 text-3xl font-black tracking-[-.03em]">Move from browsing to action with confidence.</h2>
              {note ? <p className="mt-3 text-sm leading-6 text-white/70">{note}</p> : null}
            </div>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row lg:mt-0 lg:shrink-0">
              <Link href={primaryCta.href} className="inline-flex min-h-12 items-center justify-center rounded-xl bg-accent px-5 font-black text-accent-foreground">{primaryCta.label}</Link>
              <Link href={secondaryCta.href} className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/20 px-5 font-black text-white">{secondaryCta.label}</Link>
            </div>
          </div>
        </section>
      </main>
    </PublicShell>
  );
}
