"use client"

import { motion } from "framer-motion";

export default function Hero(){
    return(
        <div className="mt-20">
            <section className="relative w-full bg-[#008753] text-white md:py-10 py-5 px-4 shadow-lg rounded-b-3xl">
                <div className="absolute inset-0 bg-gradient-to-br from-[#008753] to-[#007445] opacity-70 rounded-b-3xl"></div>

                <div className="relative max-w-3xl mx-auto text-center flex flex-col items-center">
                    <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight mb-2"
                    >
                    Terms of Use
                    </motion.h1>

                    <p className="text-xs sm:text-sm opacity-90">
                    Last Updated: November 7, 2025
                    </p>
                </div>
            </section>
        </div>
        
    )
}