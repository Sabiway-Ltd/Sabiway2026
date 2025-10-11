// app/store/useAuthStore.ts

"use client";

import { create } from "zustand";
import { auth } from "../services/auth"; // your API abstraction (already used)

type User = {
  id: number;
  full_name: string;
  email: string;
};

type AuthState = {
  user: User | null;
  access: string | null;
  refresh: string | null;
  loading: boolean;
  error: string | null;

  signup: (data: any) => Promise<{ success: boolean; error?: string }>;
  login: (data: any) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  loadUserFromStorage: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  access: null,
  refresh: null,
  loading: false,
  error: null,

  // ✅ SIGNUP
  signup: async (data) => {
    set({ loading: true, error: null });
    try {
      const res = await auth.signup(data);
      set({ user: res.data, loading: false });
      return { success: true };
    } catch (err: any) {
      console.error("Signup API Error:", err.response?.data || err.message);

      let errorMessage = "Signup failed";
      if (err.response?.data) {
        const data = err.response.data;
        if (typeof data === "string") errorMessage = data;
        else if (data.detail) errorMessage = data.detail;
        else if (typeof data === "object") errorMessage = Object.values(data).flat().join(" ");
      }

      set({ error: errorMessage, loading: false });
      return { success: false, error: errorMessage };
    }
  },

  // ✅ LOGIN
  login: async (data) => {
    set({ loading: true, error: null });
    try {
      const res = await auth.login(data); // use your auth service for consistency
      const { access, refresh, user } = res.data;

      if (typeof window !== "undefined") {
        localStorage.setItem("access", access);
        localStorage.setItem("refresh", refresh);
        localStorage.setItem("user", JSON.stringify(user));
      }

      set({ access, refresh, user, loading: false });
      return { success: true };
    } catch (err: any) {
      console.error("Login API Error:", err.response?.data || err.message);

      let errorMessage = "Invalid credentials";

        if (err.response?.data?.detail) {
        errorMessage = err.response.data.detail;
        } else if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
        } else if (typeof err.response?.data === "string") {
        errorMessage = err.response.data;
        }


      set({ error: errorMessage, loading: false });
      return { success: false, error: errorMessage };
    }
  },

  // ✅ LOGOUT
  logout: async () => {
    const refresh = localStorage.getItem("refresh");
    if (!refresh) return;

    try {
      await auth.logout({ refresh });
    } finally {
      localStorage.clear();
      set({ user: null, access: null, refresh: null });
    }
  },

  // ✅ LOAD USER
  loadUserFromStorage: () => {
    const user = localStorage.getItem("user");
    const access = localStorage.getItem("access");
    const refresh = localStorage.getItem("refresh");
    if (user && access && refresh) {
      set({
        user: JSON.parse(user),
        access,
        refresh,
      });
    }
  },
}));
