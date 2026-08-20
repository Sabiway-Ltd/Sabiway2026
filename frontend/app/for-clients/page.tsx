import { BadgeCheck, Globe2, MapPin, MessageCircleMore, Search, ShieldCheck } from "lucide-react";
import { MarketingPage } from "../_components/v2/PublicMarketing";

export const metadata = { title: "For clients | SabiWay", description: "Find Nigerian professionals with more context whether you are in Nigeria or arranging something from abroad." };

export default function Page() {
  return <MarketingPage eyebrow="For clients" title="Find the help you need — whether you are nearby or arranging it from abroad." description="SabiWay gives clients in Nigeria and Nigerians across the diaspora a clearer way to discover professionals, compare useful trust signals and understand the service journey before committing." features={[
    { title: "Start with the real need", text: "Browse services publicly instead of depending only on a forwarded number, personal referral or scattered social post.", icon: Search },
    { title: "Use location context", text: "See where the service is needed and understand Nigeria-first availability before moving forward.", icon: MapPin },
    { title: "Coordinate from abroad", text: "If you live outside Nigeria, use SabiWay to bring more structure and visibility to services you are arranging back home.", icon: Globe2 },
    { title: "Compare professional context", text: "Review service information, reputation and verification signals before deciding who to contact.", icon: BadgeCheck },
    { title: "Keep conversations together", text: "Once you sign in to act, keep the service conversation and job context connected instead of splitting it across multiple channels.", icon: MessageCircleMore },
    { title: "Understand supported transaction states", text: "Where SabiPay applies, payment, completion and dispute states are explained rather than hidden behind vague promises.", icon: ShieldCheck },
  ]} primaryCta={{ href: "/services", label: "Browse services publicly" }} secondaryCta={{ href: "/diaspora", label: "I live outside Nigeria" }} note="You do not need an account to understand the Client journey. Sign in is reserved for actions such as messaging, posting, booking and payment." />;
}
