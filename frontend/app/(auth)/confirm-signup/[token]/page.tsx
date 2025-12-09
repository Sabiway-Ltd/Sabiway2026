"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import axios from "axios";
import { DJANGO_URL } from "@/app/utils/MyConstants";

export default function ConfirmSignupPage() {
  const { token } = useParams();
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) return;

    const confirmSignup = async () => {
      try {
        const res = await axios.get(
          `${DJANGO_URL}/api/auth/confirm-signup/${token}/`
        );

        setStatus("success");
        setMessage(res.data.message || "Account confirmed successfully!");

        // Redirect after short delay
        setTimeout(() => {
          router.push("/login");
        }, 3000);
      } catch (err: any) {
        setStatus("error");
        setMessage(
          err.response?.data?.error || "Confirmation link is invalid or expired."
        );
      }
    };

    confirmSignup();
  }, [token, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow p-8 text-center">
        {status === "loading" && (
          <>
            <h2 className="text-xl font-semibold">Confirming your account…</h2>
            <p className="text-gray-500 mt-2">Please wait</p>
          </>
        )}

        {status === "success" && (
          <>
            <h2 className="text-xl font-semibold text-[#008753]">
              ✅ Account Confirmed!
            </h2>
            <p className="text-gray-500 mt-2">
              Redirecting you to login…
            </p>
          </>
        )}

        {status === "error" && (
          <>
            <h2 className="text-xl font-semibold text-red-600">
              ❌ Confirmation Failed
            </h2>
            <p className="text-gray-500 mt-2">{message}</p>
          </>
        )}
      </div>
    </div>
  );
}
