"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { FcGoogle } from "react-icons/fc";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { useAuthStore } from "@/app/store/useAuthStore";
import { DJANGO_URL } from "@/app/utils/MyConstants";
import Link from "next/link";
import { PublicHeader } from "@/app/_components/v2/PublicShell";

export default function Login() {
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });
  const { login, loading } = useAuthStore();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await login(form);
    if (success) window.location.href = "/community";
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    try {
      const res = await fetch(`${DJANGO_URL}/api/auth/generate-google-url`);
      const data = await res.json();
      if (data?.auth_url) {
        window.location.href = data.auth_url;
      } else {
        toast.error("Failed to load Google login.");
      }
    } catch (error) {
      console.error("Google login error:", error);
      toast.error("Error initializing Google login");
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f7faf8] flex flex-col text-[#173126]">
      <PublicHeader />
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="w-full max-w-md bg-white rounded-3xl px-8 py-8 shadow-sm border border-[#dce8e1]"
        >
          <p className="text-xs font-black uppercase tracking-[.16em] text-[#008753] text-center">Welcome back</p>
          <h1 className="mt-2 text-2xl font-black text-center text-[#173126]">Sign in to SabiWay</h1>

          <p className="text-center text-[#68776f] text-xs mt-3 leading-relaxed">
            By continuing, you agree to our{" "}
            <Link href="/privacy-policy" className="text-[#008753] font-bold hover:underline">Privacy Policy</Link>{" "}
            and{" "}
            <Link href="/terms-of-use" className="text-[#008753] font-bold hover:underline">Terms of Use</Link>.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
              placeholder="Enter your email"
              className="w-full border border-[#d6e2db] rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#008753]/20 focus:border-[#008753] focus:outline-none"
            />
            <div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  required
                  placeholder="Enter your password"
                  className="w-full border border-[#d6e2db] rounded-xl px-4 py-3 pr-10 text-sm focus:ring-2 focus:ring-[#008753]/20 focus:border-[#008753] focus:outline-none"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3 text-[#68776f]">
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
              <div className="flex justify-end mt-2">
                <Link href="/forgot-password" className="text-[#008753] text-xs hover:underline font-bold">Forgot Password?</Link>
              </div>
            </div>
            <button type="submit" disabled={loading} className="w-full bg-[#008753] text-white py-3 rounded-xl text-sm font-black hover:bg-[#007047] transition disabled:opacity-60">
              {loading ? "Signing In..." : "Sign In"}
            </button>
          </form>

          <div className="flex items-center justify-center my-5"><hr className="w-1/2 border-[#e2eae5]" /><span className="mx-3 text-[#7b8981] text-xs">or</span><hr className="w-1/2 border-[#e2eae5]" /></div>

          <button type="button" onClick={handleGoogleLogin} disabled={googleLoading} className={`w-full border border-[#d6e2db] rounded-xl py-3 flex items-center justify-center gap-2 transition-all text-sm font-bold ${googleLoading ? "bg-gray-100 cursor-not-allowed opacity-80" : "hover:bg-[#f4f8f6]"}`}>
            {googleLoading ? <><div className="h-4 w-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div><span className="text-gray-600">Redirecting...</span></> : <><FcGoogle size={18} /><span>Continue with Google</span></>}
          </button>

          <p className="text-center text-[#68776f] text-xs mt-5">Don’t have an account? <Link href="/signup" className="text-[#008753] font-black hover:underline">Sign up</Link></p>
        </motion.div>
      </div>
    </div>
  );
}
