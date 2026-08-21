"use client";

import Link from "next/link";
import { BriefcaseBusiness, ShieldCheck, UserRound } from "lucide-react";

import { InlineAlert } from "@/app/_components/common/DesignPrimitives";
import { demoModeEnabled } from "./session";

export default function DemoEntryPage() {
  const enabled = demoModeEnabled();

  return (
    <main className="min-h-screen bg-background px-4 py-12 text-foreground sm:px-6">
      <div className="mx-auto max-w-5xl">
        <p className="text-sm font-black text-primary">SabiWay controlled review environment</p>
        <h1 className="mt-2 max-w-3xl text-4xl font-black tracking-[-.04em] sm:text-5xl">Inspect Client and Professional product states without pretending to be production users.</h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">Demo sessions use deterministic invented fixtures. They do not issue access tokens, call production authentication, create backend users or modify real marketplace records.</p>

        {!enabled ? (
          <InlineAlert tone="warning" className="mt-8">
            <p className="font-black">Demo mode is currently disabled.</p>
            <p className="mt-1 font-normal">Enable the explicit review-environment flag before using these personas.</p>
          </InlineAlert>
        ) : (
          <div className="mt-9 grid gap-4 md:grid-cols-2">
            <Link href="/demo/client" className="rounded-[var(--sabi-radius-xl)] border border-border bg-card p-6 shadow-[var(--sabi-shadow-sm)] transition hover:-translate-y-0.5 hover:shadow-[var(--sabi-shadow-md)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--sabi-primary-soft)] text-primary"><UserRound aria-hidden="true" /></span>
              <h2 className="mt-5 text-2xl font-black">Enter Client Demo</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">Inspect jobs, service conversations, bookings, notifications, trust and empty/error states from the Client perspective.</p>
            </Link>

            <Link href="/demo/professional" className="rounded-[var(--sabi-radius-xl)] border border-border bg-card p-6 shadow-[var(--sabi-shadow-sm)] transition hover:-translate-y-0.5 hover:shadow-[var(--sabi-shadow-md)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--sabi-primary-soft)] text-primary"><BriefcaseBusiness aria-hidden="true" /></span>
              <h2 className="mt-5 text-2xl font-black">Enter Professional Demo</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">Inspect opportunities, service presence, messaging, bookings, earnings/trust signals and deterministic recovery states.</p>
            </Link>
          </div>
        )}

        <div className="mt-8 flex gap-3 rounded-[var(--sabi-radius-lg)] border border-border bg-muted p-4 text-sm leading-6 text-muted-foreground">
          <ShieldCheck className="mt-0.5 shrink-0 text-primary" size={20} aria-hidden="true" />
          <p><strong className="text-foreground">Isolation rule:</strong> demo mode is a product-inspection surface, not authentication. Protected production routes continue to require real server-authorized sessions.</p>
        </div>
      </div>
    </main>
  );
}
