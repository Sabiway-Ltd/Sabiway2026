"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { BriefcaseBusiness, Home, LogOut, MessageCircle, UserRound, UsersRound } from "lucide-react";

import { appNavigation, safeInternalNext, type AccountRole } from "@/app/config/accessPolicy";
import { useAuthStore } from "@/app/store/useAuthStore";

const icons = {
  Home,
  "Find services": BriefcaseBusiness,
  Opportunities: BriefcaseBusiness,
  Messages: MessageCircle,
  SabiForum: UsersRound,
  Profile: UserRound,
};

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout, loadUserFromStorage } = useAuthStore();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    loadUserFromStorage();
    setHydrated(true);
  }, [loadUserFromStorage]);

  useEffect(() => {
    if (hydrated && !useAuthStore.getState().user && !window.localStorage.getItem("access")) {
      const next = safeInternalNext(pathname || "/home");
      window.location.href = `/login?next=${encodeURIComponent(next)}`;
    }
  }, [hydrated, pathname]);

  if (!hydrated || !user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-4" aria-live="polite">
        <p className="text-sm font-semibold text-muted-foreground">Loading your SabiWay account…</p>
      </main>
    );
  }

  const role: AccountRole = user.role === "professional" ? "professional" : "client";
  const navigation = appNavigation[role];

  return (
    <div className="min-h-screen bg-background text-foreground lg:grid lg:grid-cols-[240px_1fr]">
      <aside className="hidden border-r border-border bg-card lg:flex lg:min-h-screen lg:flex-col lg:p-4">
        <Link href="/home" className="flex min-h-11 items-center gap-2 rounded-xl px-3 text-xl font-black" aria-label="SabiWay home">
          SabiWay
        </Link>
        <nav className="mt-8 grid gap-1" aria-label={`${role === "professional" ? "Professional" : "Client"} navigation`}>
          {navigation.map(({ href, label }) => {
            const Icon = icons[label as keyof typeof icons] ?? Home;
            const active = pathname === href || (href !== "/home" && pathname.startsWith(`${href}/`));
            return (
              <Link key={`${href}-${label}`} href={href} aria-current={active ? "page" : undefined} className={`flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-bold transition ${active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}>
                <Icon size={19} aria-hidden="true" />{label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto border-t border-border pt-4">
          <p className="truncate px-3 text-sm font-black">{user.full_name || "SabiWay member"}</p>
          <p className="mt-1 px-3 text-xs font-semibold capitalize text-muted-foreground">{role}</p>
          <button type="button" onClick={() => void logout()} className="mt-3 flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-sm font-bold text-muted-foreground hover:bg-muted hover:text-foreground">
            <LogOut size={18} aria-hidden="true" />Sign out
          </button>
        </div>
      </aside>

      <div className="min-w-0 pb-20 lg:pb-0">
        <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur lg:hidden">
          <div className="flex min-h-16 items-center justify-between px-4">
            <Link href="/home" className="text-xl font-black">SabiWay</Link>
            <Link href="/profile" className="rounded-full bg-muted px-3 py-2 text-sm font-black" aria-label="Open profile">{(user.full_name || "S").slice(0, 1).toUpperCase()}</Link>
          </div>
        </header>
        {children}
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-50 grid grid-cols-5 border-t border-border bg-card px-1 pb-[max(env(safe-area-inset-bottom),4px)] pt-1 lg:hidden" aria-label={`${role === "professional" ? "Professional" : "Client"} primary navigation`}>
        {navigation.map(({ href, label }) => {
          const Icon = icons[label as keyof typeof icons] ?? Home;
          const active = pathname === href || (href !== "/home" && pathname.startsWith(`${href}/`));
          return (
            <Link key={`${href}-${label}`} href={href} aria-current={active ? "page" : undefined} className={`flex min-h-[56px] flex-col items-center justify-center gap-1 rounded-lg px-1 text-[11px] font-bold ${active ? "text-primary" : "text-muted-foreground"}`}>
              <Icon size={20} aria-hidden="true" />
              <span className="max-w-full truncate">{label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
