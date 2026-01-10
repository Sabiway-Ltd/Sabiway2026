// app/about_us/page.tsx

"use client";
import Navbar from "../_components/landing_page/Navbar";
import Footer from "../_components/landing_page/Footer";

export default function AboutUsPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Navbar */}
      <Navbar />

      {/* ========================= HERO ========================= */}
      <section className="w-full flex justify-center mt-24 md:mt-28 px-4 sm:px-6">
        <div className="w-full max-w-[1150px] bg-[#008753] text-white rounded-3xl px-6 md:px-10 py-10 md:py-14 text-center shadow-[0_4px_20px_rgba(0,135,83,0.2)]">
          <p className="text-xs sm:text-sm font-semibold tracking-widest opacity-90">
            ABOUT SABIWAY
          </p>

          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mt-3 md:mt-4">
            Built to connect Nigerians with trusted local services
          </h1>

          <p className="mt-4 md:mt-6 text-sm md:text-base lg:text-lg max-w-3xl mx-auto leading-relaxed opacity-95 px-2 sm:px-0">
            SabiWay is a people-powered service marketplace helping Nigerians at home
            and across the diaspora book verified professionals with confidence.
          </p>
        </div>
      </section>


      {/* Main Content */}
      <main className="flex-1 md:text-lg mt-6 px-6 md:px-16 max-w-6xl mx-auto">
        <section className="mb-16">
          <p className=" text-gray-800 mb-4">
            SabiWay is a people-powered service platform built for Nigerians at home and across the diaspora. We believe everyone deserves access to fast, honest and verified local services, no matter where they are in the world.
          </p>
          <p className=" text-gray-800 mb-4">
            As a Nigerian-led service marketplace, SabiWay makes it easy to book reliable local services and manage your day-to-day tasks without stress. The platform connects customers with verified Nigerian service providers across multiple categories, including barbers, cleaners, electricians, plumbers, painters and handypersons.
          </p>
          <p className=" text-gray-800 mb-4">
            Whether you're in Lagos, London or Los Angeles, SabiWay brings trusted Nigerian service providers closer than ever. No more driving around neighbourhoods, making endless calls or searching through unfiltered lists.
          </p>
          <p className=" text-gray-800">
            Every professional on SabiWay is vetted and verified, so you can book with confidence knowing you are working with skilled, dependable and trustworthy Nigerian service providers.
          </p>
        </section>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
