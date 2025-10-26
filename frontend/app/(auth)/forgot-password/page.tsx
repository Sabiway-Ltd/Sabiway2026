// app/(auth)/forgot-password/page.tsx

"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { DJANGO_DEPLOY_URL } from "@/app/utils/MyConstants";

const API_URL = `${DJANGO_DEPLOY_URL}/api`

export default function ForgetPassword() {
  const [form, setForm] = useState({ email: "" });
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

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

      if (res.ok) {
        // toast.success(data.message || "Password reset instructions sent to email.");
        // toast("Please check your inbox and spam folder for the Password reset instructions.", {
        //   icon: "⚠️",
        //   style: {
        //     background: "#fff3cd",
        //     color: "#856404",
        //     border: "1px solid #ffeeba",
        //   },
        //   duration: 9000, // 9 seconds
        // });
        router.push("/check-email"); // Redirect after success
      } else {
        toast.error(data.error || "Failed to send reset email.");
      }
    } catch (err) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
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
        <h1 className="text-lg sm:text-xl font-semibold text-center text-gray-900">
          Forgot Password
        </h1>

        <p className="text-center text-gray-500 text-[11px] sm:text-[13px] px-5 mt-2 sm:mt-3 leading-relaxed">
          Enter the email associated with your account and we'll send an email with
          instructions to reset your password.
        </p>

        <form className="mt-6 space-y-7" onSubmit={handleSubmit}>
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

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#008753] text-white py-2 rounded-lg text-sm font-medium hover:bg-[#007047] transition disabled:opacity-60"
          >
            {loading ? "Please wait..." : "Send Reset Link"}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
