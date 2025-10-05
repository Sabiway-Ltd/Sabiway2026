"use client";
import Image from "next/image";
import { useState } from "react";

export default function Reviewsection () {

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
    return(
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
              </section>
    )
}