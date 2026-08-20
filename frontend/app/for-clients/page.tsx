import { BadgeCheck, MapPin, MessageCircleMore, Search, ShieldCheck, Star } from "lucide-react";
import { MarketingPage } from "../_components/v2/PublicMarketing";

export const metadata = { title: "For clients | SabiWay", description: "Find professionals, post jobs, compare trust signals and manage service work through SabiWay." };

export default function Page() {
  return <MarketingPage eyebrow="For clients" title="Find the help you need without relying on guesswork." description="SabiWay gives clients a clearer way to discover professionals, compare useful trust signals and keep the job journey in one place." features={[
    { title: "Search by need", text: "Browse services and skills instead of depending only on personal referrals or scattered social posts.", icon: Search },
    { title: "Use location context", text: "Narrow discovery around where the service is needed and what is realistically available.", icon: MapPin },
    { title: "Compare profiles", text: "Review experience, service information, ratings and verification signals before deciding.", icon: BadgeCheck },
    { title: "Keep conversations together", text: "Discuss the job inside SabiWay so important context is not lost across multiple apps.", icon: MessageCircleMore },
    { title: "Understand payment status", text: "Where SabiPay applies, payment, completion and dispute states stay visible to both sides.", icon: ShieldCheck },
    { title: "Leave useful reviews", text: "Share feedback after completed work and help future clients make better choices.", icon: Star },
  ]} primaryCta={{ href: "/signup", label: "Create a client account" }} secondaryCta={{ href: "/marketplace", label: "Browse services" }} />;
}
