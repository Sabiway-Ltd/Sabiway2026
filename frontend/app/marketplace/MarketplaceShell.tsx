"use client";

import { useEffect, useState } from "react";

import { AppShell } from "@/app/_components/v2/AppShell";
import { PublicShell } from "@/app/_components/v2/PublicShell";

export function MarketplaceShell({ children }: { children: React.ReactNode }) {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    setAuthenticated(Boolean(window.localStorage.getItem("access")));
  }, []);

  if (authenticated === null) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-4" aria-live="polite">
        <p className="text-sm font-semibold text-muted-foreground">Loading SabiWay marketplace…</p>
      </main>
    );
  }

  return authenticated ? <AppShell>{children}</AppShell> : <PublicShell>{children}</PublicShell>;
}
