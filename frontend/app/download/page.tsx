import { Laptop, QrCode, Smartphone, TabletSmartphone, Wifi, Wrench } from "lucide-react";
import { MarketingPage } from "../_components/v2/PublicMarketing";

export const metadata = { title: "Get the SabiWay app", description: "Learn how to access SabiWay on web and mobile during controlled testing." };

export default function Page() {
  return <MarketingPage eyebrow="SabiWay on your devices" title="Use SabiWay on web today and follow the controlled mobile release as it becomes available." description="The web and mobile experiences share the same account, marketplace rules and core journeys. Mobile distribution is being prepared through controlled Android/iPhone testing rather than being presented as a public store launch before certification is complete." features={[
    { title: "Web", text: "Use the responsive web experience on desktop, tablet or mobile browser.", icon: Laptop },
    { title: "Android", text: "Controlled Android builds are distributed to testers when a signed QA/beta build is available.", icon: Smartphone },
    { title: "iPhone", text: "Controlled iPhone distribution will use an approved beta route such as TestFlight once signing is configured.", icon: TabletSmartphone },
    { title: "One account", text: "The same Client or Professional identity is designed to continue across web and mobile.", icon: QrCode },
    { title: "Designed for real networks", text: "Testing includes constrained-network behaviour rather than assuming perfect broadband conditions.", icon: Wifi },
    { title: "Still being certified", text: "Physical-device and browser certification remains part of the controlled-testing release gate.", icon: Wrench },
  ]} primaryCta={{ href: "/signup", label: "Create an account" }} secondaryCta={{ href: "/how-it-works", label: "See how SabiWay works" }} note="This page deliberately does not claim public App Store or Play Store availability until those releases are genuinely live." />;
}
