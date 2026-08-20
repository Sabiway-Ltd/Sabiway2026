import { Bookmark, Heart, MessageCircleMore, Search, ShieldCheck, UsersRound } from "lucide-react";
import { MarketingPage } from "../_components/v2/PublicMarketing";

export const metadata = { title: "SabiForum | SabiWay", description: "Discover the community layer of SabiWay: useful knowledge, local context and trusted conversations." };

export default function Page() {
  return <MarketingPage eyebrow="SabiForum" title="Useful community context around the people, places and services that matter." description="SabiForum is the community layer of SabiWay. It gives members a place to share useful knowledge, follow conversations and build context beyond a single marketplace transaction." features={[
    { title: "Discover useful posts", text: "Browse practical community content, local knowledge and service-related conversations.", icon: Search },
    { title: "Join conversations", text: "Comment and contribute while keeping community participation connected to one SabiWay identity.", icon: MessageCircleMore },
    { title: "Follow useful people", text: "Build a feed around contributors and topics that are relevant to you.", icon: UsersRound },
    { title: "Save what matters", text: "Bookmark useful posts so important information is easier to return to later.", icon: Bookmark },
    { title: "Engage thoughtfully", text: "Likes and other engagement signals help surface useful contributions without replacing judgement.", icon: Heart },
    { title: "Moderation matters", text: "Reporting and moderation controls help manage abuse, unsafe content and community-rule breaches.", icon: ShieldCheck },
  ]} primaryCta={{ href: "/signup", label: "Join the community" }} secondaryCta={{ href: "/community", label: "Open SabiForum" }} />;
}
