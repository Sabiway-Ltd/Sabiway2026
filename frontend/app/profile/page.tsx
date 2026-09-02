import { AppShell } from "@/app/_components/v2/AppShell";
import AccountProfileClient from "./AccountProfileClient";

export const metadata = {
  title: "Your profile | SabiWay",
  description: "Manage your SabiWay identity, public profile readiness and role-specific account links.",
};

export default function ProfilePage() {
  return <AppShell><main className="mx-auto w-full max-w-6xl p-4 sm:p-6"><AccountProfileClient /></main></AppShell>;
}
