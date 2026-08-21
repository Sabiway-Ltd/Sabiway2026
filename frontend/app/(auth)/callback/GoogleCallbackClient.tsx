// app/(auth)/callback/GoogleCallbackClient.tsx (Client Component)
"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { postAuthDestination } from "@/app/auth/destination";
import { consumeAuthIntent } from "@/app/auth/session";
import { useAuthStore } from "@/app/store/useAuthStore";
import toast from "react-hot-toast";
import { DJANGO_URL } from "@/app/utils/MyConstants";

export default function GoogleCallbackClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { google_logged_in } = useAuthStore();

  useEffect(() => {
    const intent = consumeAuthIntent();
    const fragment = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const access = fragment.get("access") ?? searchParams.get("access");
    const refresh = fragment.get("refresh") ?? searchParams.get("refresh");

    if (!access || !refresh) {
      const onboardingRequired = searchParams.get("onboarding_required") === "1";
      const suspended = searchParams.get("account_suspended") === "1";
      toast.error(
        suspended
          ? "This account is suspended."
          : onboardingRequired
            ? "Choose your SabiWay account journey before continuing with Google."
            : "Google authentication could not be completed.",
      );
      const signupDestination = intent.role ? `/signup/${intent.role}` : "/signup";
      router.replace(onboardingRequired ? signupDestination : "/login");
      return;
    }

    window.history.replaceState(null, "", "/callback");

    const fetchUserProfile = async () => {
      try {
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

        google_logged_in(normalizedUser, access, refresh);
        router.replace(postAuthDestination(normalizedUser, intent.next));
      } catch (error) {
        console.error("Profile fetch error:", error);
        toast.error("Failed to load your SabiWay profile");
        router.replace("/login");
      }
    };

    void fetchUserProfile();
  }, [searchParams, router, google_logged_in]);

  return <div className="flex h-screen items-center justify-center text-muted-foreground" aria-live="polite">Redirecting with Google…</div>;
}
