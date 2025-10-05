"use client";

export default function Herosection() {
  return (
    <section className="w-full grid grid-cols-1 mb-10 md:mb-0 md:grid-cols-2 gap-10 md:gap-16 px-6 sm:px-10 md:px-16 pt-28 pb-20 md:pb-32 items-center relative overflow-hidden">
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
        <button className="mt-8 px-8 py-4 bg-[#008753] md:mb-14 text-white rounded-[15px] font-semibold shadow hover:bg-[#006B42] transition w-fit sm:w-auto">
          Join the Waitlist
        </button>
      </div>

      {/* RIGHT SIDE — IMAGE */}
      <div className="flex justify-center md:justify-end relative z-20  md:mt-0">
        <div className="relative  ">
          <img 
              src="/Hero phone mockup.png" 
              alt="SabiWay App Mockup"
              className="w-full h-auto rounded-xl z-20"/>
  
        </div>
      </div>
    </section>
  );
}
