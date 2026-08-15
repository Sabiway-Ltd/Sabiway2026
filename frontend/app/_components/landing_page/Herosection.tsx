"use client";

export default function Herosection({ HandleWaitListPopUp }: { HandleWaitListPopUp: () => void }) {
  return (
    <section className="w-full grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 px-6 sm:px-10 md:px-16 pt-24 md:pt-40 pb-24 md:pb-36 items-center relative overflow-hidden">

      {/* LEFT SIDE — TEXT */}
      <div className="text-start md:text-left">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold leading-tight text-gray-900">
          Your <span className="text-[#FAAB2C]">People</span> Are Closer
          Than You <span className="text-[#008753]">Think</span>
        </h1>

        {/* ⭐ Updated body text size */}
        <p className="mt-6 text-base sm:text-lg md:text-xl text-gray-600 font-medium max-w-xl mx-auto md:mx-0 leading-relaxed">
          Wherever you are in the world, SabiWay connects you with trusted 
          Nigerian service providers near you. Fast, easy and secure.
        </p>

        <div className="flex gap-x-2 md:text-[0.95rem] text-[0.85rem] flex-row mt-8 gap-y-3">
          <button onClick={HandleWaitListPopUp}>
            <div className="md:w-[12rem] w-[9rem] py-4 text-center bg-[#008753] md:mb-14 text-white rounded-lg font-semibold shadow hover:bg-[#006B42] transition">
              Join App Waitlist
            </div>
          </button>

          <a href="/signup">
            <div className="md:w-[12rem] w-[9rem] text-center py-4 bg-[#008753] md:mb-14 text-white rounded-lg font-semibold shadow hover:bg-[#006B42] transition">
              Join SabiForum
            </div>
          </a>
        </div>
      </div>

      {/* RIGHT SIDE — IMAGE */}
      <div className="flex justify-center md:justify-end relative z-20 md:mt-0">
        <div className="relative">
          <img
            src="/Hero-phone-mockup_bdhz4b.png"
            alt="SabiWay App Mockup"
            className="w-full h-auto rounded-xl z-20 drop-shadow-lg"
          />
        </div>
      </div>

    </section>
  );
}
