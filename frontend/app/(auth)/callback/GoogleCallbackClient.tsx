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
    const fragment = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    // Query fallback is kept temporarily so a callback already in flight before
    // deployment does not strand the user.
    const access = fragment.get("access") ?? searchParams.get("access");
    const refresh = fragment.get("refresh") ?? searchParams.get("refresh");

    if (!access || !refresh) {
      const onboardingRequired = searchParams.get("onboarding_required") === "1";
      const suspended = searchParams.get("account_suspended") === "1";
      toast.error(
        suspended
          ? "This account is suspended."
          : onboardingRequired
            ? "Complete SabiWay onboarding before using Google sign-in."
            : "Google authentication could not be completed.",
      );
      router.replace("/login");
      return;
    }

    // Remove credentials from browser history before making any further request.
    window.history.replaceState(null, "", "/callback");

    const fetchUserProfile = async () => {
      try {
        localStorage.setItem("access", access);
        localStorage.setItem("refresh", refresh);
        document.cookie = `access=${access}; path=/; max-age=1800; SameSite=Strict; Secure`;

        const response = await fetch(`${DJANGO_URL}/api/profiles/me/`, {
          headers: { Authorization: `Bearer ${access}` },
          cache: "no-store",
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
        router.replace("/home");
      } catch (error) {
        console.error("Profile fetch error:", error);
        toast.error("Failed to load your SabiWay profile");
        localStorage.removeItem("access");
        localStorage.removeItem("refresh");
        localStorage.removeItem("user");
        document.cookie = "access=; path=/; max-age=0; SameSite=Strict; Secure";
        router.replace("/login");
      }
    };

    void fetchUserProfile();
  }, [searchParams, router, google_logged_in]);

  return <div className="flex h-screen items-center justify-center text-gray-600" aria-live="polite">Redirecting with Google…</div>;
}
