// app/store/useAuthStore.ts

import { create } from "zustand";
import toast from "react-hot-toast";
import { DJANGO_URL } from "@/app/utils/MyConstants";


const API_URL = `${DJANGO_URL}/api`;




interface User {
  id?: string;
  full_name?: string;
  email?: string;
  username?: string;
  profile_pic?: string;
}

interface AuthState {
  user: User | null;
  onlineUsers: User[];
  loading: boolean;

  signup: (form: { full_name: string; email: string; password: string }) => Promise<boolean>;
  login: (form: { email: string; password: string }) => Promise<boolean>;

  logout: () => Promise<void>;
  google_logged_in: (user: User) => void; 
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  onlineUsers: [],
  loading: false,

  // ✅ Signup
  signup: async (form) => {
    try {
      set({ loading: true });
      const res = await fetch(`${API_URL}/auth/signup/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Signup failed");

      set({ user: data.user });
      toast("Please check your inbox and spam folder for the confirmation email.", {
        icon: "⚠️",
        style: {
          background: "#fff3cd",
          color: "#856404",
          border: "1px solid #ffeeba",
        },
        duration: 9000, // 9 seconds
      });
      return true;
    } catch (error: any) {
      toast.error(error.message || "Something went wrong");
      return false;
    } finally {
      set({ loading: false });
    }
  },

  // ✅ Login
  login: async (form) => {
    try {
      set({ loading: true });

      const res = await fetch(`${API_URL}/auth/login/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // allows backend cookies if any
        body: JSON.stringify(form),
      });

      console.log("express url is:" + DJANGO_URL);

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");

      // ✅ Save token in cookie for middleware
      if (data.access) {
        // Use a safer cookie setup
        document.cookie = `access=${data.access}; path=/; max-age=86400; SameSite=Strict; Secure`;
        // Optionally, you can skip localStorage if you want full SSR/Edge compatibility
        localStorage.setItem("access", data.access);
      }

      // ✅ Update Zustand state
      set({ user: data.user });

      toast.success(`Welcome back ${data.user.full_name.split(" ")[0] || "User"}`);
      return true;

    } catch (error: any) {
      toast.error(error.message || "Something went wrong");
      return false;
    } finally {
      set({ loading: false });
    }
  },


  // ✅ Set user manually (for Google or token login)
  // ✅ Set user manually (for Google or token login)
  google_logged_in: (user: User) => {
    set({ user });
    // toast.success(`Welcome ${user.full_name.split(" ")[0] || "User"}!`);
  },


  logout: async () => {
    document.cookie = "access=; path=/; max-age=0; SameSite=Strict; Secure";
    localStorage.clear();
    window.location.href = "/";
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
