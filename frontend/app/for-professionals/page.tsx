import { BadgeCheck, BriefcaseBusiness, Globe2, MessageCircleMore, Star, WalletCards } from "lucide-react";
import { MarketingPage } from "../_components/v2/PublicMarketing";

export const metadata = { title: "For professionals | SabiWay", description: "Build a trusted professional presence and become discoverable to clients in Nigeria and Nigerians abroad." };

export default function Page() {
  return <MarketingPage eyebrow="For professionals" title="Build a reputation that can travel further than your immediate network." description="SabiWay helps Nigerian professionals present their services clearly, become easier to discover, manage work more professionally and build reputation with clients in Nigeria and Nigerians arranging needs from abroad." features={[
    { title: "Present your services clearly", text: "Create a professional presence that explains what you do, where you work and what clients can realistically expect.", icon: BriefcaseBusiness },
    { title: "Build visible trust", text: "Use verification context, service evidence and completed-work reputation to give clients more information than an advert alone.", icon: BadgeCheck },
    { title: "Reach beyond referrals", text: "Become discoverable not only to nearby clients but also to Nigerians abroad who are trying to arrange trusted services back home.", icon: Globe2 },
    { title: "Manage enquiries with context", text: "Keep service conversations connected to the job rather than losing details across scattered calls and chats.", icon: MessageCircleMore },
    { title: "Understand earnings and payout states", text: "Where SabiPay applies, supported payment and payout stages are visible inside the service journey.", icon: WalletCards },
    { title: "Grow reputation through real work", text: "Completed jobs and reviews help create a professional history that becomes more useful over time.", icon: Star },
  ]} steps={[
    { title: "Create your presence", text: "Explain your service, location and professional context clearly." },
    { title: "Strengthen trust", text: "Use verification and profile evidence where applicable." },
    { title: "Connect to demand", text: "Respond to relevant needs from clients at home and, where applicable, diaspora clients arranging work in Nigeria." },
    { title: "Deliver and build reputation", text: "Complete work professionally and grow a review history that supports future discovery." },
  ]} primaryCta={{ href: "/signup", label: "Become a SabiWay Professional" }} secondaryCta={{ href: "/verification-info", label: "How verification works" }} note="SabiWay is Nigeria-first in service supply and diaspora-connected in demand, discovery and community." />;
}
