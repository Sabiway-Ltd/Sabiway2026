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

  // Marketplace is intentionally guest-capable. Render the useful public
  // discovery surface immediately, then upgrade to the authenticated AppShell
  // after the existing browser session has been hydrated. Authentication still
  // controls protected actions and routes; hydration must not blank public UX.
  if (!hydrated || !access) {
    return <PublicShell>{children}</PublicShell>;
  }

  return <AppShell>{children}</AppShell>;
}
