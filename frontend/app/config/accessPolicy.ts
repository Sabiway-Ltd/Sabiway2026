export type AccessClass =
  | "PUBLIC"
  | "GUEST_CAPABLE"
  | "AUTHENTICATED_SHARED"
  | "CLIENT_ONLY"
  | "PROFESSIONAL_ONLY"
  | "STAFF_ONLY"
  | "PARTICIPANT_SCOPED";

export type AccountRole = "client" | "professional";

type RouteRule = {
  prefix: string;
  access: AccessClass;
  exact?: boolean;
};

const ROUTE_RULES: RouteRule[] = [
  { prefix: "/", access: "PUBLIC", exact: true },
  { prefix: "/login", access: "PUBLIC" },
  { prefix: "/signup", access: "PUBLIC" },
  { prefix: "/forgot-password", access: "PUBLIC", exact: true },
  { prefix: "/check-email", access: "PUBLIC", exact: true },
  { prefix: "/confirm-signup", access: "PUBLIC" },
  { prefix: "/change-password", access: "PUBLIC" },
  { prefix: "/callback", access: "PUBLIC" },

  { prefix: "/about-us", access: "PUBLIC" },
  { prefix: "/accessibility", access: "PUBLIC" },
  { prefix: "/careers", access: "PUBLIC" },
  { prefix: "/contact", access: "PUBLIC" },
  { prefix: "/download", access: "PUBLIC" },
  { prefix: "/fees", access: "PUBLIC" },
  { prefix: "/for-clients", access: "PUBLIC" },
  { prefix: "/for-professionals", access: "PUBLIC" },
  { prefix: "/helpcenter", access: "PUBLIC" },
  { prefix: "/how-it-works", access: "PUBLIC" },
  { prefix: "/locations", access: "PUBLIC" },
  { prefix: "/partners", access: "PUBLIC" },
  { prefix: "/privacy-policy", access: "PUBLIC" },
  { prefix: "/sabipay-explained", access: "PUBLIC" },
  { prefix: "/services", access: "PUBLIC" },
  { prefix: "/terms-of-use", access: "PUBLIC" },
  { prefix: "/trust-and-safety", access: "PUBLIC" },
  { prefix: "/verification-info", access: "PUBLIC" },

  { prefix: "/marketplace", access: "GUEST_CAPABLE" },
  { prefix: "/sabiforum", access: "GUEST_CAPABLE" },
  { prefix: "/posts", access: "GUEST_CAPABLE" },
  { prefix: "/hashtag", access: "GUEST_CAPABLE" },
  { prefix: "/profile/", access: "GUEST_CAPABLE" },

  { prefix: "/onboarding/client", access: "CLIENT_ONLY" },
  { prefix: "/community/moderation", access: "STAFF_ONLY" },
  { prefix: "/community", access: "AUTHENTICATED_SHARED" },
  { prefix: "/home", access: "AUTHENTICATED_SHARED" },
  { prefix: "/notifications", access: "AUTHENTICATED_SHARED" },
  { prefix: "/profile", access: "AUTHENTICATED_SHARED", exact: true },
  { prefix: "/messages", access: "PARTICIPANT_SCOPED" },
  { prefix: "/sabipay", access: "PARTICIPANT_SCOPED" },
  { prefix: "/verification", access: "PROFESSIONAL_ONLY" },
];

export function accessClassForPath(pathname: string): AccessClass {
  const rule = ROUTE_RULES.find(({ prefix, exact }) =>
    exact ? pathname === prefix : pathname === prefix || pathname.startsWith(`${prefix}/`) || (prefix.endsWith("/") && pathname.startsWith(prefix)),
  );
  return rule?.access ?? "AUTHENTICATED_SHARED";
}

export function requiresAuthentication(access: AccessClass): boolean {
  return !["PUBLIC", "GUEST_CAPABLE"].includes(access);
}

export function isAuthEntryPath(pathname: string): boolean {
  return pathname === "/login" || pathname.startsWith("/login/") || pathname === "/signup" || pathname.startsWith("/signup/");
}

export function safeInternalNext(value: string | null | undefined, fallback = "/home"): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return fallback;
  try {
    const parsed = new URL(value, "https://sabiway.local");
    if (parsed.origin !== "https://sabiway.local") return fallback;
    if (isAuthEntryPath(parsed.pathname)) return fallback;
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return fallback;
  }
}

export const appNavigation: Record<AccountRole, Array<{ href: string; label: string }>> = {
  client: [
    { href: "/home", label: "Home" },
    { href: "/marketplace", label: "Find services" },
    { href: "/messages", label: "Messages" },
    { href: "/community", label: "SabiForum" },
    { href: "/profile", label: "Profile" },
  ],
  professional: [
    { href: "/home", label: "Home" },
    { href: "/marketplace", label: "Opportunities" },
    { href: "/messages", label: "Messages" },
    { href: "/community", label: "SabiForum" },
    { href: "/profile", label: "Profile" },
  ],
};
