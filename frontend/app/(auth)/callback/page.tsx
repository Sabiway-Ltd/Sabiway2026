// app/(auth)/callback/page.tsx
"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/app/store/useAuthStore";
import toast from "react-hot-toast";
import { EXPRESS_LOCAL_URL } from "@/app/utils/MyConstants";

// ⛔ Prevent Next.js from trying to pre-render this page at build
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function GoogleCallback() {
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
        // store tokens locally
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

  return (
    <div className="flex items-center justify-center h-screen text-gray-600">
      Redirecting with Google...
    </div>
  );
}
