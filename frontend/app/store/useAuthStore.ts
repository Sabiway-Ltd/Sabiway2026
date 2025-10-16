// app/store/useAuthStore.ts

import { create } from "zustand";
import { io } from "socket.io-client";
import toast from "react-hot-toast";
import { EXPRESS_LOCAL_URL } from "@/app/utils/MyConstants";
import { useNotificationStore } from "./useNotificationStore"; // ✅ add at the top


const API_URL = `${EXPRESS_LOCAL_URL}/api`;
const SOCKET_URL = EXPRESS_LOCAL_URL

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
      toast.success(`${user.full_name.split(" ")[0] || "Someone"} just logged in`);
    });

    // ✅ NEW: Google login toast
    socket.on("user:google_logged_in", (user) => {
      toast.success(`${user.full_name.split(" ")[0] || "Someone"} just logged in`);
    });

    // ✅ Logout toast
    socket.on("user:logout", ({ user }) => {
      toast(`${user?.full_name || "Someone"} logged out`);
    });
  }
  socket.on("notification:new", (notif) => {
  const { notifications, unreadCount } = useNotificationStore.getState();

  // Update notifications store
  useNotificationStore.setState({
    notifications: [notif, ...notifications],
  });

  // Optional: only show toast if user isn't looking at dropdown
  toast.success(
    `${notif.actor.full_name.split(" ")[0] || "Someone"} ${notif.message || "sent you a notification"}`
  );
});
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

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Signup failed");

      set({ user: data.user });
      toast.success("Account created successfully!");
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
      credentials: "include", // keep this in case backend also sets cookies
      body: JSON.stringify(form),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Login failed");

    // ✅ Save token if backend returns it
    if (data.access) {
      localStorage.setItem("access", data.access);
    }

    // ✅ Store user in Zustand
    set({ user: data.user });

    toast.success(`Welcome back ${data.user.full_name.split(" ")[0] || "User"}`);
    get().connectSocket(data.user); // 🔌 connect socket on login
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


  // ✅ Logout
  logout: async () => {
    const user = get().user;
    try {
      const res = await fetch(`${API_URL}/auth/logout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ user }),
      });

      if (!res.ok) throw new Error("Logout failed");

      toast("Logged out successfully");
      socket?.emit("user:logout", user);
      socket?.disconnect();
      socket = null;
      set({ user: null, onlineUsers: [] });
    } catch (error: any) {
      toast.error(error.message || "Something went wrong");
    }
  },
}));
