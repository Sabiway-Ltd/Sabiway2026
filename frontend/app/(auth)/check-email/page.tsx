"use client";

import Navbar from "@/app/_components/landing_page/Navbar";
import { motion } from "framer-motion";
import Link from "next/link";

export default function CheckEmail() {
  

 

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Navbar />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-md bg-white rounded-3xl p-8 shadow-md border border-gray-100"
      >
        <h1 className="text-lg sm:text-xl font-semibold text-center text-gray-900">
          Check your email
        </h1>

        <p className="text-center text-gray-500 text-[11px] sm:text-[13px] px-5 mt-2 sm:mt-3 leading-relaxed">
          We've sent a password reset link to your email address. Please check your inbox and follow the instructions to reset your password.
        </p>

        <div className="my-6 flex justify-center">
            <img src="https://res.cloudinary.com/devqbjptr/image/upload/v1761427061/Depth_6_Frame_0_thy833.png" 
            alt="Confirm Email" 
            />

        </div>
        

        <a href="/login">
            <button
                type="submit"
                className="w-full bg-[#008753] text-white py-2 rounded-lg text-sm font-medium hover:bg-[#007047] transition disabled:opacity-60"
            >
                Back to Login
            </button>
        </a>

      </motion.div>
    </div>
  );
}
