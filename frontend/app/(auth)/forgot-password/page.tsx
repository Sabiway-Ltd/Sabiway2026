"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { DJANGO_URL } from "@/app/utils/MyConstants";
import { PublicHeader } from "@/app/_components/v2/PublicShell";

const API_URL = `${DJANGO_URL}/api`;

export default function ForgetPassword() {
  const [form, setForm] = useState({ email: "" });
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/forgot-password/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email }),
      });
      const data = await res.json();
      if (res.ok) router.push("/check-email");
      else toast.error(data.error || "No account matches this email.");
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f7faf8] flex flex-col text-[#173126]">
      <PublicHeader />
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: "easeOut" }} className="w-full max-w-md bg-white rounded-3xl p-8 shadow-sm border border-[#dce8e1]">
          <p className="text-xs font-black uppercase tracking-[.16em] text-[#008753] text-center">Account recovery</p>
          <h1 className="mt-2 text-2xl font-black text-center">Forgot your password?</h1>
          <p className="text-center text-[#68776f] text-sm mt-3 leading-relaxed">Enter the email associated with your account and we’ll send instructions to reset your password.</p>
          <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
            <input type="email" name="email" value={form.email} onChange={handleChange} required placeholder="Enter your email" className="w-full border border-[#d6e2db] rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#008753]/20 focus:border-[#008753] focus:outline-none" />
            <button type="submit" disabled={loading} className="w-full bg-[#008753] text-white py-3 rounded-xl text-sm font-black hover:bg-[#007047] transition disabled:opacity-60">{loading ? "Please wait..." : "Send Reset Link"}</button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
