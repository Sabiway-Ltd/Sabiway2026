"use client";

import Link from "next/link";

export default function Herosection({HandleWaitListPopUp}) {
  return (
    <section className="w-full grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 px-6 sm:px-10 md:px-16 pt-24 md:pt-40 pb-24 md:pb-36 items-center relative overflow-hidden">
      {/* LEFT SIDE — TEXT */}
      <div className="text-start md:text-left">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold leading-tight text-gray-900">
          Your <span className="text-[#FAAB2C]">People</span> Are Closer 
          Than You <span className="text-[#008753]">Think</span>
        </h1>

        <p className="mt-6 text-sm md:text-lg text-gray-600 font-medium max-w-md mx-auto md:mx-0 leading-relaxed">
          From anywhere in the world, you can find trusted hands in Nigeria.
          SabiWay connects you to reliable local services — fast, easy, and secure.
        </p>

        <div className="flex gap-x-2 md:text-[0.95rem] text-sm flex-row mt-8 gap-y-3">
          <button 
            onClick={HandleWaitListPopUp}
            >
            <div className="md:w-[12rem] w-[9rem] py-4 text-center bg-[#008753] md:mb-14 text-white rounded-lg font-semibold shadow hover:bg-[#006B42] transition ">
              Join App Waitlist
            </div>
          </button>

          <a 
            href={"/signup"}
            >
              <div className=" md:w-[12rem] w-[11rem] text-center py-4 bg-[#008753] md:mb-14 text-white rounded-lg font-semibold shadow hover:bg-[#006B42] transition ">
                Join the Community
              </div>
          </a>
        </div>
      </div>

      {/* RIGHT SIDE — IMAGE */}
      <div className="flex justify-center md:justify-end relative z-20 md:mt-0">
        <div className="relative">
          <img
            src="https://res.cloudinary.com/dk6ew5ikb/image/upload/v1761610791/Hero-phone-mockup_bdhz4b.png"
            alt="SabiWay App Mockup"
            className="w-full h-auto rounded-xl z-20 drop-shadow-lg"
          />
        </div>
      </div>
    </section>
  );
}
