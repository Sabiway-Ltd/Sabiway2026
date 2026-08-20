export const ACCESS_COOKIE_MAX_AGE_SECONDS = 60 * 30;

export type BrowserSessionUser = Record<string, unknown>;

type SessionPayload = {
  access?: string | null;
  refresh?: string | null;
  user?: BrowserSessionUser | null;
};

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
      user = JSON.parse(rawUser) as BrowserSessionUser;
    } catch {
      window.localStorage.removeItem("user");
    }
  }

  return { access, refresh, user };
}
