import { AppShell } from "@/app/_components/v2/AppShell";

import SabiPayClient from "./SabiPayClient";

export const metadata = {
  title: "SabiPay escrow | SabiWay",
  description: "Fund Nigerian service bookings safely, track escrow state and manage SabiWay transaction outcomes.",
};

export default function SabiPayPage() {
  return (
    <AppShell>
      <SabiPayClient />
    </AppShell>
  );
}
