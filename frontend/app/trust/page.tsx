import type { Metadata } from "next";

import TrustClient from "./TrustClient";

export const metadata: Metadata = {
  title: "Trust Centre | SabiWay",
  description: "Manage disputes, post-service reviews, support cases and notification recovery on SabiWay.",
};

export default function TrustPage() {
  return <TrustClient />;
}
