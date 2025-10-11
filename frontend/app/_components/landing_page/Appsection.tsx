"use client";
import Image from "next/image";

export default function Appsection () {
    return(
        <section className="w-full bg-white py-28 px-8 md:px-16 flex flex-col md:flex-row items-center justify-between gap-10 relative z-10">
        <div className="md:w-1/2 md:text-left text-center">
          <h2 className="text-3xl md:text-4xl font-medium text-gray-900 mb-4">
            Book service providers <br /> from your phone
          </h2>
          <p className="text-gray-600 mb-8 leading-relaxed">
            With SabiWay, whether you&apos;re in Lagos or London, booking reliable help
            is now as easy as a tap.
          </p>

          {/* This is supposed to be two different buttons. You can wrap the images inside button
            One for Android Playstore, and the other for Apple store.
           */}
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
    )
}