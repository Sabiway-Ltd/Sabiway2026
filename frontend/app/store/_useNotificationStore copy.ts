// app/store/useNotificationStore.ts

"use client";

import { create } from "zustand";
import { notification } from "../services/notification";

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

  getNotifications: () => Promise<void>;
  markAsRead: (id: number) => Promise<void>;

  unreadCount: () => number;
};

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  loading: false,
  error: null,

  getNotifications: async () => {
    set({ loading: true, error: null });
    try {
      const res = await notification.getAll();
      set({ notifications: res.data, loading: false });
    } catch (err: any) {
      console.error("Notification fetch error:", err.response?.data || err.message);
      set({
        error: err.response?.data?.detail || "Failed to fetch notifications",
        loading: false,
      });
    }
  },

  markAsRead: async (id: number) => {
    try {
      await notification.markAsRead(id);
      set({
        notifications: get().notifications.map((n) =>
          n.id === id ? { ...n, is_read: true } : n
        ),
      });
    } catch (err: any) {
      console.error("Mark as read error:", err.response?.data || err.message);
    }
  },

  unreadCount: () => get().notifications.filter((n) => !n.is_read).length,
}));