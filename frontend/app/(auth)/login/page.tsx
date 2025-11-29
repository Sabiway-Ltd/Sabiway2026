"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { FcGoogle } from "react-icons/fc";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useAuthStore } from "@/app/store/useAuthStore";
import { EXPRESS_URL } from "@/app/utils/MyConstants";
import Link from "next/link";
import Navbar from "@/app/_components/landing_page/Navbar";

export default function Login() {
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });
  const { login, loading, connectSocket } = useAuthStore();
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const success = await login(form);
    if (success) {
      connectSocket();
      // router.push("/community");
      window.location.href = "/community"
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
      {/* ✅ Navbar stays fixed */}
      <Navbar />

      {/* ✅ Add top padding equal to navbar height */}
      <div className="flex-1 flex items-center justify-center px-4 md:pt-24 pt-12">
        {/* ↑ Adjust pt-24 if your Navbar height differs (24 = ~6rem = 96px) */}

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="w-full max-w-md bg-white rounded-3xl px-8 py-4 shadow-md border border-gray-100"
        >
          <h1 className="text-lg sm:text-xl font-semibold text-center text-gray-900">
            Sign in to your Sabiway Account
          </h1>

          <p className="text-center text-gray-500 text-[11px] sm:text-xs mt-2 sm:mt-3 leading-relaxed">
            By continuing, you agree to our{" "}
            <a href="#" className="text-[#008753] font-medium hover:underline">
              Privacy Policy
            </a>{" "}
            and{" "}
            <a href="#" className="text-[#008753] font-medium hover:underline">
              Terms of Use
            </a>
            , and consent to receive emails.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                required
                placeholder="Enter your email"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm 
                          focus:ring-2 focus:ring-[#008753] focus:outline-none"
              />
            </div>

            <div>
              
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  required
                  placeholder="Enter your password"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-10 text-sm 
                            focus:ring-2 focus:ring-[#008753] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <div className="flex justify-end mt-1">
                <a
                  href="/forgot-password"
                  className="text-[#008753] text-xs hover:underline font-medium"
                >
                  Forgot Password?
                </a>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#008753] text-white py-2 rounded-lg text-sm font-medium hover:bg-[#007047] transition disabled:opacity-60"
            >
              {loading ? "Signing In..." : "Sign In"}
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

          <p className="text-center text-gray-600 text-xs mt-5">
            Don’t have an account?{" "}
            <a href="/signup" className="text-[#008753] font-medium hover:underline">
              Sign up
            </a>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
