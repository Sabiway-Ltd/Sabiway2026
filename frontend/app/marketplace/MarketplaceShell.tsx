"use client";

import { useEffect, useState } from "react";

import { AppShell } from "@/app/_components/v2/AppShell";
import { PublicShell } from "@/app/_components/v2/PublicShell";
import { useAuthStore } from "@/app/store/useAuthStore";

export function MarketplaceShell({ children }: { children: React.ReactNode }) {
  const access = useAuthStore((state) => state.access);
  const loadUserFromStorage = useAuthStore((state) => state.loadUserFromStorage);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    loadUserFromStorage();
    setHydrated(true);
  }, [loadUserFromStorage]);

  if (!hydrated) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-4" aria-live="polite">
        <p className="text-sm font-semibold text-muted-foreground">Loading SabiWay marketplace…</p>
      </main>
    );
  }

  return access ? <AppShell>{children}</AppShell> : <PublicShell>{children}</PublicShell>;
}
