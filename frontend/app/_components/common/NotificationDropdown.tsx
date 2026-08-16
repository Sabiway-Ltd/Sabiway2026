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
  const target = n.target as any;
  if (target) {
    switch (target.type) {
      case "profile": return `/profile/${target.username.replace("@", "")}`;
      case "post": return `/posts/${target.slug || target.id}`;
      case "reply":
      case "comment": return `/posts/${target.post_slug || target.post_id}`;
      default: return "#";
    }
  }
  if (n.type === "follow") return `/profile/${n.actor.username.replace("@", "")}`;
  return "#";
};

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
    getAllNotifications(1);
  }, [getAllNotifications]);

  const userProfile = useProfileStore((state) => state.profile);
  const getMyProfile = useProfileStore((state) => state.getMyProfile);

  useEffect(() => {
    if (!userProfile) getMyProfile();
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

    socket.on("new-notification", (notif: NotificationItem) => {
      useNotificationStore.getState().prependNotification(notif);
    });

    socket.on("update-unread-count", (data: { unread_count: number }) => {
      useNotificationStore.getState().setUnreadCount(data.unread_count);
    });

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
    };
  }, [userProfile]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <div className="md:p-1 p-0.5 bg-white rounded-full relative">
        <IconTooltipButton
          onClick={() => setOpen(prev => !prev)}
          icon={Bell}
          label="Notifications"
          size={18}
        />

        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] px-1.5 py-[1px] rounded-full">
            {unreadCount}
          </span>
        )}
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute md:right-0 -right-14 mt-2 w-80 bg-white rounded-xl shadow-lg border p-2 z-50 max-h-96 overflow-y-auto"
          >
            {loading && notifications.length === 0 ? (
              <p className="text-sm text-center text-gray-500 py-4">Loading...</p>
            ) : notifications.length === 0 ? (
              <p className="text-sm text-center text-gray-500 py-4">No notifications</p>
            ) : (
              <div className="space-y-1">
                {notifications.map((n: NotificationItem) => (
                  <a
                    key={n.id}
                    href={getNotificationLink(n)}
                    onClick={() => {
                      if (!n.is_read) markNotificationRead(n.id);
                      setOpen(false);
                    }}
                    className={`flex items-start gap-3 p-2 rounded-lg transition ${
                      n.is_read ? "bg-gray-50 hover:bg-gray-100" : "bg-[#008753]/5 hover:bg-[#008753]/10"
                    }`}
                  >
                    <img
                      src={getCloudinaryImage(n.actor.profile_picture)}
                      className="w-10 h-10 rounded-full object-cover"
                      alt={n.actor.full_name}
                    />

                    <div className="flex-1">
                      <p className="text-sm">
                        <span className="font-semibold">{n.actor.full_name}</span>{" "}
                        {n.message.replace(/^@\w+\s*/, "")}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(n.created_at).toLocaleString("en-GB")}
                      </p>
                    </div>

                    {!n.is_read && <Check className="h-4 w-4 text-[#008753]" />}
                  </a>
                ))}

                <a
                  href="/notifications"
                  className="block text-center text-sm text-[#008753] font-medium py-2 hover:underline mt-2"
                  onClick={() => setOpen(false)}
                >
                  View All Notifications
                </a>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
