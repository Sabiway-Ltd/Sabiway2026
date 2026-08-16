import { PublicShell, V2ContentHero } from "../_components/v2/PublicShell";
import TermsOfUseMain from "./TermsOfUseMain";

export const metadata = {
  title: "Terms of Use",
  description: "Read the terms that govern use of SabiWay, SabiForum and the marketplace.",
};

export default function Page() {
  return (
    <PublicShell>
      <main className="pb-16">
        <V2ContentHero
          eyebrow="Legal"
          title="Terms of Use"
          description="The rules that govern use of SabiWay across the marketplace, community and account experience. The legal wording below is preserved while the presentation is upgraded to V2."
        />
        <div className="mx-auto mt-10 max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="overflow-hidden rounded-3xl border border-[#dce8e1] bg-white shadow-sm">
            <TermsOfUseMain />
          </div>
        </div>
      </main>
    </PublicShell>
  );
}
