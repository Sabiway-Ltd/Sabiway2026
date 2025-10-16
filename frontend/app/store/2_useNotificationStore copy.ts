"use client";

import { create } from "zustand";
import { io, Socket } from "socket.io-client";
import { EXPRESS_LOCAL_URL } from "../utils/MyConstants";
import toast from "react-hot-toast";

// Replace with your deployed Express backend URL
const API_URL = `${EXPRESS_LOCAL_URL}/api`;

// The same domain (no /api) should be used for socket
const SOCKET_URL = EXPRESS_LOCAL_URL;

type NotificationActor = {
  user_id: number;
  username: string;
  full_name: string;
  profile_picture?: string | null;
};

type NotificationItem = {
  id: number;
  type: string;
  actor: NotificationActor;
  target_type?: string | null;
  target_id?: string | null;
  message?: string;
  is_read: boolean;
  created_at: string;
};

type NotificationState = {
  notifications: NotificationItem[];
  loading: boolean;
  error: string | null;
  socket: Socket | null;

  getNotifications: () => Promise<void>;
  markAsRead: (id: number) => Promise<void>;
  unreadCount: () => number;
  initNotificationSocket: () => Promise<void>;
};

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  loading: false,
  error: null,
  socket: null,

  /* -------------------------
     Fetch from Express
  --------------------------*/
  getNotifications: async () => {
    const token = localStorage.getItem("access");
    if (!token) return;

    set({ loading: true, error: null });

    try {
      const res = await fetch(`${API_URL}/notifications`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error(`Failed to fetch: ${res.statusText}`);

      const data = await res.json();
      set({ notifications: data, loading: false });
    } catch (err: any) {
      console.error("Notification fetch error:", err);
      set({ error: err.message, loading: false });
    }
  },

  /* -------------------------
     Mark notification as read
  --------------------------*/
  markAsRead: async (id: number) => {
    const token = localStorage.getItem("access");
    if (!token) return;

    try {
      const res = await fetch(`${API_URL}/notifications/${id}/read`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error("Failed to mark notification as read");

      set({
        notifications: get().notifications.map((n) =>
          n.id === id ? { ...n, is_read: true } : n
        ),
      });
    } catch (err) {
      console.error("Mark as read error:", err);
    }
  },

  /* -------------------------
     Unread count
  --------------------------*/
  unreadCount: () => get().notifications.filter((n) => !n.is_read).length,

  /* -------------------------
     Real-time socket integration
  --------------------------*/
  initNotificationSocket: async () => {
    const token = localStorage.getItem("access");
    if (!token) return;

    // Avoid reconnecting multiple times
    if (get().socket) return;

    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 5,
    });

    set({ socket });

    socket.on("connect", () => {
      console.log("✅ Notification socket connected:", socket.id);
    });

    socket.on("disconnect", () => {
      console.warn("⚠️ Notification socket disconnected");
    });

    // 🔔 New notification received
    socket.on("notification:created", (notification: NotificationItem) => {
      console.log("New notification:", notification);
      set((state) => ({
        notifications: [notification, ...state.notifications],
      }));

      toast.success(notification.message || "New notification received!");
    });

    // ✅ Notification marked as read (from another tab/device)
    socket.on("notification:read", ({ notificationId }) => {
      set((state) => ({
        notifications: state.notifications.map((n) =>
          n.id === Number(notificationId) ? { ...n, is_read: true } : n
        ),
      }));
    });

    // Fetch notifications on socket init
    await get().getNotifications();
  },
}));
