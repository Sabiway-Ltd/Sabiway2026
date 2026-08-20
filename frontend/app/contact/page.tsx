import { BriefcaseBusiness, Handshake, HelpCircle, Mail, ShieldAlert, UsersRound } from "lucide-react";
import { MarketingPage } from "../_components/v2/PublicMarketing";

export const metadata = { title: "Contact SabiWay", description: "Find the right route for support, partnerships, professional questions and safety concerns." };

export default function Page() {
  return <MarketingPage eyebrow="Contact SabiWay" title="Start with the right route so your question reaches the right team." description="Use the Help Centre for common product questions and the appropriate contact route for support, professional, partnership or safety matters." features={[
    { title: "General support", text: "Start in the Help Centre for account, marketplace, booking, payment and community guidance.", icon: HelpCircle },
    { title: "Client questions", text: "For issues relating to a service journey, keep the relevant booking, conversation or support-case context available.", icon: UsersRound },
    { title: "Professional questions", text: "Use the professional support route for verification, listings, job responses and payout-related guidance.", icon: BriefcaseBusiness },
    { title: "Partnerships", text: "Organisations, communities and businesses interested in working with SabiWay can use the partnership route.", icon: Handshake },
    { title: "Safety concerns", text: "Urgent platform safety, abuse or suspicious behaviour should be reported through the dedicated reporting/support workflow.", icon: ShieldAlert },
    { title: "Email context", text: "When contacting support, include useful non-sensitive context and never send passwords, one-time codes or payment secrets.", icon: Mail },
  ]} primaryCta={{ href: "/helpcenter", label: "Open Help Centre" }} secondaryCta={{ href: "/trust-and-safety", label: "Trust & safety" }} />;
}
