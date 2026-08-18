import { BadgeCheck, Flag, LockKeyhole, MessageCircleWarning, ShieldCheck, Star } from "lucide-react";
import { MarketingPage } from "../_components/v2/PublicMarketing";

export const metadata = { title: "Trust & Safety | SabiWay", description: "Learn how SabiWay approaches verification, reviews, reporting, protected payments and support." };

export default function Page() {
  return <MarketingPage eyebrow="Trust & safety" title="Trust is something the product should help you assess — not something you should be asked to assume." description="SabiWay combines identity signals, professional verification, reviews, reporting, protected transaction states and support processes to make risk more visible and manageable." features={[
    { title: "Verification signals", text: "Professional verification can add evidence-backed trust signals, but no badge should be treated as a guarantee of future behaviour.", icon: BadgeCheck },
    { title: "Reviews with context", text: "Reputation should help people compare previous experience while still making their own informed decision.", icon: Star },
    { title: "Protected transaction states", text: "SabiPay keeps important payment, completion, refund and dispute states visible where the feature applies.", icon: ShieldCheck },
    { title: "Report problems", text: "Users can surface unsafe, misleading or inappropriate behaviour for review rather than handling everything privately.", icon: Flag },
    { title: "Keep sensitive data limited", text: "Do not share passwords, one-time codes or unnecessary identity/payment information in messages or posts.", icon: LockKeyhole },
    { title: "Escalate when needed", text: "Support and dispute workflows give users a defined route when a transaction or interaction cannot be resolved directly.", icon: MessageCircleWarning },
  ]} primaryCta={{ href: "/helpcenter", label: "Visit Help Centre" }} secondaryCta={{ href: "/verification-info", label: "Learn about verification" }} note="Trust features reduce uncertainty; they do not remove the need for users to review scope, identity, pricing and suitability before proceeding." />;
}
