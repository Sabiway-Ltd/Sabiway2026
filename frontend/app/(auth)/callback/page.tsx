"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuthStore } from "@/lib/store/authStore";
import toast from "react-hot-toast";

export default function GoogleCallback() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const googleLogin = useAuthStore((state) => state.googleLogin);
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    const access = searchParams.get("access");
    const refresh = searchParams.get("refresh");
    const idToken = searchParams.get("id_token"); // sometimes Google returns this instead

    async function handleGoogleAuth() {
      if (!idToken && !access) {
        toast.error("Missing Google token.");
        return router.push("/login");
      }

      const token = idToken || access;

      const success = await googleLogin(token);

      if (success) {
        toast.success("Google login successful!");
        setTimeout(() => router.push("/community"), 800);
      } else {
        toast.error("Google login failed.");
        router.push("/login");
      }
    }

    handleGoogleAuth();
  }, [googleLogin, router, searchParams]);

  return (
    <div className="flex items-center justify-center h-screen text-gray-600">
      Redirecting...
    </div>
  );
}
