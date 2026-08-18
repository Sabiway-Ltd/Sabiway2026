import { Accessibility, BriefcaseBusiness, Code2, HeartHandshake, Lightbulb, ShieldCheck } from "lucide-react";
import { MarketingPage } from "../_components/v2/PublicMarketing";

export const metadata = { title: "Careers at SabiWay", description: "Learn how SabiWay approaches future roles and contributions." };

export default function Page() {
  return <MarketingPage eyebrow="Careers" title="Build practical infrastructure for trusted services and community." description="SabiWay is still developing its product and operating model. This page explains the kinds of contribution we value without pretending that roles are open when they are not." features={[
    { title: "Product thinking", text: "People who can simplify complicated journeys and make trade-offs around real user needs.", icon: Lightbulb },
    { title: "Engineering", text: "Developers who care about reliability, accessibility, data safety and preserving working behaviour.", icon: Code2 },
    { title: "Marketplace operations", text: "People who understand service quality, moderation, support and operational trust.", icon: BriefcaseBusiness },
    { title: "Community", text: "Contributors who can build useful, respectful participation rather than vanity engagement.", icon: HeartHandshake },
    { title: "Accessibility", text: "People who design for a broad range of devices, abilities and digital confidence levels.", icon: Accessibility },
    { title: "Trust mindset", text: "People who treat user safety and privacy as product requirements, not afterthoughts.", icon: ShieldCheck },
  ]} primaryCta={{ href: "/contact", label: "Contact SabiWay" }} secondaryCta={{ href: "/about-us", label: "Learn about the company" }} note="No role should be assumed open unless SabiWay publishes a specific vacancy or application route." />;
}
