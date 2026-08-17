import { AppShell } from "@/app/_components/v2/AppShell";

import MessagesClient from "./MessagesClient";

export const metadata = {
  title: "Messages & bookings | SabiWay",
  description: "Message safely, agree service scope, price and schedule, and manage SabiWay bookings.",
};

export default function MessagesPage() {
  return (
    <AppShell>
      <MessagesClient />
    </AppShell>
  );
}
