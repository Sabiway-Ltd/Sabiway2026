"use client";

import { useState, useEffect } from "react";
import { Eye, EyeOff } from "lucide-react";
import { FcGoogle } from "react-icons/fc";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useAuthStore } from "@/app/store/useAuthStore";
import { EXPRESS_URL } from "@/app/utils/MyConstants";
import Navbar from "@/app/_components/landing_page/Navbar";
import Link from "next/link";

export default function Signup() {
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { signup, loading, connectSocket } = useAuthStore();
  const [form, setForm] = useState({ full_name: "", email: "", password: "" });
  const router = useRouter();

  useEffect(() => {
    connectSocket();
  }, [connectSocket]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await signup(form);
    if (success) {
      router.push("/login");
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    try {
      const res = await fetch(`${EXPRESS_URL}/api/auth/generate-google-url`);
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
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* ✅ Navbar stays at the top */}
      <Navbar />

      {/* ✅ Content area (centered, with padding to clear the Navbar) */}
      <div className="flex-1 flex items-center justify-center px-4 md:pt-24 pt-14">
        {/* ↑ Adjust pt-24 to match your Navbar height */}

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md bg-white rounded-3xl px-8 py-4 shadow-md border border-gray-100"
        >
          <h1 className="text-lg font-semibold text-center text-gray-900">
            Create a Sabiway Account or sign in to get started
          </h1>

          {/* Policy */}
          <p className="text-center text-gray-500 text-[11px] sm:text-xs mt-2 sm:mt-3 leading-relaxed">
            By continuing, you agree to our{" "}
            <a href="/privacy-policy" className="text-[#008753] font-medium hover:underline">
              Privacy Policy
            </a>{" "}
            and{" "}
            <a href="/terms-of-use" className="text-[#008753] font-medium hover:underline">
              Terms of Use
            </a>
            , and consent to receive emails.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <input
              type="text"
              name="full_name"
              placeholder="Full Name"
              value={form.full_name}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#008753] focus:outline-none"
            />
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={form.email}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#008753] focus:outline-none"
            />
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Password"
                value={form.password}
                onChange={handleChange}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-10 text-sm focus:ring-2 focus:ring-[#008753] focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-gray-500"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#008753] text-white py-2 rounded-lg text-sm font-medium hover:bg-[#007047] transition disabled:opacity-60"
            >
              {loading ? "Signing Up..." : "Sign Up"}
            </button>
          </form>

          <div className="flex items-center justify-center my-5">
            <hr className="w-1/2 border-gray-300" />
            <span className="mx-3 text-gray-500 text-xs">or</span>
            <hr className="w-1/2 border-gray-300" />
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={googleLoading}
            className={`w-full border border-gray-300 rounded-lg py-2 flex items-center justify-center gap-2 
                        transition-all text-sm font-medium ${
                          googleLoading
                            ? "bg-gray-100 cursor-not-allowed opacity-80"
                            : "hover:bg-gray-50"
                        }`}
          >
            {googleLoading ? (
              <>
                <div className="h-4 w-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-gray-600">Redirecting...</span>
              </>
            ) : (
              <>
                <FcGoogle size={18} />
                <span className="text-gray-700">Continue with Google</span>
              </>
            )}
          </button>

          {/* Already have account */}
          <p className="text-center text-gray-600 text-[11px] sm:text-xs mt-5 sm:mt-6">
            Already have an account?{" "}
            <a
              href="/login"
              className="text-[#008753] font-medium hover:underline"
            >
              Sign in
            </a>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
