"use client";
import Image from "next/image";
import { useState } from "react";

export default function Scrollingpath () {
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

    return(
        
      <section className="w-full bg-[#008753] py-6 overflow-hidden relative z-30 -mt-36 md:-mt-40">
        <div className="flex animate-marquee space-x-12 whitespace-nowrap">
          {[...services, ...services].map((service, i) => (
            <div key={i} className="flex items-center space-x-2 text-white font-medium px-6">
              <Image src="/marquee-icon.png" alt={service} width={28} height={28} />
              <span>{service}</span>
            </div>
          ))}
        </div>
      </section>
    )
}