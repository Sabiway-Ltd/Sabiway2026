import { Building2, Handshake, MapPinned, Network, ShieldCheck, UsersRound } from "lucide-react";
import { MarketingPage } from "../_components/v2/PublicMarketing";

export const metadata = { title: "Partner with SabiWay", description: "Explore responsible partnership opportunities with SabiWay communities, professionals and marketplace infrastructure." };

export default function Page() {
  return <MarketingPage eyebrow="Partnerships" title="Work with SabiWay where community, services and trusted opportunity overlap." description="Partnerships should create practical value for users rather than becoming a logo wall. SabiWay is interested in collaborations that strengthen discovery, professional opportunity, trust or local community outcomes." features={[
    { title: "Community partners", text: "Work with trusted groups that already support local or diaspora communities.", icon: UsersRound },
    { title: "Professional networks", text: "Help skilled professionals improve visibility, trust and access to relevant opportunities.", icon: Network },
    { title: "Local ecosystems", text: "Support useful service discovery and local economic participation in specific places.", icon: MapPinned },
    { title: "Organisations", text: "Explore structured partnerships where marketplace or community infrastructure can solve a real operational need.", icon: Building2 },
    { title: "Responsible collaboration", text: "Partnerships must respect user privacy, platform safety and transparent incentives.", icon: ShieldCheck },
    { title: "Start with fit", text: "The strongest partnership begins with a specific user problem and a clear shared outcome.", icon: Handshake },
  ]} primaryCta={{ href: "/contact", label: "Start a partnership conversation" }} secondaryCta={{ href: "/about-us", label: "About SabiWay" }} />;
}
