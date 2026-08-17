import { create } from "zustand";
import toast from "react-hot-toast";
import { DJANGO_URL } from "@/app/utils/MyConstants";

const API_URL = `${DJANGO_URL}/api`;

export type AccountRole = "client" | "professional";

export interface User {
  id?: string | number;
  user_id?: number;
  full_name?: string;
  email?: string;
  username?: string;
  profile_pic?: string;
  role?: AccountRole;
  phone_number?: string;
  onboarding_complete?: boolean;
}

export type SignupForm = {
  full_name: string;
  email: string;
  password: string;
  role: AccountRole;
  phone_number: string;
  terms_accepted: boolean;
};

interface AuthState {
  user: User | null;
  onlineUsers: User[];
  loading: boolean;
  access: string | null;
  refresh: string | null;
  signup: (form: SignupForm) => Promise<boolean>;
  login: (form: { email: string; password: string }) => Promise<boolean>;
  logout: () => Promise<void>;
  google_logged_in: (user: User) => void;
  loadUserFromStorage: () => void;
}

function firstApiError(data: unknown, fallback: string) {
  if (!data || typeof data !== "object") return fallback;
  const record = data as Record<string, unknown>;
  if (typeof record.error === "string") return record.error;
  if (typeof record.detail === "string") return record.detail;
  for (const value of Object.values(record)) {
    if (Array.isArray(value) && value.length) return String(value[0]);
    if (typeof value === "string") return value;
  }
  return fallback;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  onlineUsers: [],
  loading: false,
  access: null,
  refresh: null,

  signup: async (form) => {
    try {
      set({ loading: true });
      const res = await fetch(`${API_URL}/auth/signup/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ...form,
          full_name: form.full_name.trim(),
          email: form.email.trim().toLowerCase(),
          phone_number: form.phone_number.trim(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(firstApiError(data, "Signup failed"));
      toast("Please check your inbox and spam folder for the confirmation email.", {
        icon: "✉️",
        duration: 9000,
      });
      return true;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong");
      return false;
    } finally {
      set({ loading: false });
    }
  },

  login: async (form) => {
    try {
      set({ loading: true });
      const res = await fetch(`${API_URL}/auth/login/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: form.email.trim().toLowerCase(), password: form.password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(firstApiError(data, "Login failed"));

      // Transitional Phase 2 client storage. Full browser-token hardening remains
      // tracked before production readiness; server-side auth remains authoritative.
      if (data.access) {
        document.cookie = `access=${data.access}; path=/; max-age=86400; SameSite=Strict; Secure`;
        localStorage.setItem("access", data.access);
      }
      if (data.refresh) localStorage.setItem("refresh", data.refresh);
      if (data.user) localStorage.setItem("user", JSON.stringify(data.user));
      set({ user: data.user, access: data.access || null, refresh: data.refresh || null });
      toast.success(`Welcome back ${data.user?.full_name?.split(" ")[0] || "User"}`);
      return true;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong");
      return false;
    } finally {
      set({ loading: false });
    }
  },

  google_logged_in: (user) => set({ user }),

  logout: async () => {
    document.cookie = "access=; path=/; max-age=0; SameSite=Strict; Secure";
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    localStorage.removeItem("user");
    set({ user: null, access: null, refresh: null });
    window.location.href = "/";
  },

  loadUserFromStorage: () => {
    const user = localStorage.getItem("user");
    const access = localStorage.getItem("access");
    const refresh = localStorage.getItem("refresh");
    if (user && access) {
      set({ user: JSON.parse(user), access, refresh });
    }
  },
}));
