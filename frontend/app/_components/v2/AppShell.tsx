"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { BriefcaseBusiness, Home, LogOut, MessageCircle, UserRound, UsersRound } from "lucide-react";

import Button from "@/app/_components/common/Button";
import { Avatar, Skeleton } from "@/app/_components/common/DesignPrimitives";
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
    if (!hydrated) return;
    const currentUser = useAuthStore.getState().user;
    if (!currentUser && !window.localStorage.getItem("access")) {
      const next = safeInternalNext(pathname || "/home");
      window.location.href = `/login?next=${encodeURIComponent(next)}`;
      return;
    }
    if (currentUser?.onboarding_complete === false) {
      const next = safeInternalNext(pathname || "/home");
      if (currentUser.role === "client") {
        window.location.href = `/onboarding/client?next=${encodeURIComponent(next)}`;
        return;
      }
      if (currentUser.role === "professional") {
        window.location.href = `/onboarding/professional?next=${encodeURIComponent(next)}`;
      }
    }
  }, [hydrated, pathname]);

  if (!hydrated || !user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-4" aria-live="polite" aria-busy="true">
        <div className="w-full max-w-xs space-y-3 text-center">
          <Skeleton className="mx-auto h-10 w-32" />
          <p className="text-sm font-semibold text-muted-foreground">Loading your SabiWay account…</p>
        </div>
      </main>
    );
  }

  const role: AccountRole = user.role === "professional" ? "professional" : "client";
  const navigation = appNavigation[role];
  const displayName = user.full_name || "SabiWay member";

  return (
    <div className="min-h-screen bg-background text-foreground lg:grid lg:grid-cols-[240px_1fr]">
      <aside className="hidden border-r border-border bg-card lg:flex lg:min-h-screen lg:flex-col lg:p-4">
        <Link href="/home" className="flex min-h-11 items-center rounded-[var(--sabi-radius-md)] px-3" aria-label="SabiWay home">
          <Image src="/Footerlogo.svg" alt="SabiWay" width={118} height={38} priority />
        </Link>

        <nav className="mt-8 grid gap-1" aria-label={`${role === "professional" ? "Professional" : "Client"} navigation`}>
          {navigation.map(({ href, label }) => {
            const Icon = icons[label as keyof typeof icons] ?? Home;
            const active = pathname === href || (href !== "/home" && pathname.startsWith(`${href}/`));
            return (
              <Link
                key={`${href}-${label}`}
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-11 items-center gap-3 rounded-[var(--sabi-radius-md)] px-3 text-sm font-bold transition-colors ${active ? "bg-[var(--sabi-surface-selected)] text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
              >
                <Icon size={19} aria-hidden="true" />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto border-t border-border pt-4">
          <div className="flex items-center gap-3 px-3">
            <Avatar src={user.profile_pic} name={displayName} size={36} />
            <div className="min-w-0">
              <p className="truncate text-sm font-black">{displayName}</p>
              <p className="mt-0.5 text-xs font-semibold capitalize text-muted-foreground">{role}</p>
            </div>
          </div>
          <Button variant="ghost" className="mt-3 w-full justify-start" leadingIcon={<LogOut size={18} />} onClick={() => void logout()}>
            Sign out
          </Button>
        </div>
      </aside>

      <div className="min-w-0 pb-20 lg:pb-0">
        <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur lg:hidden">
          <div className="flex min-h-16 items-center justify-between px-4">
            <Link href="/home" className="flex min-h-11 items-center" aria-label="SabiWay home">
              <Image src="/Footerlogo.svg" alt="SabiWay" width={108} height={35} priority />
            </Link>
            <Link href="/profile" className="rounded-full focus-visible:outline-none" aria-label="Open profile">
              <Avatar src={user.profile_pic} name={displayName} size={40} />
            </Link>
          </div>
        </header>
        {children}
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-50 grid grid-cols-5 border-t border-border bg-card px-1 pb-[max(env(safe-area-inset-bottom),4px)] pt-1 lg:hidden" aria-label={`${role === "professional" ? "Professional" : "Client"} primary navigation`}>
        {navigation.map(({ href, label }) => {
          const Icon = icons[label as keyof typeof icons] ?? Home;
          const active = pathname === href || (href !== "/home" && pathname.startsWith(`${href}/`));
          return (
            <Link
              key={`${href}-${label}`}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`flex min-h-[56px] flex-col items-center justify-center gap-1 rounded-[var(--sabi-radius-sm)] px-1 text-[11px] font-bold transition-colors ${active ? "bg-[var(--sabi-surface-selected)] text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
            >
              <Icon size={20} aria-hidden="true" />
              <span className="max-w-full truncate">{label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
