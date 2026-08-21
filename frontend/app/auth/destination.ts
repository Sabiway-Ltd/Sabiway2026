import { safeInternalNext } from "@/app/config/accessPolicy";
import type { User } from "@/app/store/useAuthStore";

export function postAuthDestination(user: User | null | undefined, requestedNext?: string | null): string {
  const next = safeInternalNext(requestedNext, "/home");
  if (user?.role === "client" && user.onboarding_complete === false) {
    return `/onboarding/client?next=${encodeURIComponent(next)}`;
  }
  return next;
}
