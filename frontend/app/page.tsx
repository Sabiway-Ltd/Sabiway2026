"use client"; // Needed for animation
import Image from "next/image";
import { useState } from "react";
import LandingNavbar from "./_components/LandingNavbar";

export default function Home() {
  const services = [
    "Cleaning",
    "Fitness",
    "Repairs",
    "Beauty",
    "Chefs",
    "Drivers",
    "Carpenters",
    "Tailors",
  ];

  const reviews = [
    {
      text: "SabiWay helped me find a painter in less than 1 hour. Super fast and very trustworthy service!",
      name: "Amina B.",
      location: "Abuja",
    },
    {
      text: "I booked a cleaner through SabiWay and the service was excellent. Highly recommended!",
      name: "Chinedu O.",
      location: "Lagos",
    },
    {
      text: "Thanks to SabiWay, I got a fitness trainer near me the same day. Amazing platform!",
      name: "Fatima K.",
      location: "Kano",
    },
    {
      text: "I love how quick and reliable this platform is. Will definitely keep using it.",
      name: "Emeka I.",
      location: "Port Harcourt",
    },
  ];

  const faqs = [
    {
      question: "Who can use SabiWay?",
      answer:
        "Anyone! Customers looking for services and professionals offering services — both within Nigeria and abroad — can join and benefit from the platform.",
    },
    {
      question: "How do I find a service provider?",
      answer:
        "Click on “Join as a Provider,” complete your profile, upload valid ID for verification, and list your services. Once approved, clients can start finding and booking you.",
    },
    {
      question: "Can I use SabiWay from abroad?",
      answer:
        "Yes! Customers abroad can use SabiWay to connect with reliable service providers in Nigeria.",
    },
    {
      question: "Is SabiWay safe to use?",
      answer:
        "Absolutely. All providers are verified with valid IDs and go through strict checks to ensure trust and safety.",
    },
  ];

  const [openFAQ, setOpenFAQ] = useState<number | null>(null);

  return (
    <main className="bg-white">
      {/* ================= NAVBAR ================= */}
      <LandingNavbar/>

      {/* ================= HERO SECTION ================= */}
      <section className="w-screen grid grid-cols-12 gap-[32px] px-8 md:px-16 pt-20 pb-32 items-center relative">
        <div className="col-span-12 md:col-span-6">
          <h1 className="text-5xl font-extrabold leading-tight text-gray-900">
            Your <span className="text-[#FAAB2C]">People</span> Are Closer <br />
            Than You <span className="text-[#008753]">Think</span>
          </h1>
          <p className="mt-6 text-lg text-gray-600 max-w-lg font-medium">
            From anywhere in the world, you can find trusted hands in Nigeria. 
            SabiWay connects you to reliable local services — fast, easy, and secure.
          </p>
          <button className="mt-8 px-8 py-4 bg-[#008753] text-white rounded-[15px] font-semibold shadow hover:bg-[#006B42] transition">
            Join the Waitlist
          </button>
        </div>
        <div className="col-span-12 md:col-span-6 flex justify-start relative z-20 mt-12 ml-[-40px]">
          <Image
            src="/Hero phone mockup.png"
            alt="SabiWay App Mockup"
            width={760}
            height={1520}
            className="rounded-xl z-20"
            priority
          />
        </div>
      </section>

      {/* ================= SERVICES MARQUEE ================= */}
      <section className="w-full bg-[#008753] py-6 overflow-hidden relative z-30 -mt-36">
        <div className="flex animate-marquee space-x-12 whitespace-nowrap">
          {[...services, ...services].map((service, i) => (
            <div key={i} className="flex items-center space-x-2 text-white font-medium px-6">
              <Image src="/marquee-icon.png" alt={service} width={28} height={28} />
              <span>{service}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ================= ABOUT US SECTION ================= */}
      <section className="w-full text-center px-8 md:px-16 py-24">
        <h3 className="text-gray-500 font-medium mb-4">About Us</h3>
        <p className="text-2xl md:text-3xl font-medium text-gray-800 max-w-4xl mx-auto leading-relaxed">
          SabiWay is a people-powered service platform built for Nigerians — at home and abroad. 
          We believe everyone deserves access to fast, honest, and verified local services — 
          no matter where they are in the world.
        </p>
        <div className="flex justify-center mt-8">
          <div className="flex items-center border border-gray-300 rounded-full px-6 py-2 text-sm text-gray-700">
            Trusted by 1000+ Nigerians and Growing — SabiWay Connects You to the Right People, Every Time!
            <Image src="/Little-images.png" alt="Trusted Users" width={80} height={40} className="ml-3" />
          </div>
        </div>
        <div className="mt-12 flex justify-center">
          <Image
            src="/about-us-image.png"
            alt="About Us"
            width={400}
            height={400}
            className="rounded-xl"
          />
        </div>
      </section>

      {/* ================= PROVIDERS SECTION ================= */}
      <section className="w-full text-center px-8 md:px-16 py-20">
        <h3 className="text-gray-500 font-medium mb-10">Service Providers You Might Like</h3>
        <div className="flex justify-center">
          <Image
            src="/providers-image.svg"
            alt="Service Providers"
            width={1000}
            height={600}
            className="w-full max-w-5xl h-auto"
            priority
          />
        </div>
      </section>

      {/* ================= REVIEWS MARQUEE ================= */}
      <section className="w-full text-center px-8 md:px-16 py-24">
        <h3 className="text-gray-500 font-medium mb-4">What people are saying</h3>
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-12">
          Real stories from customers and service providers
        </h2>

        {/* Top Row - Moves Left */}
        <div className="overflow-hidden relative w-full mb-10">
          <div className="flex space-x-6 animate-marquee-left">
            {[...reviews, ...reviews].map((review, i) => (
              <div
                key={i}
                className="min-w-[350px] md:min-w-[400px] bg-white border border-gray-300 rounded-lg p-6 shadow-sm"
              >
                <p className="text-lg text-gray-700 italic">“{review.text}”</p>
                <div className="flex justify-center mt-4 text-[#FAAB2C]">★★★★★</div>
                <p className="mt-2 text-sm text-gray-600">-{review.name} from {review.location}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Row - Moves Right */}
        <div className="overflow-hidden relative w-full">
          <div className="flex space-x-6 animate-marquee-right">
            {[...reviews, ...reviews].map((review, i) => (
              <div
                key={i}
                className="min-w-[350px] md:min-w-[400px] bg-white border border-gray-300 rounded-lg p-6 shadow-sm"
              >
                <p className="text-lg text-gray-700 italic">“{review.text}”</p>
                <div className="flex justify-center mt-4 text-[#FAAB2C]">★★★★★</div>
                <p className="mt-2 text-sm text-gray-600">-{review.name} from {review.location}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= FAQ SECTION ================= */}
      <section className="w-full text-center px-8 md:px-16 py-24 bg-[#F0FFF8]">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-12">FAQs</h2>
        <div className="max-w-3xl mx-auto space-y-6">
          {faqs.map((faq, i) => (
            <div key={i} className="text-left">
              <button
                onClick={() => setOpenFAQ(openFAQ === i ? null : i)}
                className="w-full flex justify-between items-center bg-[#008753] text-white font-medium px-6 py-4 rounded-[12px] shadow-md"
              >
                {faq.question}
                <span className="text-[#FAAB2C] text-xl">★</span>
              </button>
              {openFAQ === i && (
                <div className="mt-2 bg-white border-l-4 border-[#FAAB2C] rounded-lg p-4 text-gray-700 shadow">
                  {faq.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ================= TAILWIND KEYFRAMES ================= */}
      <style jsx>{`
        @keyframes marquee-left {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
        @keyframes marquee-right {
          0% { transform: translateX(0%); }
          100% { transform: translateX(50%); }
        }
        .animate-marquee-left {
          animation: marquee-left 25s linear infinite;
        }
        .animate-marquee-right {
          animation: marquee-right 25s linear infinite;
        }
      `}</style>
    </main>
  );
}
   