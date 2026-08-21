"use client";

import Link from "next/link";
import { ShieldAlert } from "lucide-react";

import { useAuthStore } from "@/app/store/useAuthStore";
import VerificationClient from "./VerificationClient";

export default function VerificationAccessGate() {
  const user = useAuthStore((state) => state.user);

  if (user?.role !== "professional") {
    return (
      <main className="mx-auto flex w-full max-w-3xl items-center px-4 py-16 sm:px-6">
        <section className="w-full rounded-[var(--sabi-radius-xl)] border border-border bg-card p-6 text-center shadow-[var(--sabi-shadow-sm)] sm:p-10" role="alert">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[var(--sabi-surface-selected)] text-primary">
            <ShieldAlert aria-hidden="true" />
          </div>
          <h1 className="mt-4 text-2xl font-black">Professional account required</h1>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
            Verification belongs to the Professional journey. Client accounts can continue finding services, posting work and managing completed-work reviews.
          </p>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/home" className="inline-flex min-h-11 items-center justify-center rounded-[var(--sabi-radius-md)] bg-primary px-5 font-black text-primary-foreground">
              Return home
            </Link>
            <Link href="/for-professionals" className="inline-flex min-h-11 items-center justify-center rounded-[var(--sabi-radius-md)] border border-border px-5 font-black">
              Learn about Professional accounts
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return <VerificationClient />;
}
