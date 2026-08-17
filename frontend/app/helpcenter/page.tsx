import Link from "next/link";
import { ArrowRight, BriefcaseBusiness, CircleHelp, FileText, MessageCircleMore, Search, ShieldCheck, UserRound } from "lucide-react";

import { PublicShell, V2ContentHero } from "../_components/v2/PublicShell";

const topics = [
  { title: "Account & profile", text: "Sign in, password recovery, role setup and profile basics.", href: "/login", icon: UserRound },
  { title: "Marketplace", text: "Finding services, posting jobs, professional listings, bookings and responses.", href: "/marketplace", icon: BriefcaseBusiness },
  { title: "SabiForum", text: "Posts, comments, replies, bookmarks, follows and moderation.", href: "/community", icon: MessageCircleMore },
  { title: "Safety & trust", text: "Verification, reporting, moderation, privacy and transaction-safety controls.", href: "/verification", icon: ShieldCheck },
  { title: "Legal & privacy", text: "Review SabiWay's privacy policy and terms of use.", href: "/privacy-policy", icon: FileText },
  { title: "Product status", text: "Understand the current V2 experience and controlled user-testing stage.", href: "/about-us", icon: CircleHelp },
];

const faqs = [
  ["Can I use SabiWay without creating an account?", "You can browse approved marketplace listings and public SabiForum content. Creating jobs, publishing services and other personalised actions require an account."],
  ["What is the difference between a client and a professional?", "Clients use SabiWay to find services and post jobs. Professionals publish service listings, complete provider verification where required and respond to relevant open jobs."],
  ["How do payments work?", "Eligible bookings can use SabiPay. Payment, escrow-style holding, release and dispute controls are enforced by the shared backend and remain subject to the transaction state and configured payment-provider availability."],
  ["How does SabiForum connect to the marketplace?", "SabiForum uses the same SabiWay identity and gives the platform a community layer for discussion, knowledge sharing and professional visibility."],
  ["Are all professionals verified?", "No. Verification is a real workflow, not an automatic badge. A professional is shown as verified only after the required evidence has passed the verification review process."],
];

export const metadata = { title: "Help Centre", description: "Get help with SabiWay accounts, marketplace, SabiForum, payments, trust and privacy." };

export default function HelpCenterPage() {
  return (
    <PublicShell>
      <main className="pb-16">
        <V2ContentHero eyebrow="Help Centre" title="Find the right help without digging through the product." description="Start with the area you are using, then jump directly to the relevant SabiWay experience or policy." />

        <section className="px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="rounded-2xl border border-[#dce8e1] bg-white p-3 shadow-sm sm:p-4">
              <div className="relative"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#718078]" size={19}/><input className="min-h-12 w-full rounded-xl bg-[#f7faf8] pl-12 pr-4 text-sm outline-none ring-1 ring-[#e0eae4] focus:ring-[#008753]" placeholder="Search help topics (visual search field)" aria-label="Search help topics"/></div>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">{topics.map(({title,text,href,icon:Icon}) => <Link href={href} key={title} className="group rounded-3xl border border-[#dce8e1] bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-[#008753]"><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#e8f7f0] text-[#008753]"><Icon size={22}/></div><h2 className="mt-5 text-xl font-black">{title}</h2><p className="mt-2 text-sm leading-6 text-[#68776f]">{text}</p><p className="mt-5 inline-flex items-center gap-1 text-sm font-black text-[#008753]">Open <ArrowRight size={16}/></p></Link>)}</div>
          </div>
        </section>

        <section className="bg-white px-4 py-14 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl"><p className="text-xs font-black uppercase tracking-[.17em] text-[#008753]">Common questions</p><h2 className="mt-3 text-3xl font-black">Quick answers</h2><div className="mt-7 divide-y divide-[#e2ebe6] rounded-3xl border border-[#dce8e1] bg-[#fbfdfc] px-5 sm:px-7">{faqs.map(([question,answer]) => <details key={question} className="group py-5"><summary className="cursor-pointer list-none font-black text-[#173126]">{question}</summary><p className="mt-3 max-w-3xl text-sm leading-6 text-[#68776f]">{answer}</p></details>)}</div></div>
        </section>

        <section className="px-4 pt-14 sm:px-6 lg:px-8"><div className="mx-auto max-w-7xl rounded-[2rem] bg-[#073522] p-7 text-white sm:p-10"><h2 className="text-2xl font-black sm:text-3xl">Still unsure where to go?</h2><p className="mt-3 max-w-2xl leading-7 text-white/70">The fastest route is to sign in and use the part of SabiWay related to your task. Product-specific help, reporting and recovery paths remain attached to those journeys.</p><div className="mt-6 flex flex-wrap gap-3"><Link href="/login" className="rounded-xl bg-[#FFB800] px-5 py-3 font-black text-[#173126]">Sign in</Link><Link href="/about-us" className="rounded-xl border border-white/20 px-5 py-3 font-black">Learn about V2</Link></div></div></section>
      </main>
    </PublicShell>
  );
}
