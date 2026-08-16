import { PublicShell, V2ContentHero } from "../_components/v2/PublicShell";
import PrivacyMain from "./PrivacyMain";

export const metadata = {
  title: "Privacy Policy",
  description: "Read how SabiWay handles personal information and privacy across the marketplace and SabiForum.",
};

export default function Page() {
  return (
    <PublicShell>
      <main className="pb-16">
        <V2ContentHero
          eyebrow="Legal"
          title="Privacy Policy"
          description="How SabiWay handles personal information across accounts, profiles, marketplace activity and SabiForum. The legal wording below is preserved while the presentation is upgraded to V2."
        />
        <div className="mx-auto mt-10 max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="overflow-hidden rounded-3xl border border-[#dce8e1] bg-white shadow-sm">
            <PrivacyMain />
          </div>
        </div>
      </main>
    </PublicShell>
  );
}
