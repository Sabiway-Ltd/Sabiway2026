"use client";
import Image from "next/image";

export default function Appsection () {
  return (
    <section className="w-full bg-white pt-28 px-8 md:px-16 flex flex-col md:flex-row items-center justify-between gap-10 relative z-10">
      <div className="md:w-1/2 md:text-left text-center">
        <h2 className="text-3xl md:text-4xl font-semibold text-gray-900 mb-4">
          Book service providers <br /> from your phone
        </h2>

        {/* ⭐ Updated body text size */}
        <p className="text-gray-600 mb-8 leading-relaxed text-base sm:text-lg md:text-xl">
          Download the SabiWay app and find verified Nigerian <br></br>professionals in your neighbourhood, 
          whether you need a <br></br> quick haircut or an emergency home maintenance service.
        </p>

        <Image
          src="/pstoreapple.png"
          alt="Google Play and App Store"
          width={350}
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
  );
}
