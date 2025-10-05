"use client";
import Image from "next/image";
import { useState } from "react";

export default function Aboutus () {

    return(
         <section className="w-full text-center px-8 md:px-16 py-24">
                <h3 className="text-gray-500 font-medium mb-4">About Us</h3>
                <p className="text-2xl md:text-3xl font-medium text-gray-800 max-w-4xl mx-auto leading-relaxed">
                  SabiWay is a people-powered service platform built for Nigerians — at home and abroad.
                  We believe everyone deserves access to fast, honest, and verified local services —
                  no matter where they are in the world.
                </p>
                <div className="flex justify-center mt-8">
                  <div className="flex items-center border border-gray-300 rounded-full px-6 py-2 text-sm text-gray-700">
                    Trusted by 1000+ Nigerians and Growing — SabiWay Connects You to the Right People, Every Time!
                    <Image src="/Little-images.png" alt="Trusted Users" width={80} height={40} className="ml-3" />
                  </div>
                </div>
                <div className="mt-12 flex justify-center">
                  <Image src="/about-us-image.png" alt="About Us" width={400} height={400} className="rounded-xl" />
                </div>
              </section>
    )
}