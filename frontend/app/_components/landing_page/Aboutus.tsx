"use client";
import Image from "next/image";
import Link from "next/link";

export default function Aboutus() {
  return (
    <section
      id="about_us"
      className="w-full text-center px-6 sm:px-8 md:px-16 lg:px-24 py-16 sm:py-20 md:py-24 lg:py-32"
    >
      {/* Heading */}
      <h3 className="text-gray-500 font-medium text-sm sm:text-base mb-3 sm:mb-4">
        About Us
      </h3>

      {/* Description */}
      <h2 className="text-xl sm:text-2xl md:text-4xl text-gray-900 mb-10 sm:mb-12 text-center font-medium">
        SabiWay is a people-powered service platform built for <br />
        Nigerians at home and across the diaspora.
      </h2>

      {/* Shortened Content */}
      <div className="space-y-5 text-sm sm:text-base md:text-lg font-normal text-gray-800 max-w-5xl mx-auto leading-relaxed">
        <p>
          We believe everyone deserves access to fast, honest, and verified local
          services, no matter where they are in the world. SabiWay makes it easy
          to book reliable Nigerian service providers across essential categories.
        </p>

        <p>
          Whether you're in Lagos, London, or Los Angeles, SabiWay brings trusted
          local professionals closer than ever.
        </p>
      </div>

      {/* CTA */}
      <div className="mt-8">
        <Link
          href="/about-us"
          className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-[#008753] text-white text-sm sm:text-base font-medium hover:bg-[#006b41] transition"
        >
          Learn more about SabiWay →
        </Link>
      </div>

      {/* Trusted Badge */}
      <div className="flex justify-center mt-10">
        <div className="flex flex-wrap items-center justify-center border border-gray-300 rounded-full px-4 sm:px-6 py-5 sm:py-3 text-xs sm:text-sm md:text-base text-gray-700 bg-white shadow-sm">
          <span className="text-center">
            Trusted by 1000+ Nigerians and Growing — SabiWay Connects You to the Right People, Every Time!
          </span>
          <Image
            src="/Little-images.png"
            alt="Trusted Users"
            width={80}
            height={40}
            className="ml-2 sm:ml-3 mt-2 sm:mt-0"
          />
        </div>
      </div>

      {/* Image */}
      <div className="mt-10 sm:mt-12 flex justify-center">
        <div className="w-64 sm:w-80 md:w-[22rem] lg:w-[26rem] xl:w-[30rem]">
          <Image
            src="/about-us-image.png"
            alt="About Us"
            width={500}
            height={500}
            className="rounded-xl w-full h-auto object-cover"
            priority
          />
        </div>
      </div>
    </section>
  );
}
