import { BriefcaseBusiness, CalendarCheck2, MessageCircleMore, Search, ShieldCheck, Star } from "lucide-react";
import { MarketingPage } from "../_components/v2/PublicMarketing";

export const metadata = { title: "How SabiWay works", description: "See how clients and professionals move from discovery to trusted service delivery on SabiWay." };

export default function Page() {
  return <MarketingPage eyebrow="How SabiWay works" title="From finding the right person to finishing the job — one connected journey." description="SabiWay brings service discovery, jobs, messaging, booking, protected payment, reviews and community context together so users do not have to manage the same job across disconnected tools." features={[
    { title: "Find or post", text: "Clients can browse services or post a job so relevant professionals can respond.", icon: Search },
    { title: "Compare with context", text: "Profiles, reviews, location and verification signals help people make a more informed choice.", icon: BriefcaseBusiness },
    { title: "Agree before work starts", text: "Keep scope, timing and expectations clear before a booking moves forward.", icon: MessageCircleMore },
    { title: "Book and schedule", text: "Move an agreed service into a trackable booking and schedule.", icon: CalendarCheck2 },
    { title: "Use protected payment flows", text: "Where SabiPay is available, payment and dispute states are visible rather than hidden in private transfers.", icon: ShieldCheck },
    { title: "Build reputation", text: "Completed work can contribute to reviews and stronger marketplace trust over time.", icon: Star },
  ]} steps={[
    { title: "Discover", text: "Search services or publish a need." },
    { title: "Discuss", text: "Use SabiWay messaging to clarify the work." },
    { title: "Agree", text: "Confirm scope, price and timing." },
    { title: "Complete", text: "Track delivery, payment and review." },
  ]} />;
}
