"use client";
import Image from "next/image";
import { useState } from "react";

export default function Serviceprovider () {
    return(
        <section className="w-full text-center px-8 md:px-16 py-20">
        <h3 className="text-gray-500 font-medium mb-10">Service Providers You Might Like</h3>

        {/* These are supposed to be individual cards, not image. */}
        <div className="flex justify-center">
          <Image
            src="/providers-image.svg"
            alt="Service Providers"
            width={1000}
            height={600}
            className="w-full max-w-5xl h-auto"
            priority
          />
        </div>
      </section>
    )
}