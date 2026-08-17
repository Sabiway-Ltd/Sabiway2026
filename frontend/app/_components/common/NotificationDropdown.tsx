"use client";

import { useEffect, useRef, useState } from "react";
import { Bell, Check } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useNotificationStore, NotificationItem } from "@/app/store/useNotificationStore";
import { CLOUDINARY_CLOUD_NAME, DEFAULT_PROFILE_PICTURE } from "@/app/helper";
import IconTooltipButton from "./IconTooltipButton";
import { io, Socket } from "socket.io-client";
import { useProfileStore } from "@/app/store/useProfileStore";
import { EXPRESS_URL } from "@/app/utils/MyConstants";

const getCloudinaryImage = (path: string | null) =>
  path ? (path.startsWith("http") ? path : `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/${path}`) : DEFAULT_PROFILE_PICTURE;

const getNotificationLink = (n: NotificationItem) => {
  const target = n.target;
  if (target) {
    switch (target.type) {
      case "profile": return `/profile/${target.username.replace("@", "")}`;
      case "post": return `/posts/${target.slug || target.id}`;
      case "reply": return `/posts/${target.post_id}`;
      default: return "#";
    }
  }
  if (n.type === "follow") return `/profile/${n.actor.username.replace("@", "")}`;
  return "#";
};

type UnreadCountControl = {
  action: "update_unread_count";
  unread_count: number;
};

function isUnreadCountControl(value: unknown): value is UnreadCountControl {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<UnreadCountControl>;
  return candidate.action === "update_unread_count" && typeof candidate.unread_count === "number";
}

export default function NotificationDropdown() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);

  const {
    notifications,
    loading,
    unreadCount,
    getAllNotifications,
    markNotificationRead,
  } = useNotificationStore();

  useEffect(() => {
    void getAllNotifications(1);
  }, [getAllNotifications]);

  const userProfile = useProfileStore((state) => state.profile);
  const getMyProfile = useProfileStore((state) => state.getMyProfile);

  useEffect(() => {
    if (!userProfile) void getMyProfile();
  }, [userProfile, getMyProfile]);

  useEffect(() => {
    const token = localStorage.getItem("access");
    if (!token || !userProfile) return;

    const socket = io(EXPRESS_URL, {
      auth: { token },
      transports: ["websocket", "polling"],
      reconnection: true,
    });
    socketRef.current = socket;

    socket.on("new-notification", (payload: NotificationItem | UnreadCountControl) => {
      if (isUnreadCountControl(payload)) {
        useNotificationStore.getState().setUnreadCount(payload.unread_count);
        return;
      }
      useNotificationStore.getState().prependNotification(payload);
    });

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
    };
  }, [userProfile]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <div className="relative rounded-full bg-white p-0.5 md:p-1">
        <IconTooltipButton
          onClick={() => setOpen((previous) => !previous)}
          icon={Bell}
          label="Notifications"
          size={18}
        />

        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 rounded-full bg-red-500 px-1.5 py-[1px] text-[10px] text-white" aria-label={`${unreadCount} unread notifications`}>
            {unreadCount}
          </span>
        ) : null}
      </div>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute -right-14 z-50 mt-2 max-h-96 w-80 overflow-y-auto rounded-xl border bg-white p-2 shadow-lg md:right-0"
            role="region"
            aria-label="Notifications"
          >
            {loading && notifications.length === 0 ? (
              <p className="py-4 text-center text-sm text-gray-500" aria-live="polite">Loading notifications…</p>
            ) : notifications.length === 0 ? (
              <p className="py-4 text-center text-sm text-gray-500">No notifications</p>
            ) : (
              <div className="space-y-1">
                {notifications.map((notification) => (
                  <a
                    key={notification.id}
                    href={getNotificationLink(notification)}
                    onClick={() => {
                      if (!notification.is_read) void markNotificationRead(notification.id);
                      setOpen(false);
                    }}
                    className={`flex items-start gap-3 rounded-lg p-2 transition ${notification.is_read ? "bg-gray-50 hover:bg-gray-100" : "bg-[#008753]/5 hover:bg-[#008753]/10"}`}
                  >
                    <img
                      src={getCloudinaryImage(notification.actor.profile_picture)}
                      className="h-10 w-10 rounded-full object-cover"
                      alt=""
                    />
                    <div className="flex-1">
                      <p className="text-sm">
                        <span className="font-semibold">{notification.actor.full_name}</span>{" "}
                        {notification.message.replace(/^@\w+\s*/, "")}
                      </p>
                      <p className="text-xs text-gray-500">{new Date(notification.created_at).toLocaleString("en-GB")}</p>
                    </div>
                    {!notification.is_read ? <Check className="h-4 w-4 text-[#008753]" aria-label="Unread" /> : null}
                  </a>
                ))}

                <a href="/notifications" className="mt-2 block py-2 text-center text-sm font-medium text-[#008753] hover:underline" onClick={() => setOpen(false)}>
                  View all notifications
                </a>
              </div>
            )}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
