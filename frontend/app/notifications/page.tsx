import { AppShell } from "@/app/_components/v2/AppShell";

import AllNotifications from "./AllNotifications";

export const metadata = {
  title: "Notifications | SabiWay",
  description: "Review marketplace, messaging and SabiForum activity from one SabiWay notification centre.",
};

export default function NotificationsPage() {
  return (
    <AppShell>
      <main className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
        <header>
          <p className="text-xs font-black uppercase tracking-[.14em] text-primary">Activity centre</p>
          <h1 className="mt-1 text-3xl font-black tracking-[-.03em]">Notifications</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Follow marketplace decisions, conversations, bookings and SabiForum activity without treating every alert as the same kind of event.</p>
        </header>
        <AllNotifications />
      </main>
    </AppShell>
  );
}
