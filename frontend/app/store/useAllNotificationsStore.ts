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
}

// ----------------------
// Store Type
// ----------------------
interface AllNotificationsStore {
  allNotifications: NotificationItem[];
  loading: boolean;
  error: string | null;
  nextPage: number | null;
  hasMore: boolean;

  fetchAllNotifications: (page?: number) => Promise<void>;
  resetAllNotifications: () => void;

  markNotificationRead: (id: number) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
}

// ----------------------
// Zustand Store
// ----------------------
export const useAllNotificationsStore = create<AllNotificationsStore>((set, get) => ({
  allNotifications: [],
  loading: false,
  error: null,
  nextPage: 1,
  hasMore: true,

  fetchAllNotifications: async (page = 1) => {
    const { loading, nextPage, allNotifications } = get();

    // Prevent invalid duplicate requests
    if (loading) return;
    if (page !== 1 && page !== nextPage) return;

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
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const newNotifications: NotificationItem[] =
        res.data.results || res.data;

      set({
        allNotifications:
          page === 1
            ? newNotifications
            : [...allNotifications, ...newNotifications],

        nextPage: res.data.next ? page + 1 : null,
        hasMore: Boolean(res.data.next),
        loading: false,
      });
    } catch (err) {
      console.error("Failed to fetch all notifications:", err);
      set({ error: "Failed to fetch notifications", loading: false });
    }
  },

  markNotificationRead: async (id: number) => {
    const token = localStorage.getItem("access");
    if (!token) return;

    try {
      await axios.patch(
        `${DJANGO_URL}/api/notifications/${id}/read/`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      set((state) => ({
        allNotifications: state.allNotifications.map((n) =>
          n.id === id ? { ...n, is_read: true } : n
        ),
      }));
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  },

  markAllNotificationsRead: async () => {
    const token = localStorage.getItem("access");
    if (!token) return;

    try {
      await axios.patch(
        `${DJANGO_URL}/api/notifications/read/all/`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      set((state) => ({
        allNotifications: state.allNotifications.map((n) => ({
          ...n,
          is_read: true,
        })),
      }));
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    }
  },

  resetAllNotifications: () =>
    set({
      allNotifications: [],
      loading: false,
      error: null,
      nextPage: 1,
      hasMore: true,
    }),
}));
