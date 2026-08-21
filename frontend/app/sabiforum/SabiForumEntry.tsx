"use client";

import Link from "next/link";
import { Bookmark, Heart, MessageCircleMore, Search, ShieldCheck, UsersRound } from "lucide-react";
import { useEffect, useState } from "react";

import { PublicShell, V2ContentHero } from "@/app/_components/v2/PublicShell";
import { useAuthStore } from "@/app/store/useAuthStore";
import SabiForumExperience from "./SabiForumExperience";

const features = [
  { title: "Discover useful posts", text: "Browse practical community content, local knowledge and service-related conversations.", icon: Search },
  { title: "Join conversations", text: "Comment and contribute while keeping participation connected to one SabiWay identity.", icon: MessageCircleMore },
  { title: "Follow useful people", text: "Build context around contributors and topics that matter to you.", icon: UsersRound },
  { title: "Save what matters", text: "Bookmark useful posts so important information is easier to return to later.", icon: Bookmark },
  { title: "Engage thoughtfully", text: "Likes and reposts help useful contributions travel without replacing judgement.", icon: Heart },
  { title: "Moderation matters", text: "Reporting and moderation controls help manage abuse and unsafe community behaviour.", icon: ShieldCheck },
];

function GuestSabiForum() {
  return (
    <PublicShell>
      <main className="flex-1 pb-16">
        <V2ContentHero eyebrow="SabiForum" title="Useful community context around people, places and services." description="Discover what SabiWay members are talking about, then sign in when you want to post, comment, follow or save something useful." />
        <section className="mx-auto grid max-w-7xl gap-4 px-4 py-10 sm:grid-cols-2 sm:px-6 lg:grid-cols-3 lg:px-8" aria-label="SabiForum capabilities">
          {features.map(({ title, text, icon: Icon }) => (
            <article key={title} className="rounded-[var(--sabi-radius-lg)] border border-border bg-card p-5 shadow-[var(--sabi-shadow-sm)]">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--sabi-surface-selected)] text-primary"><Icon size={19} aria-hidden="true" /></div>
              <h2 className="mt-4 text-lg font-black">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p>
            </article>
          ))}
        </section>
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-[var(--sabi-radius-xl)] border border-border bg-muted p-6 sm:flex sm:items-center sm:justify-between sm:gap-6 sm:p-8">
            <div><p className="text-xs font-black uppercase tracking-[.14em] text-primary">Ready to participate?</p><h2 className="mt-2 text-2xl font-black">One account. Marketplace and community context together.</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Reading the public SabiForum does not require an account. Participation does.</p></div>
            <div className="mt-5 flex flex-wrap gap-3 sm:mt-0 sm:shrink-0"><Link href="/login?next=%2Fsabiforum" className="inline-flex min-h-11 items-center rounded-[var(--sabi-radius-md)] border border-border bg-card px-4 text-sm font-black">Sign in</Link><Link href="/signup" className="inline-flex min-h-11 items-center rounded-[var(--sabi-radius-md)] bg-primary px-4 text-sm font-black text-primary-foreground">Join SabiWay</Link></div>
          </div>
        </section>
      </main>
    </PublicShell>
  );
}

export default function SabiForumEntry() {
  const user = useAuthStore((state) => state.user);
  const access = useAuthStore((state) => state.access);
  const loadUserFromStorage = useAuthStore((state) => state.loadUserFromStorage);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    loadUserFromStorage();
    setHydrated(true);
  }, [loadUserFromStorage]);

  if (!hydrated || !user || !access) return <GuestSabiForum />;
  return <SabiForumExperience />;
}
