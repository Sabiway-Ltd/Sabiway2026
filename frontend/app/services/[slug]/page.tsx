import { notFound } from "next/navigation";
import { BadgeCheck, MapPin, MessageCircleMore, Search, ShieldCheck, Star } from "lucide-react";
import { MarketingPage } from "../../_components/v2/PublicMarketing";
import { serviceCategories } from "../../_components/v2/publicData";

export function generateStaticParams() { return serviceCategories.map(({ slug }) => ({ slug })); }

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const service = serviceCategories.find((item) => item.slug === slug);
  return service ? { title: `${service.name} services | SabiWay`, description: service.description } : {};
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const service = serviceCategories.find((item) => item.slug === slug);
  if (!service) notFound();
  return <MarketingPage eyebrow="Service category" title={`Find ${service.name.toLowerCase()} support with more context before you choose.`} description={service.description} features={[
    { title: "Search relevant profiles", text: `Start with professionals who list ${service.name.toLowerCase()} services rather than a generic people directory.`, icon: Search },
    { title: "Use location", text: "Consider where the work is needed and whether the professional can realistically serve that area.", icon: MapPin },
    { title: "Check profile signals", text: "Review service information, verification status where available and other useful profile context.", icon: BadgeCheck },
    { title: "Discuss the need", text: "Clarify scope, timing and expectations before treating the job as agreed.", icon: MessageCircleMore },
    { title: "Use protected flows", text: "Where applicable, keep booking and payment states visible inside the SabiWay journey.", icon: ShieldCheck },
    { title: "Review completed work", text: "Feedback after completed work helps strengthen future discovery and reputation.", icon: Star },
  ]} primaryCta={{ href: `/marketplace?search=${encodeURIComponent(service.name)}`, label: `Browse ${service.name}` }} secondaryCta={{ href: "/how-it-works", label: "How SabiWay works" }} />;
}
