"use client";
import Image from "next/image";
import { useState } from "react";

export default function Faqs() {
  const faqs = [
    {
      question: "What is SabiWay?",
      answer:
        "SabiWay is a platform that connects Nigerians with verified Nigerian service providers worldwide. From electricians and plumbers to barbers and cleaners, find trusted professionals in your neighborhood with secure payment and community reviews.",
    },
    {
      question: "How does SabiWay work?",
      answer:
        "Search for the service you need, browse verified providers in your area, book an appointment, and pay securely through our escrow system. Payment is only released when you're satisfied with the work.",
    },
    {
      question: "Is SabiWay only for Nigerians?",
      answer:
        "While we specialize in connecting Nigerian service providers with clients, anyone can use SabiWay to find quality local services. Our community values trust, quality, and cultural connection.",
    },
    {
      question: "How much does it cost?",
      answer:
        "Browsing and booking are free for customers. Service providers set their own rates, and you'll see the exact price before confirming any booking.",
    },

    // ⭐⭐⭐ New FAQ added — 1
    {
      question: "What if I'm not satisfied with the service?",
      answer:
        "Our SabiPay escrow system protects you. Payment is only released upon your approval of the completed work. If you encounter an issue, please contact our support team and we will help resolve it.",
    },

    // ⭐⭐⭐ New FAQ added — 2
    {
      question: "How do I become a service provider?",
      answer:
        "Sign up, complete our verification process (including background checks and credential verification), and start receiving booking requests. The verification process typically takes 3–5 business days.",
    },
  ];

  const [openFAQ, setOpenFAQ] = useState<number | null>(null);

  return (
    <section
      id="faqs_section"
      className="w-full px-5 sm:px-10 md:px-16 lg:px-24 py-16 md:py-24 bg-[#E7FFF6]"
    >
      <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 text-center mb-10 md:mb-12">
        FAQs
      </h2>

      <div className="max-w-3xl mx-auto space-y-5 sm:space-y-6">
        {faqs.map((faq, i) => (
          <div
            key={i}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-md"
          >
            <button
              onClick={() => setOpenFAQ(openFAQ === i ? null : i)}
              className="w-full flex justify-between items-center bg-[#008753] text-white font-semibold px-4 sm:px-6 py-4 text-left focus:outline-none"
            >
              <span className="text-sm sm:text-base md:text-lg pr-3">
                {faq.question}
              </span>
              <Image
                src="/faqstar.png"
                alt="FAQ Icon"
                width={20}
                height={20}
                className={`transition-transform duration-300 ${
                  openFAQ === i ? "rotate-180" : ""
                }`}
              />
            </button>

            <div
              className={`transition-all duration-500 ease-in-out overflow-hidden ${
                openFAQ === i
                  ? "max-h-[400px] opacity-100 py-4 sm:py-5"
                  : "max-h-0 opacity-0 py-0"
              }`}
            >
              <p className="text-gray-800 px-4 sm:px-6 text-left leading-relaxed text-sm sm:text-base">
                {faq.answer}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
