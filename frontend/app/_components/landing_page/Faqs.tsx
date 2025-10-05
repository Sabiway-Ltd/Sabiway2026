"use client";
import Image from "next/image";
import { useState } from "react";

export default function Faqs () {

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
    return(
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
        
    )
}