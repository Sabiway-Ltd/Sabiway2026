// app/store/useNotificationStore.ts
import { create } from "zustand";
import { notification } from "../services/notification";

interface Notification {
  id: number;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

interface NotificationState {
  notifications: Notification[];
  loading: boolean;
  error: string | null;
  nextPage: number | null; // ✅ for pagination
  pageSize: number;
  getNotifications: (reset?: boolean) => Promise<void>;
  markAsRead: (id: number) => Promise<void>;
  addNotification: (newNotif: Notification) => void;
  unreadCount: number;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  loading: false,
  error: null,
  nextPage: 1,        // start at page 1
  pageSize: 10,       // default items per page

  // Fetch notifications (paginated)
  getNotifications: async (reset = false) => {
    const { loading, nextPage, pageSize, notifications } = get();

    if (loading || (nextPage === null && !reset)) return;

    set({ loading: true, error: null });

    try {
      const pageToFetch = reset ? 1 : nextPage;
      const res = await notification.getAll({ page: pageToFetch, page_size: pageSize });

      // If reset, replace; otherwise append
      const newNotifications = reset ? res.results : [...notifications, ...res.results];

      set({
        notifications: newNotifications,
        loading: false,
        nextPage: res.next ? pageToFetch + 1 : null, // if next exists, increment page
      });
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },

  markAsRead: async (id) => {
    try {
      await notification.markAsRead(id);
      set({
        notifications: get().notifications.map((n) =>
          n.id === id ? { ...n, is_read: true } : n
        ),
      });
    } catch (err) {
      console.error(err);
    }
  },

  addNotification: (newNotif) => {
    set({
      notifications: [newNotif, ...get().notifications],
    });
  },

  get unreadCount() {
    return get().notifications.filter((n) => !n.is_read).length;
  },
}));
