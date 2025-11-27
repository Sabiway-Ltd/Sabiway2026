"use client";
import { useState } from "react";

import Navbar from "./_components/landing_page/Navbar";
import Herosection from "./_components/landing_page/Herosection";
import Scrollingpath from "./_components/landing_page/Scrollingpath";
import Aboutus from "./_components/landing_page/Aboutus";
import Serviceprovider from "./_components/landing_page/Serviceprovider";
import Reviewsection from "./_components/landing_page/Reviewsection";
import Faqs from "./_components/landing_page/Faqs";
import Appsection from "./_components/landing_page/Appsection";
import Footer from "./_components/landing_page/Footer";
import WaitlistForm from "./_components/common/WaitlistForm";


export default function Home() {
  const [showWaitlist, setShowWaitlist] = useState(false);

  const HandleWaitListPopUp = () => {
    setShowWaitlist(true);
  };

  return (
    <main className="overflow-x-hidden">
      <Navbar />

      <Herosection HandleWaitListPopUp={HandleWaitListPopUp} />

      {showWaitlist && (
  <WaitlistForm 
    show={showWaitlist}
    onSuccess={() => setShowWaitlist(false)} 
  />
)}


      <Scrollingpath />
      <Aboutus />
      <Serviceprovider />
      <Reviewsection />
      <Faqs />

      <div className="relative">
        <Appsection />
        <div className="relative -mt-20 z-10">
          <Footer />
        </div>
      </div>
    </main>
  );
}

