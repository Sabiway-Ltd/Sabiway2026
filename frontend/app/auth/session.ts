export const ACCESS_COOKIE_MAX_AGE_SECONDS = 60 * 30;

export type BrowserSessionUser = object;
export type PendingAccountRole = "client" | "professional";

type SessionPayload = {
  access?: string | null;
  refresh?: string | null;
  user?: BrowserSessionUser | null;
};

const PENDING_NEXT_KEY = "sabiway_pending_auth_next";
const PENDING_ROLE_KEY = "sabiway_pending_auth_role";

function browserAvailable() {
  return typeof window !== "undefined" && typeof document !== "undefined";
}

export function setAccessToken(access: string) {
  if (!browserAvailable()) return;
  window.localStorage.setItem("access", access);
  document.cookie = `access=${access}; path=/; max-age=${ACCESS_COOKIE_MAX_AGE_SECONDS}; SameSite=Strict; Secure`;
}

export function clearAccessToken() {
  if (!browserAvailable()) return;
  window.localStorage.removeItem("access");
  document.cookie = "access=; path=/; max-age=0; SameSite=Strict; Secure";
}

export function persistBrowserSession({ access, refresh, user }: SessionPayload) {
  if (!browserAvailable()) return;
  if (access) setAccessToken(access);
  if (refresh) window.localStorage.setItem("refresh", refresh);
  if (user) window.localStorage.setItem("user", JSON.stringify(user));
}

export function clearBrowserSession() {
  if (!browserAvailable()) return;
  clearAccessToken();
  window.localStorage.removeItem("refresh");
  window.localStorage.removeItem("user");
  window.localStorage.removeItem("internal_review_mode");
}

export function readBrowserSession() {
  if (!browserAvailable()) return { access: null, refresh: null, user: null };

  const access = window.localStorage.getItem("access");
  const refresh = window.localStorage.getItem("refresh");
  const rawUser = window.localStorage.getItem("user");
  let user: BrowserSessionUser | null = null;

  if (rawUser) {
    try {
      const parsed = JSON.parse(rawUser) as unknown;
      user = parsed && typeof parsed === "object" ? (parsed as BrowserSessionUser) : null;
      if (!user) window.localStorage.removeItem("user");
    } catch {
      window.localStorage.removeItem("user");
    }
  }

  return { access, refresh, user };
}

export function rememberAuthIntent(next: string, role?: PendingAccountRole) {
  if (!browserAvailable()) return;
  window.sessionStorage.setItem(PENDING_NEXT_KEY, next);
  if (role) window.sessionStorage.setItem(PENDING_ROLE_KEY, role);
  else window.sessionStorage.removeItem(PENDING_ROLE_KEY);
}

export function consumeAuthIntent() {
  if (!browserAvailable()) return { next: null, role: null as PendingAccountRole | null };
  const next = window.sessionStorage.getItem(PENDING_NEXT_KEY);
  const rawRole = window.sessionStorage.getItem(PENDING_ROLE_KEY);
  const role: PendingAccountRole | null = rawRole === "client" || rawRole === "professional" ? rawRole : null;
  window.sessionStorage.removeItem(PENDING_NEXT_KEY);
  window.sessionStorage.removeItem(PENDING_ROLE_KEY);
  return { next, role };
}
