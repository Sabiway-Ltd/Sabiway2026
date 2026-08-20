import Link from "next/link";
import { ArrowRight, BriefcaseBusiness } from "lucide-react";
import { PublicShell, V2ContentHero } from "../_components/v2/PublicShell";
import { serviceCategories } from "../_components/v2/publicData";

export const metadata = { title: "Services | SabiWay", description: "Browse popular service categories on SabiWay." };

export default function Page() {
  return <PublicShell><main className="pb-16"><V2ContentHero eyebrow="Services" title="Start with what you need." description="Browse popular service categories, then continue into the marketplace to compare relevant professionals and opportunities."/><section className="px-4 py-12 sm:px-6 lg:px-8"><div className="mx-auto grid max-w-7xl gap-4 sm:grid-cols-2 lg:grid-cols-3">{serviceCategories.map((service)=><Link key={service.slug} href={`/services/${service.slug}`} className="group rounded-3xl border border-border bg-card p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-primary"><BriefcaseBusiness className="text-primary"/><h2 className="mt-5 text-xl font-black">{service.name}</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">{service.description}</p><span className="mt-5 inline-flex items-center gap-2 text-sm font-black text-primary">Explore {service.name}<ArrowRight size={16}/></span></Link>)}</div></section></main></PublicShell>;
}
