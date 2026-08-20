import { Accessibility, Eye, Keyboard, MessageCircleWarning, Smartphone, Type } from "lucide-react";
import { MarketingPage } from "../_components/v2/PublicMarketing";

export const metadata = { title: "Accessibility | SabiWay", description: "Read SabiWay's accessibility approach and how to report accessibility barriers." };

export default function Page() {
  return <MarketingPage eyebrow="Accessibility" title="SabiWay should be usable across different abilities, devices and levels of digital confidence." description="Our engineering standard targets WCAG 2.2 AA for material web journeys. Accessibility is an ongoing product responsibility, so this statement describes the direction and how users can raise barriers we have missed." features={[
    { title: "Keyboard access", text: "Interactive web journeys should remain usable without requiring a mouse.", icon: Keyboard },
    { title: "Visible focus", text: "Keyboard focus should be clear enough that users can understand where they are on the page.", icon: Eye },
    { title: "Readable content", text: "Text, contrast, headings and spacing should support comfortable scanning and zoom without hiding critical actions.", icon: Type },
    { title: "Touch-friendly controls", text: "Mobile and tablet interactions should use appropriately sized targets and avoid unnecessarily precise gestures.", icon: Smartphone },
    { title: "Meaning beyond colour", text: "Status, error and success states should not depend on colour alone.", icon: Accessibility },
    { title: "Report a barrier", text: "If a page or journey prevents you from using SabiWay, report the page, device and problem so it can be investigated.", icon: MessageCircleWarning },
  ]} primaryCta={{ href: "/contact", label: "Report an accessibility issue" }} secondaryCta={{ href: "/helpcenter", label: "Help Centre" }} note="Physical-device and browser accessibility certification is still part of SabiWay's controlled-testing readiness work; this page does not claim perfect conformance." />;
}
