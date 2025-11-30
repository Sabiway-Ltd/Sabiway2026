"use client";

import React from "react";
import Navbar from "../_components/landing_page/Navbar";

export default function TermsOfUsePage() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      <Navbar />

      {/* Hero */}
      <header className="relative mt-24 md:mt-20">
        <div className="w-full bg-[#008753] text-white py-20 px-6 clip-diagonal">
          <div className="max-w-5xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-extrabold">
              Terms of Use
            </h1>
            <p className="text-sm mt-2 opacity-90">Updated November 7, 2025</p>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-5xl mx-auto px-6 py-12">
        <div className="bg-white shadow-xl rounded-2xl p-8 md:p-12 border border-gray-100">

          {/* Table of Contents */}
          <nav className="mb-12">
            <h2 className="text-xl font-semibold mb-4 text-[#008753]">
              Table of Contents
            </h2>
            <ul className="space-y-2 text-gray-700 text-sm md:text-base list-disc ml-6">
              <li><a href="#acceptance" className="hover:text-[#008753]">Acceptance of Terms</a></li>
              <li><a href="#definitions" className="hover:text-[#008753]">Definitions</a></li>
              <li><a href="#full-terms" className="hover:text-[#008753]">Full Terms</a></li>
            </ul>
          </nav>

          {/* ACCEPTANCE */}
          <section id="acceptance" className="mb-12">
            <h2 className="text-3xl font-semibold mb-4 text-[#008753] flex items-center gap-3">
              <span className="w-2 h-8 bg-[#008753] rounded-full"></span>
              Acceptance of Terms
            </h2>
            <p className="leading-relaxed mb-4">
              Welcome to SabiWay. These Terms of Use constitute a binding
              agreement between you and SabiWay LTD ("SabiWay", "we", "us",
              or "our") regarding your use of our website, mobile apps, and
              associated services (the “Platform”).
            </p>
            <p className="leading-relaxed mb-4">
              By using the Platform—including browsing, creating an account,
              posting content, or interacting with customers or professionals—
              you acknowledge that you have read and agree to these Terms and
              our Privacy Policy.
            </p>
            <p className="font-semibold text-red-600">
              If you do not agree with these Terms, do not use the Platform.
            </p>
          </section>

          {/* DEFINITIONS */}
          <section id="definitions" className="mb-12">
            <h2 className="text-3xl font-semibold mb-4 text-[#008753] flex items-center gap-3">
              <span className="w-2 h-8 bg-[#008753] rounded-full"></span>
              Definitions
            </h2>

            <ul className="space-y-3 text-gray-700">
              <li><strong>Customer:</strong> A user who hires or requests services.</li>
              <li><strong>Service Professional:</strong> An individual or business offering services.</li>
              <li><strong>User:</strong> Anyone who accesses the Platform.</li>
              <li><strong>Visitor:</strong> A non-registered user browsing the Platform.</li>
              <li><strong>Content:</strong> Posts, images, videos, reviews, or other contributions.</li>
              <li><strong>Services:</strong> Platform features, tools, and connections provided by SabiWay.</li>
              <li><strong>Booking:</strong> A confirmed service engagement between a Customer and Professional.</li>
            </ul>
          </section>

          {/* FULL TERMS TEXT */}
          <section id="full-terms">
            <h2 className="text-3xl font-semibold mb-4 text-[#008753] flex items-center gap-3">
              <span className="w-2 h-8 bg-[#008753] rounded-full"></span>
              Full Terms of Use
            </h2>

            <div className="prose max-w-none">
              <p>[Your full Terms of Use content goes here.]</p>
              <p>You can paste, expand, or break it into sections as needed.</p>
            </div>
          </section>

        </div>
      </main>

      {/* Decorative CSS for diagonal hero */}
      <style>{`
        .clip-diagonal {
          position: relative;
          z-index: 1;
        }
        .clip-diagonal::after {
          content: "";
          position: absolute;
          bottom: -40px;
          left: 0;
          width: 100%;
          height: 40px;
          background: #008753;
          clip-path: polygon(0 0, 100% 100%, 0 100%);
          z-index: -1;
        }
      `}</style>
    </div>
  );
}
