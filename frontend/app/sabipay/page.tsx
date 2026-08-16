import SabiPayClient from "./SabiPayClient";

export const metadata = {
  title: "SabiPay escrow | SabiWay",
  description: "Fund Nigerian service bookings safely, track the seven-day escrow freeze and manage SabiWay payouts.",
};

export default function SabiPayPage() {
  return <SabiPayClient />;
}
