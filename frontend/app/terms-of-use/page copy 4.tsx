"use client";

import React from "react";
import Navbar from "../_components/landing_page/Navbar";
import { motion } from "framer-motion";

export default function TermsOfUsePage() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 leading-relaxed">
      <Navbar />

      {/* HERO */}
      <section className="w-full bg-[#008753] text-white mt-24 md:mt-20 py-20 px-6 shadow-lg">
        <div className="max-w-4xl mx-auto text-center">
          <motion.h1
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl md:text-5xl font-extrabold mb-3"
          >
            SabiWay — Terms of Use
          </motion.h1>

          <p className="text-sm opacity-90 tracking-wide">
            Last Updated: November 7, 2025
          </p>
        </div>
      </section>

      {/* PAGE WRAPPER */}
      <div className="max-w-4xl mx-auto px-6 py-12">

        {/* CARD */}
        <div className="bg-white shadow-md rounded-2xl p-8 md:p-12 border border-gray-100">

          {/* TABLE OF CONTENTS */}
          <div className="mb-12">
            <h2 className="text-xl font-semibold mb-4 text-[#008753]">
              Table of Contents
            </h2>

            <ul className="space-y-3 text-gray-700 text-base">
              {[
                { id: "acceptance", label: "Acceptance of Terms" },
                { id: "definitions", label: "Definitions" },
              ].map((item) => (
                <li key={item.id} className="flex items-start gap-2">
                  <span className="text-[#008753] font-semibold mt-[2px]">•</span>
                  <a
                    href={`#${item.id}`}
                    className="hover:text-[#008753] transition-colors duration-200"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* ACCEPTANCE */}
          <section id="acceptance" className="mb-12">
            <h2 className="text-3xl font-semibold mb-4 text-[#008753] flex items-center gap-3">
              <span className="w-2 h-8 bg-[#008753] rounded-full"></span>
              Acceptance of Terms
            </h2>

            <p className="mb-4">
              Welcome to <strong>SabiWay</strong>! These Terms of Use (the
              “Terms,” “Agreement,” or “Terms of Use”) form a legally binding
              agreement between you and <strong>SabiWay LTD</strong> (“SabiWay,”
              “we,” “us,” or “our”) governing your use of:
            </p>

            <ul className="list-disc ml-6 mb-4">
              <li>The SabiWay website located at <a href="https://www.sabiway.com" className="hover:underline hover:decoration-[#008753] text-[#008753]"><em>www.sabiway.com</em></a>,</li>
              <li>Our iOS and Android mobile applications, and</li>
              <li>All related services, features, and tools.</li>
            </ul>

            <p className="mb-4">
              By accessing or using the Platform — including browsing,
              registering, posting content, or interacting with any part of the
              service — you confirm that you:
            </p>

            <ul className="list-disc ml-6 mb-4">
              <li>Have read and understood these Terms,</li>
              <li>Agree to comply with them, and</li>
              <li>
                Agree to our <strong>Privacy Policy</strong>, which is part of
                this Agreement.
              </li>
            </ul>

            <p className="font-semibold text-red-600">
              If you do not agree, you must stop using the Platform immediately.
            </p>
          </section>

          {/* DEFINITIONS */}
          <section id="definitions" className="mb-12">
            <h2 className="text-3xl font-semibold mb-4 text-[#008753] flex items-center gap-3">
              <span className="w-2 h-8 bg-[#008753] rounded-full"></span>
              Definitions
            </h2>

            <ul className="space-y-3">
              <li>
                <strong>Customer</strong> — a user who registers to request
                services…
              </li>
              <li>
                <strong>Service Professional</strong> — an individual or
                business providing services…
              </li>
              <li>
                <strong>User</strong> — anyone who uses the Platform…
              </li>
              <li>
                <strong>Visitor</strong> — a non-registered person accessing
                the Platform…
              </li>
              <li>
                <strong>Content</strong> — text, images, videos, comments,
                reviews, or any material posted…
              </li>
              <li>
                <strong>Services</strong> — the tools, features, and
                functionalities provided by SabiWay…
              </li>
              <li>
                <strong>Booking</strong> — a confirmed service request arranged
                through the Platform…
              </li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
