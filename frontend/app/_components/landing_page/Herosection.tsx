"use client";
import Image from "next/image";

export default function Herosection() {
  return (
    <section className="w-full grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 px-6 sm:px-10 md:px-16 pt-28 pb-20 md:pb-32 items-center relative overflow-hidden">
      {/* LEFT SIDE — TEXT */}
      <div className="text-start md:text-left">
        <h1 className="text-2xl sm:text-3xl md:text-5xl font-extrabold leading-tight text-gray-900">
          Your <span className="text-[#FAAB2C]">People</span> Are Closer
          Than You <span className="text-[#008753]">Think</span>
        </h1>
        <p className="mt-5 text-sm md:text-lg text-gray-600 font-medium max-w-md mx-auto md:mx-0">
          From anywhere in the world, you can find trusted hands in Nigeria.
          SabiWay connects you to reliable local services — fast, easy, and secure.
        </p>
        <button className="mt-8 px-8 py-4 bg-[#008753] mb-14 text-white rounded-[15px] font-semibold shadow hover:bg-[#006B42] transition w-fit sm:w-auto">
          Join the Waitlist
        </button>
      </div>

      {/* RIGHT SIDE — IMAGE */}
      <div className="flex justify-center md:justify-end relative z-20 mt-10 md:mt-0">
        <div className="relative w-[80%] sm:w-[70%] md:w-[90%] max-w-[420px]">
          <Image
            src="/Hero phone mockup.png"
            alt="SabiWay App Mockup"
            width={960}
            height={1520}
            className="w h-auto rounded-xl z-20"
            priority
          />
        </div>
      </div>
    </section>
  );
}
