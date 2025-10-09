"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { FcGoogle } from "react-icons/fc";
import { motion } from "framer-motion";
import { useAuthStore } from "@/app/store/useAuthStore";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function Signup() {
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
  });

  const { signup, loading } = useAuthStore();
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await signup(form);

    if (result?.success) {
      toast.success("Account created successfully!");
      router.push("/login");
    } else {
      toast.error(result?.error || "Signup failed. Please try again.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-md bg-white rounded-3xl p-8 shadow-md border border-gray-100"
      >
        <h1 className="text-lg font-semibold text-center text-gray-900">
          Create a Sabiway Account or sign in to get started 
        </h1>

        {/* Policy */}
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

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Name
            </label>
            <input
              type="text"
              name="full_name"
              value={form.full_name}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#008753] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#008753] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={form.password}
                onChange={handleChange}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-10 text-sm focus:ring-2 focus:ring-[#008753] focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#008753] text-white py-2 rounded-lg text-sm font-medium hover:bg-[#007047] transition disabled:opacity-60"
          >
            {loading ? "Signing Up..." : "Sign Up"}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center justify-center my-5 sm:my-6">
          <hr className="w-1/2 border-gray-300" />
          <span className="mx-3 text-gray-500 text-[11px] sm:text-xs">or</span>
          <hr className="w-1/2 border-gray-300" />
        </div>

        {/* Google Sign-In */}
        <button
          type="button"
          className="w-full border border-gray-300 rounded-lg py-2 flex items-center justify-center gap-2 
                     hover:bg-gray-50 transition-all text-[13px] sm:text-sm"
        >
          <FcGoogle size={18} />
          <span className="text-gray-700 font-medium">Continue with Google</span>
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
  );
}
