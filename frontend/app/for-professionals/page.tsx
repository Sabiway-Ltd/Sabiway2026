import { BadgeCheck, BriefcaseBusiness, MessageCircleMore, ShieldCheck, Star, WalletCards } from "lucide-react";
import { MarketingPage } from "../_components/v2/PublicMarketing";

export const metadata = { title: "For professionals | SabiWay", description: "Build your service profile, find work, communicate with clients and build reputation on SabiWay." };

export default function Page() {
  return <MarketingPage eyebrow="For professionals" title="Turn your skill into a more visible, trusted and organised service business." description="SabiWay helps professionals present their services clearly, discover opportunities, manage conversations and build reputation through completed work." features={[
    { title: "Present your services", text: "Create a profile that explains what you do, where you work and the services you provide.", icon: BriefcaseBusiness },
    { title: "Build trust", text: "Use professional verification and profile evidence to give clients more confidence before they contact you.", icon: BadgeCheck },
    { title: "Find relevant jobs", text: "See opportunities aligned to your service area instead of waiting for informal referrals alone.", icon: ShieldCheck },
    { title: "Manage enquiries", text: "Keep client conversations and job context connected to the work instead of scattered across channels.", icon: MessageCircleMore },
    { title: "Track earnings", text: "Use the SabiPay journey where available to see payment and payout states more clearly.", icon: WalletCards },
    { title: "Grow your reputation", text: "Completed work and reviews help build a stronger service profile over time.", icon: Star },
  ]} steps={[
    { title: "Create profile", text: "Tell clients what you do and where you work." },
    { title: "Verify", text: "Submit evidence where professional verification applies." },
    { title: "Win work", text: "Respond to opportunities and agree scope clearly." },
    { title: "Deliver", text: "Complete the job, get paid and build reviews." },
  ]} primaryCta={{ href: "/signup", label: "Become a SabiWay Professional" }} secondaryCta={{ href: "/verification-info", label: "How verification works" }} />;
}
