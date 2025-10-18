// app/(auth)/callback/GoogleCallbackClient.tsx (Client Component)
"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuthStore } from "@/app/store/useAuthStore";
import toast from "react-hot-toast";
import { EXPRESS_LOCAL_URL } from "@/app/utils/MyConstants";

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

        const response = await fetch(`${EXPRESS_LOCAL_URL}/api/profiles/me/`, {
          headers: { Authorization: `Bearer ${access}` },
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.detail || "Profile fetch failed");

        const normalizedUser = {
          id: data.user_id,
          full_name: data.full_name,
          email: data.email,
          username: data.username,
          profile_pic: data.profile_picture,
        };

        google_logged_in(normalizedUser);
        router.push("/community");
      } catch (error) {
        console.error("Profile fetch error:", error);
        toast.error("Failed to load profile");
        router.push("/login");
      }
    };

    fetchUserProfile();
  }, [searchParams, router, google_logged_in]);

  return <div className="flex items-center justify-center h-screen text-gray-600">Redirecting with Google...</div>;
}
