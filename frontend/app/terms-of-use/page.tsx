"use client";

import React from "react";
import { motion } from "framer-motion";

export default function TermsOfUsePage() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 leading-[1.7]">
      {/* HERO */}
     <section className="relative w-full bg-[#008753] text-white md:py-10 py-5 px-4 shadow-lg rounded-b-3xl">
        <div className="absolute inset-0 bg-gradient-to-br from-[#008753] to-[#007445] opacity-70 rounded-b-3xl"></div>

        <div className="relative max-w-3xl mx-auto text-center flex flex-col items-center">
            
            {/* LOGO */}
            <a href="/">
                <img
                src="sabiway_white_logo.png" // <-- replace with your actual logo path
                alt="SabiWay Logo"
                className="w-40 mb-4 opacity-95"
                />
            </a>

            <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight mb-2"
            >
            Terms of Use
            </motion.h1>

            <p className="text-xs sm:text-sm opacity-90">
            Last Updated: November 7, 2025
            </p>
        </div>
        </section>



      {/* WRAPPER */}
      <div className="max-w-3xl mx-auto px-1 md:px-6 py-6 md:py-14">

        {/* CARD */}
        <div className="
          bg-white 
          shadow-md 
          rounded-2xl 
          p-5 
          sm:p-8 
          md:p-12 
          border border-gray-100
        ">

          {/* TOC */}
          <div className="mb-10 sm:mb-12">
            <h2 className="text-md md:text-xl font-semibold mb-4 text-[#008753]">
              Table of Contents
            </h2>

            <ul className="space-y-3 text-gray-700 text-sm sm:text-base">
                {[
                    { id: "acceptance", label: "Acceptance of Terms" },
                    { id: "definitions", label: "Definitions" },
                    { id: "eligibility", label: "Eligibility & Account Registration" },
                    { id: "services", label: "Description of Services" },
                ].map((item) => (
                    <li key={item.id} className="flex items-start gap-3 group">
                    <span className="text-[#008753] font-bold mt-[2px] sm:mt-[3px]">•</span>
                    <button
                        onClick={() => {
                        const section = document.getElementById(item.id);
                        section?.scrollIntoView({
                            behavior: "smooth",
                            block: "start", // aligns section to top
                        });
                        }}
                        className="
                        hover:text-[#008753] 
                        group-hover:translate-x-1 
                        transition-all 
                        duration-200
                        text-left
                        "
                    >
                        {item.label}
                    </button>
                    </li>
                ))}
                </ul>

          </div>

          <div className="border-b border-gray-200 mb-10"></div>

          {/* ACCEPTANCE */}
          <section
            id="acceptance"
            className="mb-12 scroll-mt-28 sm:scroll-mt-32"
          >
            <h2
              className="
                text-lg 
                md:text-3xl 
                font-semibold 
                mb-4 
                text-[#008753] 
                flex 
                items-center 
                gap-3
              "
            >
              <span className="w-2 h-6 sm:h-8 bg-[#008753] rounded-full"></span>
              Acceptance of Terms
            </h2>

            <p className="mb-4 text-sm sm:text-base">
              Welcome to <strong>SabiWay</strong>! These Terms of Use (the
              “Terms,” “Agreement,” or “Terms of Use”) form a legally binding
              agreement between you and <strong>SabiWay LTD</strong> (“SabiWay,”
              “we,” “us,” or “our”) governing your use of:
            </p>

            <ul className="list-disc ml-6 mb-4 space-y-2 text-sm sm:text-base">
              <li>
                The SabiWay website at{" "}
                <a
                  href="https://www.sabiway.com"
                  className="hover:underline hover:decoration-[#008753] text-[#008753]"
                >
                  <em>www.sabiway.com</em>
                </a>
              </li>
              <li>Our iOS and Android applications</li>
              <li>All related services, tools, and features</li>
            </ul>

            <p className="mb-4 text-sm sm:text-base">
              By accessing or using the Platform — including browsing,
              registering, posting content, or interacting — you confirm that
              you:
            </p>

            <ul className="list-disc ml-6 mb-4 space-y-2 text-sm sm:text-base">
              <li>Have read and understood these Terms</li>
              <li>Agree to comply with them</li>
              <li>
                Agree to our <strong>Privacy Policy</strong>
              </li>
            </ul>

            <p className="font-semibold text-red-600 text-sm sm:text-base">
              If you do not agree, you must stop using the Platform immediately.
            </p>
          </section>

          <div className="border-b border-gray-200 mb-12"></div>

          {/* DEFINITIONS */}
          <section
            id="definitions"
            className="mb-12 scroll-mt-28 sm:scroll-mt-32"
          >
            <h2
              className="
                text-lg 
                md:text-3xl 
                font-semibold 
                mb-4 
                text-[#008753] 
                flex 
                items-center 
                gap-3
              "
            >
              <span className="w-2 h-6 sm:h-8 bg-[#008753] rounded-full"></span>
              Definitions
            </h2>

            <ul className="space-y-3 text-sm sm:text-base">
              <li>
                <strong>Customer</strong> — a user who registers to request services…
              </li>
              <li>
                <strong>Service Professional</strong> — individuals or businesses offering services…
              </li>
              <li>
                <strong>User</strong> — anyone who interacts with the Platform…
              </li>
              <li>
                <strong>Visitor</strong> — someone accessing the Platform without an account…
              </li>
              <li>
                <strong>Content</strong> — posts, reviews, images, videos, or any uploaded material…
              </li>
              <li>
                <strong>Services</strong> — features and tools provided by SabiWay…
              </li>
              <li>
                <strong>Booking</strong> — a confirmed service request through the Platform…
              </li>
            </ul>
          </section>

          {/* ELIGIBILITY & ACCOUNT REGISTRATION */}
        <section
            id="eligibility"
            className="mb-12 scroll-mt-28 sm:scroll-mt-32"
            >
            <h2
                className="
                text-lg 
                md:text-3xl 
                font-semibold 
                mb-4 
                text-[#008753] 
                flex 
                items-center 
                gap-3
                "
            >
                <span className="w-2 h-6 sm:h-8 bg-[#008753] rounded-full"></span>
                Eligibility & Account Registration
            </h2>

            {/* AGE REQUIREMENTS */}
            <h3 className="text-md md:text-xl font-semibold mt-6 mb-3 text-gray-800">
                3.1 Age Requirements
            </h3>

            <p className="text-sm sm:text-base mb-4">
                To use the Platform, you must be at least{" "}
                <strong>18 years old</strong> or the age of majority in your
                jurisdiction—whichever is higher. By accessing or using the
                Platform, you represent and warrant that you meet this requirement.
            </p>

            {/* ACCOUNT REGISTRATION */}
            <h3 className="text-md md:text-xl font-semibold mt-8 mb-3 text-gray-800">
                3.2 Account Registration
            </h3>

            <p className="text-sm sm:text-base mb-4">
                Certain features of the Platform require you to create an account.
                By registering, you agree to:
            </p>

            <ul className="list-disc ml-6 mb-4 space-y-2 text-sm sm:text-base">
                <li>Provide accurate, current, and complete information</li>
                <li>Keep your account information updated at all times</li>
                <li>Maintain the confidentiality of your login credentials</li>
                <li>
                Immediately notify SabiWay of any unauthorized access or breach of
                security
                </li>
                <li>
                Accept full responsibility for all activities that occur under your
                account
                </li>
            </ul>

            {/* ACCOUNT TYPES */}
            <h3 className="text-md md:text-xl font-semibold mt-8 mb-3 text-gray-800">
                3.3 Account Types
            </h3>

            <p className="text-sm sm:text-base mb-3 font-semibold">
                Customer Accounts:
            </p>

            <p className="text-sm sm:text-base mb-4">
                Customers must provide their name, email address, phone number,
                physical address, and payment details to create an account and book
                services.
            </p>

            <p className="text-sm sm:text-base mb-3 font-semibold">
                Service Professional Accounts:
            </p>

            <p className="text-sm sm:text-base mb-4">
                Service Professionals must complete a more detailed registration
                process, which may include:
            </p>

            <ul className="list-disc ml-6 mb-4 space-y-2 text-sm sm:text-base">
                <li>Personal and business information</li>
                <li>Service categories and service areas</li>
                <li>Professional licenses or certifications (if applicable)</li>
                <li>Background check authorization and completion</li>
                <li>Identity verification documents</li>
                <li>Tax information (Tax ID, VAT number, etc.)</li>
                <li>Bank account details for payouts</li>
                <li>Optional business profile and portfolio</li>
            </ul>

            {/* TERMINATION */}
            <h3 className="text-md md:text-xl font-semibold mt-8 mb-3 text-gray-800">
                3.4 Account Suspension & Termination
            </h3>

            <p className="text-sm sm:text-base mb-4">
                SabiWay may suspend or terminate your account at any time, with or
                without notice, for reasons including but not limited to:
            </p>

            <ul className="list-disc ml-6 mb-4 space-y-2 text-sm sm:text-base">
                <li>Violation of these Terms</li>
                <li>Fraudulent, abusive, or illegal activity</li>
                <li>Providing false or misleading information</li>
                <li>Failure to pay any owed fees</li>
                <li>Complaints from other Users</li>
                <li>Extended periods of account inactivity</li>
            </ul>

            <p className="text-sm sm:text-base mb-4">
                You may terminate your account at any time by contacting us at{" "}
                <a
                href="mailto:info@sabiway.com"
                className="text-[#008753] hover:underline"
                >
                info@sabiway.com
                </a>{" "}
                or through your Account Settings. Upon termination, your right to use
                the Platform immediately ends.
            </p>
            </section>

            {/* DESCRIPTION OF SERVICES */}
            <section
                id="services"
                className="mb-12 scroll-mt-28 sm:scroll-mt-32"
                >
                <h2
                    className="
                    text-lg 
                    md:text-3xl 
                    font-semibold 
                    mb-4 
                    text-[#008753] 
                    flex 
                    items-center 
                    gap-3
                    "
                >
                    <span className="w-2 h-6 sm:h-8 bg-[#008753] rounded-full"></span>
                    Description of Services
                </h2>

                {/* PLATFORM OVERVIEW */}
                <h3 className="text-md md:text-xl font-semibold mt-6 mb-3 text-gray-800">
                    4.1 Platform Overview
                </h3>

                <p className="text-sm sm:text-base mb-4">
                    SabiWay is a people-based service platform that connects Customers with
                    verified local Service Professionals across multiple categories. The
                    Platform provides the technology and tools that enable Users to:
                </p>

                <ul className="list-disc ml-6 mb-4 space-y-2 text-sm sm:text-base">
                    <li>Search for and discover Service Professionals</li>
                    <li>Request quotes and communicate with Service Professionals</li>
                    <li>Book and schedule services</li>
                    <li>Process payments securely</li>
                    <li>Leave reviews and ratings</li>
                    <li>Manage bookings and service history</li>
                </ul>

                {/* SABIWAY'S ROLE */}
                <h3 className="text-md md:text-xl font-semibold mt-8 mb-3 text-gray-800">
                    4.2 SabiWay's Role
                </h3>

                <p className="text-sm sm:text-base mb-4 font-semibold text-red-600">
                    IMPORTANT:
                </p>

                <p className="text-sm sm:text-base mb-4">
                    SabiWay is a technology platform that facilitates connections between
                    Customers and independent Service Professionals. SabiWay does NOT:
                </p>

                <ul className="list-disc ml-6 mb-4 space-y-2 text-sm sm:text-base">
                    <li>Employ Service Professionals</li>
                    <li>Provide the actual services (plumbing, electrical work, cleaning, etc.)</li>
                    <li>Supervise, direct, or control Service Professionals in performing services</li>
                    <li>Guarantee the quality, safety, or legality of services provided</li>
                    <li>Act as an agent for Customers or Service Professionals</li>
                </ul>

                <p className="text-sm sm:text-base mb-4">
                    Service Professionals are independent contractors who use the Platform
                    to offer services directly to Customers. The contractual relationship
                    for services exists solely between the Customer and the Service
                    Professional—not with SabiWay.
                </p>
                </section>


        </div>
      </div>
    </div>
  );
}
