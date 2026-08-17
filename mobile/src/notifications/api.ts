import { environment } from "../config/environment";
import type { NotificationFeed, NotificationItem } from "./types";

function headers(access: string) {
  return { Authorization: `Bearer ${access}`, "Content-Type": "application/json" };
}

async function parse<T>(response: Response): Promise<T> {
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = payload?.detail || payload?.error || `Request failed (${response.status})`;
    throw new Error(message);
  }
  return payload as T;
}

export async function getNotifications(access: string): Promise<NotificationFeed> {
  const payload = await parse<any>(await fetch(`${environment.djangoUrl}/api/notifications/`, { headers: headers(access) }));
  const body = payload?.results ?? payload;
  const wrapped = body?.notifications ?? [];
  const notifications: NotificationItem[] = wrapped
    .map((item: any) => item?.notification ?? item)
    .filter((item: any) => item?.id != null);
  return {
    notifications,
    unreadCount: Number(body?.unread_count ?? 0),
  };
}

export async function markNotificationRead(access: string, id: number): Promise<number> {
  const payload = await parse<{ unread_count?: number }>(await fetch(`${environment.djangoUrl}/api/notifications/${id}/read/`, {
    method: "PATCH",
    headers: headers(access),
    body: JSON.stringify({}),
  }));
  return Number(payload.unread_count ?? 0);
}

export async function markAllNotificationsRead(access: string): Promise<void> {
  await parse(await fetch(`${environment.djangoUrl}/api/notifications/read/all/`, {
    method: "PATCH",
    headers: headers(access),
    body: JSON.stringify({}),
  }));
}
