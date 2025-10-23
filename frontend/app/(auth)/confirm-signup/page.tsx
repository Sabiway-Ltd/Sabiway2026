"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import { EXPRESS_URL } from "@/app/utils/MyConstants";

export default function ConfirmSignup() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) {
      toast.error("Invalid confirmation link");
      router.push("/signup");
      return;
    }

    const confirmSignup = async () => {
      try {
        const res = await fetch(`${EXPRESS_URL}/api/auth/confirm-signup`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Confirmation failed");

        toast.success("Account confirmed successfully!");
        setTimeout(() => router.push("/login"), 1500);
      } catch (err: any) {
        toast.error(err.message || "Confirmation failed");
        setTimeout(() => router.push("/signup"), 1500);
      } finally {
        setLoading(false);
      }
    };

    confirmSignup();
  }, [searchParams, router]);

  return (
    <div className="flex items-center justify-center min-h-screen text-center">
      {loading ? (
        <p className="text-gray-600 animate-pulse">Confirming your account...</p>
      ) : (
        <p className="text-gray-500">Redirecting...</p>
      )}
    </div>
  );
}
