"use client";

import { create } from "zustand";

import { api } from "../services/api";

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

export type NotificationTarget = TargetPost | TargetProfile | TargetReply;

export interface NotificationItem {
  id: number;
  type: string;
  actor: Actor;
  target: NotificationTarget;
  target_url?: string | null;
  message: string;
  is_read: boolean;
  created_at: string;
  userId?: string;
}

type NotificationEnvelope = {
  notification: NotificationItem;
  userId?: string;
};

type NotificationResponse = {
  results?: { notifications?: NotificationEnvelope[] } | NotificationEnvelope[];
  notifications?: NotificationEnvelope[];
  next?: string | null;
};

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

function normalize(payload: NotificationResponse): NotificationEnvelope[] {
  if (Array.isArray(payload.results)) return payload.results;
  if (payload.results && Array.isArray(payload.results.notifications)) return payload.results.notifications;
  return payload.notifications || [];
}

export const useAllNotificationsStore = create<AllNotificationsStore>((set, get) => ({
  notifications: [],
  loading: false,
  error: null,
  nextPage: 1,
  hasMore: true,

  getAllNotifications: async (page = 1) => {
    const { loading, nextPage } = get();
    if (loading || (page !== nextPage && page !== 1)) return;
    set({ loading: true, error: null });

    try {
      const { data } = await api.get<NotificationResponse>(`/notifications/?page=${page}`);
      const incoming = normalize(data).map(({ notification, userId }) => ({ ...notification, userId }));
      set((state) => ({
        notifications: page === 1 ? incoming : [...state.notifications, ...incoming],
        nextPage: data.next ? page + 1 : null,
        hasMore: Boolean(data.next),
        loading: false,
      }));
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
      set({ error: "Notifications are temporarily unavailable.", loading: false });
    }
  },

  markNotificationRead: async (id: number) => {
    const previous = get().notifications.find((notification) => notification.id === id)?.is_read ?? false;
    set((state) => ({ notifications: state.notifications.map((notification) => notification.id === id ? { ...notification, is_read: true } : notification) }));
    try {
      await api.patch(`/notifications/${id}/read/`, {});
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
      set((state) => ({ notifications: state.notifications.map((notification) => notification.id === id ? { ...notification, is_read: previous } : notification) }));
    }
  },

  markAllNotificationsRead: async () => {
    const previous = get().notifications;
    set((state) => ({ notifications: state.notifications.map((notification) => ({ ...notification, is_read: true })) }));
    try {
      await api.patch("/notifications/read/all/", {});
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
      set({ notifications: previous, error: "We could not mark all notifications as read." });
    }
  },

  resetNotifications: () => set({ notifications: [], nextPage: 1, hasMore: true, error: null, loading: false }),
}));
