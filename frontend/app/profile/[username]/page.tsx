import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BriefcaseBusiness, CheckCircle2, Clock3, MapPin, ShieldCheck } from "lucide-react";

import { Avatar, StatePanel, StatusBadge, Surface } from "@/app/_components/common/DesignPrimitives";
import { PublicShell } from "@/app/_components/v2/PublicShell";
import { environment } from "@/app/config/environment";
import ProfilePosts from "./ProfilePosts";
import ServiceContactButton from "./ServiceContactButton";

type PublicProfile = {
  user_id: number;
  full_name: string;
  username: string;
  profile_picture?: string | null;
  role: "client" | "professional";
  job?: string | null;
  bio?: string | null;
  country?: string | null;
  state?: string | null;
  is_verified?: boolean;
  verification_status?: string;
};

type PublicService = {
  id: string;
  title: string;
  description: string;
  price_from: string;
  currency: string;
  pricing_note?: string;
  delivery_mode: "in_person" | "remote" | "both";
  country?: string;
  state?: string;
  city?: string;
  area?: string;
  availability_text?: string;
  available_now?: boolean;
  category?: { name?: string };
};

type PublicMarketplaceProfile = { profile: PublicProfile; services: PublicService[] };

function locationLabel(service: PublicService) {
  if (service.delivery_mode === "remote") return "Remote";
  return [service.area, service.city, service.state, service.country].filter(Boolean).join(", ") || "Service location confirmed in conversation";
}

function deliveryLabel(mode: PublicService["delivery_mode"]) {
  if (mode === "in_person") return "In person";
  if (mode === "remote") return "Remote";
  return "In person or remote";
}

async function getPublicProfile(username: string): Promise<{ data?: PublicMarketplaceProfile; unavailable?: boolean; missing?: boolean }> {
  try {
    const clean = decodeURIComponent(username).replace(/^@/, "");
    const response = await fetch(`${environment.djangoUrl}/api/profiles/public/${encodeURIComponent(clean)}/`, {
      next: { revalidate: 60 },
    });
    if (response.status === 404) return { missing: true };
    if (!response.ok) return { unavailable: true };
    return { data: await response.json() as PublicMarketplaceProfile };
  } catch {
    return { unavailable: true };
  }
}

