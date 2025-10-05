"use client";
import Image from "next/image";
import { useState } from "react";
import Navbar from "./_components/landing_page/Navbar";

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
    <main className="bg-white overflow-x-hidden">
      
      {/* NAVBAR */}
      <Navbar />


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
          <Image src="/about-us-image.png" alt="About Us" width={400} height={400} className="rounded-xl" />
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

        <div className="overflow-hidden relative w-full mb-10">
          <div className="flex space-x-6 animate-marquee-left">
            {[...reviews, ...reviews].map((review, i) => (
              <div
                key={i}
                className="min-w-[350px] md:min-w-[400px] bg-white border border-gray-300 rounded-lg p-6 shadow-sm"
              >
                <p className="text-lg text-gray-700 italic">“{review.text}”</p>
                <div className="flex justify-center mt-4 text-[#FAAB2C]">★★★★★</div>
                <p className="mt-2 text-sm text-gray-600">
                  -{review.name} from {review.location}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="overflow-hidden relative w-full">
          <div className="flex space-x-6 animate-marquee-right">
            {[...reviews, ...reviews].map((review, i) => (
              <div
                key={i}
                className="min-w-[350px] md:min-w-[400px] bg-white border border-gray-300 rounded-lg p-6 shadow-sm"
              >
                <p className="text-lg text-gray-700 italic">“{review.text}”</p>
                <div className="flex justify-center mt-4 text-[#FAAB2C]">★★★★★</div>
                <p className="mt-2 text-sm text-gray-600">
                  -{review.name} from {review.location}
                </p>
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
            <div key={i} className="bg-white rounded-[16px] shadow-md overflow-hidden transition-all duration-300">
              <button
                onClick={() => setOpenFAQ(openFAQ === i ? null : i)}
                className="w-full flex justify-between items-center bg-[#008753] text-white font-semibold px-6 py-4 rounded-t-[16px] focus:outline-none"
              >
                <span className="text-[16px] md:text-[17px]">{faq.question}</span>
                <Image src="/faqstar.png" alt="FAQ Star" width={20} height={20} />
              </button>

              <div
                className={`transition-all duration-500 ease-in-out overflow-hidden ${
                  openFAQ === i ? "max-h-[300px] opacity-100 py-5" : "max-h-0 opacity-0 py-0"
                }`}
              >
                <p className="text-gray-800 px-6 text-left leading-relaxed text-[15px] md:text-[16px]">
                  {faq.answer}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ================= DOWNLOAD APP SECTION ================= */}
      <section className="w-full bg-white py-28 px-8 md:px-16 flex flex-col md:flex-row items-center justify-between gap-10 relative z-10">
        <div className="md:w-1/2 text-left">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Book service providers <br /> from your phone
          </h2>
          <p className="text-gray-600 mb-8 leading-relaxed">
            With SabiWay, whether you're in Lagos or London, booking reliable help
            is now as easy as a tap.
          </p>
          <Image
            src="/pstoreapple.png"
            alt="Google Play and App Store"
            width={240}
            height={70}
            className="mt-4"
          />
        </div>

        <div className="md:w-1/2 flex justify-center items-end relative">
          <Image
            src="/Mockup.png"
            alt="SabiWay App Mockup"
            width={700}
            height={800}
            className="w-full max-w-[700px] h-auto"
            priority
          />
        </div>
      </section>

        {/* ================= FOOTER SECTION ================= */}
    <footer className="relative bg-[#008753] text-white py-12 px-8 md:px-16 -mt-55 z-20">
      <div className="max-w-[2000px] mx-auto text-left">
        {/* Navigation Links */}
        <div className="flex flex-col gap-6">
          {/* First Row */}
          <div className="flex flex-wrap justify-between gap-x-8 gap-y-3 text-sm font-medium">
            <a href="#">Home</a>
            <a href="#">About Us</a>
            <a href="#">For Clients</a>
            <a href="#">For Service Providers</a>
            <a href="#">FAQ</a>
            <a href="#">Contact Us</a>
            <a href="#">Help Center</a>
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
          </div>

          {/* Second Row */}
          <div className="flex flex-wrap justify-start gap-x-10 gap-y-3 text-sm font-medium">
            <a href="#">Instagram</a>
            <a href="#">Facebook</a>
            <a href="#">Report a Problem</a>
          </div>
        </div>

        {/* Divider Line */}
        <div className="border-t border-white/20 my-8"></div>

        {/* Copyright */}
        <p className="text-sm leading-relaxed mb-12">
          © 2025 SabiWay. All Rights Reserved. <br />
          Built for communities, powered by trust.
        </p>

        {/* Footer Logo */}
        <div className="w-full flex justify-start mt-6">
          <Image
            src="/Footerlogo.svg"
            alt="SabiWay Footer Logo"
            width={3800}
            height={1200}
            className="w-full max-w-[1900px] h-auto"
            priority
          />
        </div>
      </div>
    </footer>

      {/* ================= TAILWIND KEYFRAMES ================= */}
      <style jsx>{`
        @keyframes marquee-left {
          0% {
            transform: translateX(0%);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        @keyframes marquee-right {
          0% {
            transform: translateX(0%);
          }
          100% {
            transform: translateX(50%);
          }
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
