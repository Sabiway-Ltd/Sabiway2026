// app/privacy-policy/page.tsx

import Navbar from "../_components/landing_page/Navbar";
import PrivacyHero from "./hero";
import PrivacyMain from "./PrivacyMain";

export default function Page() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 leading-[1.7]">
      {/* Navbar */}
      <Navbar />

      {/* Hero */}
      <PrivacyHero />

      {/* Main content */}
      <PrivacyMain />
    </div>
  );
}
