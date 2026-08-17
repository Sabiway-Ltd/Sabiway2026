// app/(auth)/callback/GoogleCallbackClient.tsx (Client Component)
"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuthStore } from "@/app/store/useAuthStore";
import toast from "react-hot-toast";
import { DJANGO_URL } from "@/app/utils/MyConstants";

export default function GoogleCallbackClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { google_logged_in } = useAuthStore();

  useEffect(() => {
    const access = searchParams.get("access");
    const refresh = searchParams.get("refresh");

    if (!access || !refresh) {
      toast.error("Missing Google authentication tokens");
      router.push("/login");
      return;
    }

    const fetchUserProfile = async () => {
      try {
        localStorage.setItem("access", access);
        localStorage.setItem("refresh", refresh);
        document.cookie = `access=${access}; path=/; max-age=86400; SameSite=Strict; Secure`;

        const response = await fetch(`${DJANGO_URL}/api/profiles/me/`, {
          headers: { Authorization: `Bearer ${access}` },
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.detail || "Profile fetch failed");

        const normalizedUser = {
          id: data.user_id,
          user_id: data.user_id,
          full_name: data.full_name,
          email: data.email,
          username: data.username,
          profile_pic: data.profile_picture,
          role: data.role,
          phone_number: data.phone_number,
          onboarding_complete: data.onboarding_complete,
        };

        localStorage.setItem("user", JSON.stringify(normalizedUser));
        google_logged_in(normalizedUser);
        router.push("/home");
      } catch (error) {
        console.error("Profile fetch error:", error);
        toast.error("Failed to load your SabiWay profile");
        localStorage.removeItem("access");
        localStorage.removeItem("refresh");
        localStorage.removeItem("user");
        router.push("/login");
      }
    };

    void fetchUserProfile();
  }, [searchParams, router, google_logged_in]);

  return <div className="flex h-screen items-center justify-center text-gray-600" aria-live="polite">Redirecting with Google…</div>;
}
