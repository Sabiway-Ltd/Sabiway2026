"use client";

import { useState, useEffect } from "react";
import { Eye, EyeOff } from "lucide-react";
import { motion } from "framer-motion";
import { useRouter, useParams } from "next/navigation";
import toast from "react-hot-toast";
import { DJANGO_URL } from "@/app/utils/MyConstants";

const API_URL = `${DJANGO_URL}/api`;

export default function ChangePassword() {
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ new_password: "", confirm_password: "" });
  const [loading, setLoading] = useState(false);
  const [validToken, setValidToken] = useState<boolean | null>(null);
  const router = useRouter();
  const { token } = useParams();

  // ✅ 1. Verify token validity on mount
  useEffect(() => {
    const checkToken = async () => {
      try {
        const res = await fetch(`${API_URL}/auth/verify-reset-token/${token}/`);
        const data = await res.json();
        if (res.ok) {
          setValidToken(true);
        } else {
          setValidToken(false);
          console.error(data);
        }
      } catch (err) {
        console.error(err);
        setValidToken(false);
      }
    };
    checkToken();
  }, [token]);

  // ✅ 2. Handle form input
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // ✅ 3. Handle password reset submission
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
      } else {
        toast.error(data.error || "Failed to reset password.");
      }
    } catch (err) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ✅ 4. UI states
  if (validToken === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-600">
        Checking reset link...
      </div>
    );
  }

  if (validToken === false) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center bg-white p-8 rounded-2xl shadow-md border"
        >
          <h1 className="text-xl font-semibold text-red-600 mb-2">
            Invalid or Expired Link
          </h1>
          <p className="text-gray-600 mb-4">
            This password reset link is no longer valid. Please request a new one.
          </p>
          <button
            onClick={() => router.push("/forgot-password")}
            className="bg-[#008753] text-white px-4 py-2 rounded-lg text-sm hover:bg-[#007047] transition"
          >
            Request New Link
          </button>
        </motion.div>
      </div>
    );
  }

  // ✅ 5. Normal Password Reset Form
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-md bg-white rounded-3xl p-8 shadow-md border border-gray-100"
      >
        <h1 className="text-lg sm:text-xl font-semibold text-center text-gray-900">
          Change your password
        </h1>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              New Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="new_password"
                value={form.new_password}
                onChange={handleChange}
                required
                placeholder="Enter new password"
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
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirm Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="confirm_password"
                value={form.confirm_password}
                onChange={handleChange}
                required
                placeholder="Confirm new password"
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
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#008753] text-white py-2 rounded-lg text-sm font-medium hover:bg-[#007047] transition disabled:opacity-60"
          >
            {loading ? "Please Wait..." : "Change Password"}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
