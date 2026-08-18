import { Banknote, CircleDollarSign, Info, ReceiptText, ShieldCheck, WalletCards } from "lucide-react";
import { MarketingPage } from "../_components/v2/PublicMarketing";

export const metadata = { title: "Fees & charges | SabiWay", description: "Understand how SabiWay communicates service, transaction and payout charges." };

export default function Page() {
  return <MarketingPage eyebrow="Fees & charges" title="Know the cost before you commit." description="SabiWay should make applicable marketplace and payment charges visible before a user confirms a consequential action. This page explains the fee principles; exact amounts shown in-product remain the transaction source of truth." features={[
    { title: "Joining", text: "Creating a SabiWay account should not hide an unexpected subscription commitment behind sign-up.", icon: CircleDollarSign },
    { title: "Service price", text: "The agreed service price belongs to the client-professional job scope and should be clear before booking/payment.", icon: ReceiptText },
    { title: "SabiPay charges", text: "Where a payment or platform charge applies, it should be disclosed in the transaction flow before confirmation.", icon: Banknote },
    { title: "Professional payout", text: "Professionals should be able to understand gross amount, applicable deductions and expected payout state.", icon: WalletCards },
    { title: "Refund/dispute impact", text: "Refund or dispute outcomes can affect the final amount released and should be visible in the case state.", icon: ShieldCheck },
    { title: "Source of truth", text: "If this summary and a live transaction differ, the live transaction disclosure and applicable terms govern that transaction.", icon: Info },
  ]} primaryCta={{ href: "/sabipay-explained", label: "Understand SabiPay" }} secondaryCta={{ href: "/terms-of-use", label: "Read Terms of Use" }} />;
}
