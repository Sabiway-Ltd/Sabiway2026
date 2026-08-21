"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Bell, BriefcaseBusiness, CalendarDays, LogOut, MessageCircle, ShieldCheck, UserRound, UsersRound, WalletCards } from "lucide-react";

import Button from "@/app/_components/common/Button";
import { InlineAlert, StatePanel, StatusBadge } from "@/app/_components/common/DesignPrimitives";
import { clearDemoSession, createDemoSession, demoModeEnabled, type DemoRole, type DemoScenario, writeDemoSession } from "./session";
import { getDemoWorkspace, type DemoCard } from "./fixtures";

const sections = [
  ["Work", BriefcaseBusiness, "primary"],
  ["Messages", MessageCircle, "messages"],
  ["Bookings", CalendarDays, "bookings"],
  ["Payments", WalletCards, "payments"],
  ["Community", UsersRound, "community"],
  ["Notifications", Bell, "notifications"],
  ["Trust", ShieldCheck, "trust"],
] as const;

function CardList({ cards, emptyText }: { cards: DemoCard[]; emptyText: string }) {
  if (!cards.length) return <StatePanel title={emptyText} description="This is a deterministic empty state for product inspection." tone="empty" />;
  return (
    <div className="grid gap-3">
      {cards.map((card) => (
        <article key={card.id} className="rounded-[var(--sabi-radius-lg)] border border-border bg-card p-4 shadow-[var(--sabi-shadow-sm)]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-black">{card.title}</h3>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">{card.description}</p>
            </div>
            <StatusBadge tone={card.status === "attention" ? "warning" : card.status === "complete" ? "success" : "neutral"}>{card.status}</StatusBadge>
          </div>
          <p className="mt-3 text-xs font-bold text-muted-foreground">{card.meta}</p>
        </article>
      ))}
    </div>
  );
}

export function DemoWorkspace({ role }: { role: DemoRole }) {
  const enabled = demoModeEnabled();
  const [scenario, setScenario] = useState<DemoScenario>("default");
  const [activeSection, setActiveSection] = useState<(typeof sections)[number][2]>("primary");
  const workspace = useMemo(() => getDemoWorkspace(role, scenario), [role, scenario]);

  useEffect(() => {
    if (!enabled) return;
    writeDemoSession(createDemoSession(role, scenario));
  }, [enabled, role, scenario]);

  if (!enabled) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-4">
        <InlineAlert tone="warning" className="max-w-xl">
          <p className="font-black">Controlled demo mode is disabled.</p>
          <p className="mt-1 font-normal">This route only works when the explicit frontend demo flag is enabled for a review environment.</p>
          <Link href="/" className="mt-4 inline-flex font-bold text-primary underline">Return to SabiWay</Link>
        </InlineAlert>
      </main>
    );
  }

  const activeCards = workspace[activeSection];
  const roleLabel = role === "professional" ? "Professional" : "Client";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="sticky top-0 z-50 border-b border-[var(--sabi-warning)]/50 bg-[var(--sabi-warning-soft)] px-4 py-2 text-center text-xs font-black">
        SabiWay CONTROLLED DEMO · invented fixture data · not a production account
      </div>

      <div className="mx-auto grid max-w-7xl lg:grid-cols-[240px_1fr]">
        <aside className="border-b border-border bg-card p-4 lg:min-h-[calc(100vh-33px)] lg:border-b-0 lg:border-r">
          <div className="flex items-center gap-3 rounded-[var(--sabi-radius-lg)] bg-muted p-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-primary-foreground"><UserRound size={20} aria-hidden="true" /></span>
            <div className="min-w-0">
              <p className="truncate font-black">{workspace.persona.name}</p>
              <p className="text-xs font-bold text-muted-foreground">{roleLabel} demo</p>
            </div>
          </div>

          <nav className="mt-5 grid grid-cols-4 gap-1 sm:grid-cols-7 lg:grid-cols-1" aria-label={`${roleLabel} demo navigation`}>
            {sections.map(([label, Icon, key]) => (
              <button key={key} type="button" onClick={() => setActiveSection(key)} className={`flex min-h-12 items-center justify-center gap-1 rounded-[var(--sabi-radius-md)] px-1 text-[11px] font-bold sm:text-xs lg:justify-start lg:gap-2 lg:px-2 lg:text-sm ${activeSection === key ? "bg-[var(--sabi-surface-selected)] text-primary" : "text-muted-foreground hover:bg-muted"}`}>
                <Icon size={18} aria-hidden="true" /><span className="truncate">{label}</span>
              </button>
            ))}
          </nav>

          <div className="mt-5 border-t border-border pt-4">
            <p className="text-xs font-black uppercase tracking-[.12em] text-muted-foreground">State simulator</p>
            <div className="mt-2 grid grid-cols-3 gap-1 lg:grid-cols-1">
              {(["default", "empty", "error"] as DemoScenario[]).map((value) => (
                <button key={value} type="button" onClick={() => setScenario(value)} className={`min-h-10 rounded-[var(--sabi-radius-md)] px-2 text-xs font-bold capitalize ${scenario === value ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"}`}>{value}</button>
              ))}
            </div>
          </div>

          <Button variant="ghost" className="mt-5 w-full justify-start" leadingIcon={<LogOut size={17} />} onClick={() => { clearDemoSession(); window.location.href = "/demo"; }}>
            Exit demo persona
          </Button>
        </aside>

        <main className="min-w-0 p-4 sm:p-6 lg:p-8">
          <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-black text-primary">{workspace.persona.username} · {workspace.persona.location}</p>
              <h1 className="mt-2 text-3xl font-black tracking-[-.03em] sm:text-4xl">{workspace.persona.headline}</h1>
            </div>
            <StatusBadge tone={scenario === "error" ? "warning" : "info"}>Scenario: {scenario}</StatusBadge>
          </header>

          {scenario === "error" ? (
            <InlineAlert tone="warning" className="mt-6">
              <div className="flex gap-2"><AlertTriangle size={18} aria-hidden="true" /><div><p className="font-black">Simulated service degradation</p><p className="mt-1 font-normal">No production API failed. This state exists to inspect recovery UX deterministically.</p></div></div>
            </InlineAlert>
          ) : null}

          <section className="mt-7 grid gap-3 sm:grid-cols-3" aria-label="Demo metrics">
            {workspace.metrics.map((metric) => (
              <div key={metric.label} className="rounded-[var(--sabi-radius-lg)] border border-border bg-card p-4">
                <p className="text-xs font-black uppercase tracking-[.1em] text-muted-foreground">{metric.label}</p>
                <p className="mt-2 text-3xl font-black">{metric.value}</p>
                <p className="mt-1 text-xs font-semibold text-muted-foreground">{metric.note}</p>
              </div>
            ))}
          </section>

          <section className="mt-8">
            <div className="mb-4 flex items-center justify-between gap-4"><h2 className="text-xl font-black">{sections.find(([, , key]) => key === activeSection)?.[0]}</h2><p className="text-xs font-bold text-muted-foreground">Deterministic fixture view</p></div>
            <CardList cards={activeCards} emptyText={`No ${activeSection} in this demo state`} />
          </section>
        </main>
      </div>
    </div>
  );
}
