import React from "react";
import TermsOfUseMain from "./TermsOfUseMain";
import Navbar from "../_components/landing_page/Navbar";
import Hero from "./hero";


export default function Page() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 leading-[1.7]">
      {/* Navbar */}
      <Navbar/>

      {/* HERO */}
      <Hero/>


      {/* Main Content */}
      <TermsOfUseMain/>
      
    </div>
  );
}