export async function generateMetadata({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const result = await getPublicProfile(username);
  if (!result.data) return { title: "Professional profile | SabiWay" };
  return {
    title: `${result.data.profile.full_name} | SabiWay Professional`,
    description: result.data.profile.bio || `View ${result.data.profile.full_name}'s approved services and public trust information on SabiWay.`,
  };
}

export default async function ProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const result = await getPublicProfile(username);
  if (result.missing) notFound();

  if (!result.data) {
    return (
      <PublicShell>
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 sm:px-6 lg:px-8">
          <StatePanel
            tone="error"
            title="This profile is temporarily unavailable"
            description="We could not load the Professional profile safely. Try again, or return to marketplace discovery."
            action={<Link href="/marketplace" className="inline-flex min-h-11 items-center rounded-[var(--sabi-radius-md)] bg-primary px-4 py-2 font-bold text-primary-foreground">Return to marketplace</Link>}
          />
        </main>
      </PublicShell>
    );
  }

  const { profile, services } = result.data;
  const cleanUsername = profile.username.replace(/^@/, "");
  const profilePath = `/profile/${encodeURIComponent(cleanUsername)}`;
  const publicLocation = [profile.state, profile.country].filter(Boolean).join(", ");

  return (
    <PublicShell>
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-7 sm:px-6 lg:px-8 lg:py-10">
        <Link href="/marketplace" className="inline-flex min-h-11 items-center gap-2 rounded-[var(--sabi-radius-md)] text-sm font-bold text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <ArrowLeft size={17} aria-hidden="true" /> Back to marketplace
        </Link>

        <section className="mt-3 overflow-hidden rounded-[var(--sabi-radius-xl)] border border-border bg-card shadow-[var(--sabi-shadow-sm)]">
          <div className="bg-primary px-5 py-7 text-primary-foreground sm:px-8 lg:px-10">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              <Avatar name={profile.full_name} size={88} className="border-4 border-white/20 bg-white text-2xl text-primary" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-xs font-black uppercase tracking-[.16em] text-white/75">{profile.role === "professional" ? "SabiWay Professional" : "SabiWay member"}</p>
                  {profile.is_verified ? <StatusBadge tone="success"><ShieldCheck size={13} className="mr-1" aria-hidden="true" /> Identity verified</StatusBadge> : null}
                </div>
                <h1 className="mt-2 text-3xl font-black tracking-[-.03em] sm:text-4xl">{profile.full_name}</h1>
                <p className="mt-2 text-base font-bold text-white/90">{profile.job || profile.username}</p>
                {publicLocation ? <p className="mt-2 inline-flex items-center gap-2 text-sm text-white/80"><MapPin size={16} aria-hidden="true" /> {publicLocation}</p> : null}
              </div>
            </div>
          </div>
          <div className="grid gap-6 p-5 sm:p-8 lg:grid-cols-[1fr_300px] lg:p-10">
            <div>
              <h2 className="text-lg font-black">About</h2>
              <p className="mt-2 max-w-3xl text-sm leading-7 text-muted-foreground">{profile.bio || "This Professional has not added a public introduction yet. Review their approved services below for current scope and availability."}</p>
            </div>
            <Surface className="p-4 shadow-none">
              <p className="text-xs font-black uppercase tracking-[.12em] text-muted-foreground">Trust context</p>
              <div className="mt-3 flex items-start gap-3">
                <ShieldCheck className="mt-0.5 shrink-0 text-primary" size={20} aria-hidden="true" />
                <div><p className="font-black">{profile.is_verified ? "Verified identity" : "Verification not shown"}</p><p className="mt-1 text-xs leading-5 text-muted-foreground">Verification is one signal. Confirm service scope, price, availability and booking terms before committing.</p></div>
              </div>
            </Surface>
          </div>
        </section>

        <section className="mt-8" aria-labelledby="services-heading">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div><p className="text-xs font-black uppercase tracking-[.14em] text-primary">Approved services</p><h2 id="services-heading" className="mt-1 text-2xl font-black">What {profile.full_name} offers</h2></div>
            <p className="text-sm font-semibold text-muted-foreground">{services.length} {services.length === 1 ? "service" : "services"}</p>
          </div>

          {services.length === 0 ? (
            <StatePanel className="mt-4" title="No approved services are public yet" description="This profile can still have community activity, but SabiWay is not currently showing an approved marketplace service for this Professional." />
          ) : (
            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              {services.map((service) => (
                <Surface key={service.id} className="flex h-full flex-col p-5 sm:p-6">
                  <div className="flex flex-wrap items-center gap-2">
                    {service.category?.name ? <StatusBadge>{service.category.name}</StatusBadge> : null}
                    {service.available_now ? <StatusBadge tone="success"><CheckCircle2 size={13} className="mr-1" aria-hidden="true" /> Available now</StatusBadge> : null}
                  </div>
                  <h3 className="mt-3 text-xl font-black">{service.title}</h3>
                  <p className="mt-2 line-clamp-3 text-sm leading-6 text-muted-foreground">{service.description}</p>
                  <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
                    <div><dt className="text-xs font-black uppercase tracking-wide text-muted-foreground">Starting price</dt><dd className="mt-1 text-lg font-black">{service.currency} {Number(service.price_from).toLocaleString("en-GB")}</dd>{service.pricing_note ? <dd className="mt-1 text-xs text-muted-foreground">{service.pricing_note}</dd> : null}</div>
                    <div><dt className="text-xs font-black uppercase tracking-wide text-muted-foreground">Delivery</dt><dd className="mt-1 inline-flex items-center gap-2 font-bold"><BriefcaseBusiness size={16} className="text-primary" aria-hidden="true" /> {deliveryLabel(service.delivery_mode)}</dd></div>
                    <div className="sm:col-span-2"><dt className="text-xs font-black uppercase tracking-wide text-muted-foreground">Service location</dt><dd className="mt-1 inline-flex items-start gap-2 font-bold"><MapPin size={16} className="mt-0.5 shrink-0 text-primary" aria-hidden="true" /> {locationLabel(service)}</dd></div>
                    {service.availability_text ? <div className="sm:col-span-2"><dt className="text-xs font-black uppercase tracking-wide text-muted-foreground">Availability</dt><dd className="mt-1 inline-flex items-start gap-2 font-bold"><Clock3 size={16} className="mt-0.5 shrink-0 text-primary" aria-hidden="true" /> {service.availability_text}</dd></div> : null}
                  </dl>
                  <div className="mt-auto pt-6"><ServiceContactButton listingId={service.id} profilePath={profilePath} /></div>
                </Surface>
              ))}
            </div>
          )}
        </section>

        <section className="mt-10 border-t border-border pt-8" aria-labelledby="community-evidence-heading">
          <p className="text-xs font-black uppercase tracking-[.14em] text-primary">Community evidence</p>
          <h2 id="community-evidence-heading" className="mt-1 text-2xl font-black">SabiForum activity</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">Community posts can help you understand how someone communicates. They are supporting context, not a replacement for service scope, verification or transaction history.</p>
          <ProfilePosts username={cleanUsername} />
        </section>
      </main>
    </PublicShell>
  );
}
