import { Banknote, CircleCheckBig, HandCoins, RotateCcw, Scale, ShieldCheck } from "lucide-react";
import { MarketingPage } from "../_components/v2/PublicMarketing";

export const metadata = { title: "SabiPay explained | SabiWay", description: "Understand the protected payment journey used for eligible SabiWay service bookings." };

export default function Page() {
  return <MarketingPage eyebrow="SabiPay" title="A clearer payment journey for service work." description="SabiPay is designed to make payment status, completion, payout and dispute handling easier to understand when an eligible SabiWay booking uses protected payment." features={[
    { title: "Agree before funding", text: "Scope, price and timing should be clear before a client moves into the payment journey.", icon: HandCoins },
    { title: "Track payment state", text: "Both sides can see whether a transaction is awaiting payment, funded, completed, frozen, refunded or disputed.", icon: Banknote },
    { title: "Confirm completion", text: "The job lifecycle and payment lifecycle stay connected so completion is not treated as a separate mystery step.", icon: CircleCheckBig },
    { title: "Payout controls", text: "Professional payout follows the configured SabiPay lifecycle rather than relying on an informal transfer promise.", icon: ShieldCheck },
    { title: "Refund paths", text: "Eligible refunds are handled as an explicit transaction state with operational evidence.", icon: RotateCcw },
    { title: "Dispute handling", text: "When work cannot be resolved directly, the dispute process can freeze relevant movement while evidence is reviewed.", icon: Scale },
  ]} steps={[
    { title: "Agree", text: "Confirm service scope, price and timing." },
    { title: "Fund", text: "Client enters the protected payment flow." },
    { title: "Complete", text: "Work status and completion are recorded." },
    { title: "Release", text: "Payout/refund/dispute follows the applicable state." },
  ]} primaryCta={{ href: "/fees", label: "See fees & charges" }} secondaryCta={{ href: "/trust-and-safety", label: "Trust & safety" }} note="Availability, timing and exact transaction rules depend on the SabiPay configuration used for the relevant booking." />;
}
