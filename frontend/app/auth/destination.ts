import { safeInternalNext } from "@/app/config/accessPolicy";
import type { User } from "@/app/store/useAuthStore";

export function postAuthDestination(user: User | null | undefined, requestedNext?: string | null): string {
  const next = safeInternalNext(requestedNext, "/home");
  if (user?.onboarding_complete === false) {
    if (user.role === "client") return `/onboarding/client?next=${encodeURIComponent(next)}`;
    if (user.role === "professional") return `/onboarding/professional?next=${encodeURIComponent(next)}`;
  }
  return next;
}
