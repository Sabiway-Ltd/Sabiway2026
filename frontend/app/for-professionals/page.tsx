import { BadgeCheck, BriefcaseBusiness, Globe2, MapPin, MessageCircleMore, Star, WalletCards } from "lucide-react";
import { MarketingPage } from "../_components/v2/PublicMarketing";

export const metadata = { title: "For professionals | SabiWay", description: "Publish services where you operate, support local or remote delivery and build trusted Professional reputation on SabiWay." };

export default function Page() {
  return <MarketingPage eyebrow="For professionals" title="Be discovered where you actually work — locally, across a service area or remotely." description="SabiWay helps Professionals present services clearly, define where they operate, respond to relevant demand and build reputation through completed work. Nigeria and the UK are our first optimised markets, but Professionals elsewhere can still register and become discoverable where supply exists." features={[
    { title: "Present your services clearly", text: "Explain what you offer, your service location, starting price, availability and whether the work is in-person, remote or both.", icon: BriefcaseBusiness },
    { title: "Define where you serve", text: "Your account location and service area are not the same thing. Show where you can realistically deliver in-person work.", icon: MapPin },
    { title: "Support remote work", text: "Remote-enabled services can reach Clients outside your physical area when location is not a delivery constraint.", icon: Globe2 },
    { title: "Build visible trust", text: "Use verification context, service evidence and completed-work reputation to give Clients more information than an advert alone.", icon: BadgeCheck },
    { title: "Manage enquiries with context", text: "Keep service conversations connected to the job instead of losing important details across scattered calls and chats.", icon: MessageCircleMore },
    { title: "Understand earnings and payouts", text: "Service currency follows the market you serve. SabiPay checkout and payout availability are then enabled market by market rather than assumed globally.", icon: WalletCards },
    { title: "Grow reputation through real work", text: "Completed jobs and reviews create a Professional history that supports future discovery wherever you operate.", icon: Star },
  ]} steps={[
    { title: "Create your presence", text: "Explain your service, base location, service area and delivery mode clearly." },
    { title: "Strengthen trust", text: "Use verification and profile evidence where applicable." },
    { title: "Connect to relevant demand", text: "Appear in searches for the places you serve, or broader searches when your service is remote." },
    { title: "Deliver and build reputation", text: "Complete work professionally, get paid where supported and grow a review history that improves future discovery." },
  ]} primaryCta={{ href: "/signup?role=professional", label: "Become a SabiWay Professional" }} secondaryCta={{ href: "/verification-info", label: "How verification works" }} note="Nigeria and the UK are the first optimised markets. The marketplace itself is designed so Professionals in other countries can still register and be found where they operate." />;
}
