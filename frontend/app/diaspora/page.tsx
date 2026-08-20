import { BadgeCheck, BriefcaseBusiness, Globe2, HeartHandshake, Home, MessageCircleMore } from "lucide-react";
import { MarketingPage } from "../_components/v2/PublicMarketing";

export const metadata = {
  title: "SabiWay for the Nigerian Diaspora",
  description: "See how SabiWay helps Nigerians abroad stay connected to trusted services, professionals and opportunities in Nigeria.",
};

export default function Page() {
  return (
    <MarketingPage
      eyebrow="For Nigerians abroad"
      title="You may live abroad. The things you need to get done back home are still real."
      description="SabiWay is designed to reduce the distance between Nigerians abroad and trusted services, professionals and opportunities in Nigeria. Instead of relying only on forwarded numbers, group chats or one-off recommendations, you can start with more context and a clearer journey."
      features={[
        { title: "Support family from abroad", text: "Find relevant service categories when you need to arrange practical help for parents, relatives or loved ones in Nigeria.", icon: HeartHandshake },
        { title: "Manage property and household needs", text: "Use clearer service and professional context when coordinating cleaning, repairs, maintenance and other work from another country.", icon: Home },
        { title: "Find professionals with more context", text: "Review service information, location, verification context and reputation instead of starting from an unknown phone number.", icon: BadgeCheck },
        { title: "Keep conversations connected", text: "Move from discovery into a shared messaging and job context so important details are not scattered across different channels.", icon: MessageCircleMore },
        { title: "Create opportunity back home", text: "Diaspora demand can help Nigerian professionals become discoverable beyond their immediate local network while still building reputation through real work.", icon: BriefcaseBusiness },
        { title: "Stay connected to Nigeria", text: "SabiWay combines services, professional opportunity and SabiForum so connection is not limited to transactions alone.", icon: Globe2 },
      ]}
      steps={[
        { title: "Explore publicly", text: "Understand services, trust, fees and how the platform works without being forced to sign in." },
        { title: "Find the right route", text: "Browse the service or professional context that fits what you need in Nigeria." },
        { title: "Create an account to act", text: "Sign in only when you are ready to message, post a job, book, pay or participate." },
        { title: "Keep the journey visible", text: "Use supported SabiWay workflows to retain context from conversation through completion." },
      ]}
      primaryCta={{ href: "/services", label: "Browse services in Nigeria" }}
      secondaryCta={{ href: "/how-it-works", label: "See how SabiWay works" }}
      note="Service availability is Nigeria-first. SabiWay's audience and relationships are global, connecting people at home with Nigerians across the diaspora."
    />
  );
}
