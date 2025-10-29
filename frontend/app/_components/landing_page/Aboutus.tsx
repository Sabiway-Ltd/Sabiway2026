"use client";
import Image from "next/image";

export default function Aboutus() {
  return (
    <section id="about_us" className="w-full text-center px-6 sm:px-8 md:px-16 lg:px-24 py-16 sm:py-20 md:py-24 lg:py-32">
      {/* Heading */}
      <h3 className="text-gray-500 font-medium text-sm sm:text-base mb-3 sm:mb-4">
        About Us
      </h3>

      {/* Description */}
      <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-medium text-gray-800 max-w-5xl mx-auto leading-relaxed">
        SabiWay is a people-powered service platform built for Nigerians — at home and abroad.
        We believe everyone deserves access to fast, honest, and verified local services —
        no matter where they are in the world.
      </p>

      {/* Trusted Badge */}
      <div className="flex justify-center mt-8">
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
