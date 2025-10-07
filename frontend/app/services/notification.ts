// app/services/notification.ts

import { api } from "./api";

export const notification = {
  // Get all notifications for logged-in user
  getAll: () => api.get("/notifications/"),

  // Mark a single notification as read
  markAsRead: (id: number) => api.patch(`/notifications/${id}/read/`),
};
