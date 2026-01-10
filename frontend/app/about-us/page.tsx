// app/about_us/page.tsx

"use client";
import Navbar from "../_components/landing_page/Navbar";
import Footer from "../_components/landing_page/Footer";

export default function AboutUsPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Navbar */}
      <Navbar />

      {/* Main Content */}
      <main className="flex-1 mt-24 md:mt-32 px-6 md:px-16 max-w-6xl mx-auto">
        <section className="mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-[#008753] mb-6">
            About Us
          </h1>
          <p className="text-lg md:text-xl text-gray-800 mb-4">
            SabiWay is a people-powered service platform built for Nigerians at home and across the diaspora. We believe everyone deserves access to fast, honest and verified local services, no matter where they are in the world.
          </p>
          <p className="text-lg md:text-xl text-gray-800 mb-4">
            As a Nigerian-led service marketplace, SabiWay makes it easy to book reliable local services and manage your day-to-day tasks without stress. The platform connects customers with verified Nigerian service providers across multiple categories, including barbers, cleaners, electricians, plumbers, painters and handypersons.
          </p>
          <p className="text-lg md:text-xl text-gray-800 mb-4">
            Whether you're in Lagos, London or Los Angeles, SabiWay brings trusted Nigerian service providers closer than ever. No more driving around neighbourhoods, making endless calls or searching through unfiltered lists.
          </p>
          <p className="text-lg md:text-xl text-gray-800">
            Every professional on SabiWay is vetted and verified, so you can book with confidence knowing you are working with skilled, dependable and trustworthy Nigerian service providers.
          </p>
        </section>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
