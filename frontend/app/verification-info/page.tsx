import { BadgeCheck, FileCheck2, LockKeyhole, SearchCheck, ShieldAlert, UserRoundCheck } from "lucide-react";
import { MarketingPage } from "../_components/v2/PublicMarketing";

export const metadata = { title: "Professional verification explained | SabiWay", description: "Learn what SabiWay professional verification checks, what the badge means and what it does not mean." };

export default function Page() {
  return <MarketingPage eyebrow="Professional verification" title="A trust signal with a clear meaning — not a blanket guarantee." description="Verification gives clients more evidence about who they are considering while helping professionals demonstrate legitimacy. It should support judgement, not replace it." features={[
    { title: "Identity evidence", text: "Verification can include evidence intended to establish that the applicant is the person behind the professional profile.", icon: UserRoundCheck },
    { title: "Professional evidence", text: "Where relevant, supporting information can help demonstrate service or professional capability.", icon: FileCheck2 },
    { title: "Manual review", text: "Submitted evidence moves through a defined review state rather than automatically producing a badge.", icon: SearchCheck },
    { title: "Visible status", text: "Approved status can appear as a trust signal so users understand that evidence has been reviewed.", icon: BadgeCheck },
    { title: "Privacy matters", text: "Sensitive verification evidence should be handled more carefully than ordinary public profile content.", icon: LockKeyhole },
    { title: "Know the limitation", text: "Verification does not guarantee quality, safety, future conduct or suitability for every job.", icon: ShieldAlert },
  ]} primaryCta={{ href: "/signup", label: "Create a professional account" }} secondaryCta={{ href: "/trust-and-safety", label: "Trust & safety" }} />;
}
