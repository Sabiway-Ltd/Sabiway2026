import { BadgeCheck, Globe2, MapPin, MessageCircleMore, Search, ShieldCheck } from "lucide-react";
import { MarketingPage } from "../_components/v2/PublicMarketing";

export const metadata = { title: "For clients | SabiWay", description: "Find Professionals near the service location or search another place when the work is elsewhere." };

export default function Page() {
  return <MarketingPage eyebrow="For clients" title="Find the right Professional for where the work needs to happen." description="SabiWay separates your account location from the service location. Search nearby when the work is local, or deliberately choose another city or country when it is not." features={[
    { title: "Start with what you need", text: "Browse services publicly instead of depending only on forwarded numbers, informal referrals or scattered posts.", icon: Search },
    { title: "Choose the service location", text: "Search the place where the work needs to happen. Your own location does not lock the marketplace.", icon: MapPin },
    { title: "Search another country when needed", text: "A UK Client can search Nigeria, a Nigeria Client can search the UK, and the same model works for other countries where supply exists.", icon: Globe2 },
    { title: "Compare Professional context", text: "Review service information, reputation and verification signals before deciding who to contact.", icon: BadgeCheck },
    { title: "Keep conversations together", text: "Once you sign in to act, keep the service conversation and job context connected instead of splitting it across channels.", icon: MessageCircleMore },
    { title: "Understand transaction support", text: "Marketplace availability and SabiPay availability are separate. Payment is only offered where the relevant market and currency rails are enabled.", icon: ShieldCheck },
  ]} primaryCta={{ href: "/services", label: "Browse services publicly" }} secondaryCta={{ href: "/locations", label: "Explore locations" }} note="You do not need an account to understand the Client journey. Sign in is reserved for actions such as messaging, posting, booking and payment." />;
}
