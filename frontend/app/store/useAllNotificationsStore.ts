"use client";

import { create } from "zustand";
import axios from "axios";
import { DJANGO_URL } from "../utils/MyConstants";

// ----------------------
// Types
// ----------------------
export interface Actor {
  user_id: number;
  username: string;
  full_name: string;
  profile_picture: string | null;
}

export interface TargetPost {
  type: "post";
  id: string;
  slug: string | null;
  content_preview: string;
}

export interface TargetProfile {
  type: "profile";
  id: number;
  username: string;
  full_name: string;
}

export interface TargetReply {
  type: "reply";
  id: string;
  comment_id: string;
  post_id: string;
  text_preview: string;
}

export type NotificationTarget =
  | TargetPost
  | TargetProfile
  | TargetReply;

export interface NotificationItem {
  id: number;
  type: string;
  actor: Actor;
  target: NotificationTarget;
  message: string;
  is_read: boolean;
  created_at: string;
  userId?: string;
}

// ----------------------
// Zustand Store Type
// ----------------------
export interface AllNotificationsStore {
  notifications: NotificationItem[];
  loading: boolean;
  error: string | null;
  nextPage: number | null;
  hasMore: boolean;

  getAllNotifications: (page?: number) => Promise<void>;
  markNotificationRead: (id: number) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
  resetNotifications: () => void;
}

// ----------------------
// Zustand Store
// ----------------------
export const useAllNotificationsStore = create<AllNotificationsStore>((set, get) => ({
  notifications: [],
  loading: false,
  error: null,
  nextPage: 1,
  hasMore: true,

  // ----------------------
  // Fetch notifications (pagination only)
  // ----------------------
  getAllNotifications: async (page = 1) => {
    const { loading, nextPage } = get();
    if (loading || (page !== nextPage && page !== 1)) return;

    set({ loading: true, error: null });

    const token = localStorage.getItem("access");
    if (!token) {
      set({ loading: false, error: "Not authenticated" });
      return;
    }

    try {
      const res = await axios.get(
        `${DJANGO_URL}/api/notifications/?page=${page}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const data = res.data;

      const newNotifications: NotificationItem[] =
        (data.results?.notifications || data.notifications || []).map(
          (item: any) => ({
            ...item.notification,
            userId: item.userId,
          })
        );

      set((state) => ({
        notifications:
          page === 1
            ? newNotifications
            : [...state.notifications, ...newNotifications],
        nextPage: data.next ? page + 1 : null,
        hasMore: Boolean(data.next),
        loading: false,
      }));
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
      set({ error: "Failed to fetch notifications", loading: false });
    }
  },

  // ----------------------
  // Mark single notification as read (NO unreadCount logic here)
  // ----------------------
  markNotificationRead: async (id: number) => {
    const token = localStorage.getItem("access");
    if (!token) return;

    // Optimistic UI
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, is_read: true } : n
      ),
    }));

    try {
      await axios.patch(
        `${DJANGO_URL}/api/notifications/${id}/read/`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
      // Rollback
      set((state) => ({
        notifications: state.notifications.map((n) =>
          n.id === id ? { ...n, is_read: false } : n
        ),
      }));
    }
  },

  // ----------------------
  // Mark all notifications as read
  // ----------------------
  markAllNotificationsRead: async () => {
    const token = localStorage.getItem("access");
    if (!token) return;

    // Optimistic UI
    set((state) => ({
      notifications: state.notifications.map((n) => ({
        ...n,
        is_read: true,
      })),
    }));

    try {
      await axios.patch(
        `${DJANGO_URL}/api/notifications/read/all/`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (err) {
      console.error("Failed to mark all notifications as read:", err);
    }
  },

  // ----------------------
  // Reset store
  // ----------------------
  resetNotifications: () =>
    set({
      notifications: [],
      nextPage: 1,
      hasMore: true,
      error: null,
      loading: false,
    }),
}));
