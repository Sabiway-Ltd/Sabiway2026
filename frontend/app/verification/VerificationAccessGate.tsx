"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ShieldAlert } from "lucide-react";

import { PublicShell } from "@/app/_components/v2/PublicShell";
import { readBrowserSession } from "@/app/auth/session";
import VerificationClient from "./VerificationClient";

export default function VerificationAccessGate() {
  const [role, setRole] = useState<string | null>(null);
  const [resolved, setResolved] = useState(false);

  useEffect(() => {
    const { user } = readBrowserSession();
    setRole(typeof user?.role === "string" ? user.role : null);
    setResolved(true);
  }, []);

  if (!resolved) {
    return <main className="flex min-h-screen items-center justify-center bg-background px-4" aria-live="polite"><p className="text-sm font-semibold text-muted-foreground">Checking account access…</p></main>;
  }

  if (role !== "professional") {
    return (
      <PublicShell>
        <main className="mx-auto flex w-full max-w-3xl flex-1 items-center px-4 py-16 sm:px-6">
          <section className="w-full rounded-[var(--sabi-radius-xl)] border border-border bg-card p-6 text-center shadow-[var(--sabi-shadow-sm)] sm:p-10" role="alert">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[var(--sabi-primary-soft,#e8f7f0)] text-primary"><ShieldAlert aria-hidden="true" /></div>
            <h1 className="mt-4 text-2xl font-black">Professional account required</h1>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-muted-foreground">Verification is part of the Professional journey. Your current Client account can continue using SabiWay to find services, post work and manage conversations.</p>
            <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
              <Link href="/home" className="inline-flex min-h-11 items-center justify-center rounded-xl bg-primary px-5 font-black text-primary-foreground">Return to Client home</Link>
              <Link href="/for-professionals" className="inline-flex min-h-11 items-center justify-center rounded-xl border border-border px-5 font-black">Learn about Professional accounts</Link>
            </div>
          </section>
        </main>
      </PublicShell>
    );
  }

  return <VerificationClient />;
}
