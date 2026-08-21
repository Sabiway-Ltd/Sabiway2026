import { AppShell } from "@/app/_components/v2/AppShell";
import VerificationAccessGate from "./VerificationAccessGate";

export const metadata = {
  title: "Professional verification | SabiWay",
  description: "Submit identity and professional evidence, track manual review and manage SabiWay Professional verification.",
};

export default function VerificationPage() {
  return (
    <AppShell>
      <VerificationAccessGate />
    </AppShell>
  );
}
