import { notFound } from "next/navigation";
import { BadgeCheck, BriefcaseBusiness, MapPin, MessageCircleMore, Search, ShieldCheck } from "lucide-react";

import { MarketingPage } from "../../_components/v2/PublicMarketing";
import { locations } from "../../_components/v2/publicData";

export function generateStaticParams() {
  return locations.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const location = locations.find((item) => item.slug === slug);
  return location ? { title: `Services in ${location.name} | SabiWay`, description: location.description } : {};
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const location = locations.find((item) => item.slug === slug);
  if (!location) notFound();

  return (
    <MarketingPage
      eyebrow="Location"
      title={`Find services and professional opportunities in ${location.name}.`}
      description={location.description}
      features={[
        { title: "Search local services", text: `Use ${location.name} as location context when searching the SabiWay marketplace.`, icon: Search },
        { title: "Browse relevant categories", text: "Start from the service you need rather than scrolling through unrelated profiles.", icon: BriefcaseBusiness },
        { title: "Check service area", text: "Confirm that the professional can realistically serve your area before agreeing work.", icon: MapPin },
        { title: "Review trust context", text: "Use profile, verification and reputation signals to make a more informed choice.", icon: BadgeCheck },
        { title: "Keep discussion connected", text: "Use SabiWay messaging and booking context rather than losing important details across channels.", icon: MessageCircleMore },
        { title: "Use supported transaction flows", text: "Where applicable, keep booking, payment and dispute states visible inside SabiWay.", icon: ShieldCheck },
      ]}
      primaryCta={{ href: `/marketplace?location=${encodeURIComponent(location.name)}`, label: `Explore ${location.name}` }}
      secondaryCta={{ href: "/services", label: "Browse service categories" }}
      note="Availability depends on the professionals and services currently active in each area."
    />
  );
}
