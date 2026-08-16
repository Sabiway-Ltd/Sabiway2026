"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { PublicHeader } from "@/app/_components/v2/PublicShell";

export default function CheckEmail() {
  return (
    <div className="min-h-screen bg-[#f7faf8] flex flex-col text-[#173126]">
      <PublicHeader />
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: "easeOut" }} className="w-full max-w-md bg-white rounded-3xl p-8 shadow-sm border border-[#dce8e1]">
          <p className="text-xs font-black uppercase tracking-[.16em] text-[#008753] text-center">Check your inbox</p>
          <h1 className="mt-2 text-2xl font-black text-center">Password reset email sent</h1>
          <p className="text-center text-[#68776f] text-sm mt-3 leading-relaxed">We’ve sent a password reset link to your email address. Follow the instructions in the email to continue. It may take up to 5 minutes to arrive.</p>
          <div className="my-6 flex justify-center">
            <img src="https://res.cloudinary.com/dk6ew5ikb/image/upload/v1764564131/Depth_6_Frame_0_thy833_jatk7l.png" alt="Confirm email" className="max-h-48 object-contain" />
          </div>
          <Link href="/login" className="block w-full bg-[#008753] text-white py-3 rounded-xl text-center text-sm font-black hover:bg-[#007047] transition">Back to Login</Link>
        </motion.div>
      </div>
    </div>
  );
}
