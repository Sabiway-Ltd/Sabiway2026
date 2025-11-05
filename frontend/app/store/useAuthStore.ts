// app/store/useAuthStore.ts

import { create } from "zustand";
import { io } from "socket.io-client";
import toast from "react-hot-toast";
import { EXPRESS_URL } from "@/app/utils/MyConstants";
import { useNotificationStore } from "./useNotificationStore"; // ✅ add at the top
import { auth } from "../services/auth";


const API_URL = `${EXPRESS_URL}/api`;
const SOCKET_URL = EXPRESS_URL

let socket: any = null;

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
  connectSocket: (user: User) => void;
  google_logged_in: (user: User) => void; 
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  onlineUsers: [],
  loading: false,

  // ✅ Connect socket after successful login/signup
  connectSocket: (user) => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      transports: ["websocket"],
      withCredentials: true,
    });

    socket.on("connect", () => {
      console.log("✅ Socket connected:", socket.id);
      socket.emit("user:login", user); // Default login event
    });

    // ✅ Broadcast list of online users
    socket.on("users:online", (users) => {
      set({ onlineUsers: users });
    });

    // ✅ Regular login toast
    socket.on("user:login", ({ user }) => {
      
    });

    // ✅ NEW: Google login toast
    socket.on("user:google_logged_in", (user) => {
      
    });

    // ✅ Logout toast
    socket.on("user:logout", ({ user }) => {
      
    });


    // 🧠 Listen for new notifications from backend
      socket.on("notification:new", (notification) => {
        console.log("🔔 New notification received:", notification);

        const { addNotification } = useNotificationStore.getState();
        addNotification(notification);

        // Optional: show toast if dropdown isn’t open
        // toast.success(notification.message || "New notification!");
      });
  }
  
},


  // ✅ Signup
  signup: async (form) => {
    try {
      set({ loading: true });
      const res = await fetch(`${API_URL}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(form),
      });

      console.log("express url is:" + EXPRESS_URL);

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

      get().connectSocket(data.user); // 🔌 connect here
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

      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // allows backend cookies if any
        body: JSON.stringify(form),
      });

      console.log("express url is:" + EXPRESS_URL);

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
      get().connectSocket(data.user);
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

    // Wait for socket to be ready before emitting Google login
    // get().connectSocket(user);
    console.log("express url is:" + EXPRESS_URL);
    
    if (socket && socket.connected) {
      socket.emit("user:google_login", user);
    } else {
      const { connectSocket } = get();
      connectSocket(user);
      setTimeout(() => {
        socket?.emit("user:google_login", user);
      }, 500);
    }
  },


  // ✅ LOGOUT
  // logout: async () => {
  //   const refresh = localStorage.getItem("refresh");
  //   if (!refresh) return;

  //   try {
  //     await auth.logout({ refresh });
  //   } finally {
  //     localStorage.clear();
  //     set({ user: null, access: null, refresh: null });
  //   }
  // },

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
