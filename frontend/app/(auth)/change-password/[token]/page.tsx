"use client";

import { useState, useEffect } from "react";
import { Eye, EyeOff } from "lucide-react";
import { motion } from "framer-motion";
import { useRouter, useParams } from "next/navigation";
import toast from "react-hot-toast";
import { DJANGO_URL } from "@/app/utils/MyConstants";
import { PublicHeader } from "@/app/_components/v2/PublicShell";

const API_URL = `${DJANGO_URL}/api`;

export default function ChangePassword() {
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ new_password: "", confirm_password: "" });
  const [loading, setLoading] = useState(false);
  const [validToken, setValidToken] = useState<boolean | null>(null);
  const router = useRouter();
  const { token } = useParams();

  useEffect(() => {
    const checkToken = async () => {
      try {
        const res = await fetch(`${API_URL}/auth/verify-reset-token/${token}/`);
        if (res.ok) setValidToken(true);
        else setValidToken(false);
      } catch {
        setValidToken(false);
      }
    };
    checkToken();
  }, [token]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.new_password !== form.confirm_password) {
      toast.error("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/reset-password/${token}/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || "Password has been reset successfully.");
        router.push("/login");
      } else toast.error(data.error || "Failed to reset password.");
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (validToken === null) {
    return <div className="min-h-screen flex items-center justify-center bg-[#f7faf8] text-[#68776f]">Checking reset link...</div>;
  }

  if (validToken === false) {
    return (
      <div className="min-h-screen bg-[#f7faf8] flex flex-col text-[#173126]">
        <PublicHeader />
        <div className="flex-1 flex items-center justify-center px-4 py-12">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="w-full max-w-md text-center bg-white p-8 rounded-3xl shadow-sm border border-[#dce8e1]">
            <h1 className="text-2xl font-black text-red-600 mb-2">Invalid or Expired Link</h1>
            <p className="text-[#68776f] mb-5">This password reset link is no longer valid. Please request a new one.</p>
            <button onClick={() => router.push("/forgot-password")} className="bg-[#008753] text-white px-5 py-3 rounded-xl text-sm font-black hover:bg-[#007047] transition">Request New Link</button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7faf8] flex flex-col text-[#173126]">
      <PublicHeader />
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: "easeOut" }} className="w-full max-w-md bg-white rounded-3xl p-8 shadow-sm border border-[#dce8e1]">
          <p className="text-xs font-black uppercase tracking-[.16em] text-[#008753] text-center">Account recovery</p>
          <h1 className="mt-2 text-2xl font-black text-center">Change your password</h1>
          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-bold mb-2">New Password</label>
              <div className="relative">
                <input type={showPassword ? "text" : "password"} name="new_password" value={form.new_password} onChange={handleChange} required placeholder="Enter new password" className="w-full border border-[#d6e2db] rounded-xl px-4 py-3 pr-10 text-sm focus:ring-2 focus:ring-[#008753]/20 focus:border-[#008753] focus:outline-none" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3 text-[#68776f]">{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold mb-2">Confirm Password</label>
              <div className="relative">
                <input type={showPassword ? "text" : "password"} name="confirm_password" value={form.confirm_password} onChange={handleChange} required placeholder="Confirm new password" className="w-full border border-[#d6e2db] rounded-xl px-4 py-3 pr-10 text-sm focus:ring-2 focus:ring-[#008753]/20 focus:border-[#008753] focus:outline-none" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3 text-[#68776f]">{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="w-full bg-[#008753] text-white py-3 rounded-xl text-sm font-black hover:bg-[#007047] transition disabled:opacity-60">{loading ? "Please Wait..." : "Change Password"}</button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
