"use client";
import Navbar from "./_components/landing_page/Navbar";
import Herosection from "./_components/landing_page/Herosection";
import Scrollingpath from "./_components/landing_page/Scrollingpath";
import Aboutus from "./_components/landing_page/Aboutus";
import Serviceprovider from "./_components/landing_page/Serviceprovider";
import Reviewsection from "./_components/landing_page/Reviewsection";
import Faqs from "./_components/landing_page/Faqs";
import Appsection from "./_components/landing_page/Appsection";
import Footer from "./_components/landing_page/Footer";


export default function Home() {

  return (
    <main className="bg-white overflow-x-hidden">
      
      {/* NAVBAR */}
      <Navbar />


      {/* ================= HERO SECTION ================= */}
      <Herosection  />
      
      {/* ================= SERVICES MARQUEE ================= */}
      <Scrollingpath  />

      {/* ================= ABOUT US SECTION ================= */}
      <Aboutus  />

      {/* ================= PROVIDERS SECTION ================= */}
      <Serviceprovider />

      {/* ================= REVIEWS MARQUEE ================= */}
      <Reviewsection  />

      {/* ================= FAQ SECTION ================= */}
      <Faqs  />
      
      {/* ================= DOWNLOAD APP SECTION ================= */}
      <Appsection  />

        {/* ================= FOOTER SECTION ================= */}
       <Footer  />
    
      
    </main>
  );
}
