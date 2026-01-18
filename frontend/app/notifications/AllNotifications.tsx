"use client";

import { useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";
import { DEFAULT_PROFILE_PICTURE, CLOUDINARY_CLOUD_NAME } from "../helper";
import { useAllNotificationsStore, NotificationItem } from "@/app/store/useAllNotificationsStore";
import { useNotificationStore } from "@/app/store/useNotificationStore";



// ----------------------
// Link Builder
// ----------------------
const getNotificationLink = (n: NotificationItem) => {
  if (n.target) {
    switch (n.target.type) {
      case "profile":
        return `/profile/${n.target.username.replace("@", "")}`;

      case "post":
        return `/posts/${n.target.slug || n.target.id}`;

      case "reply":
        return `/posts/${(n.target as any).post_id}`;

      default:
        return "#";
    }
  }

  if (n.type === "follow") {
    return `/profile/${n.actor.username.replace("@", "")}`;
  }

  return "#";
};

const getCloudinaryImage = (path: string | null) => {
  if (!path) return DEFAULT_PROFILE_PICTURE;
  return path.startsWith("http")
    ? path
    : `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/${path}`;
};

// ----------------------
// Component
// ----------------------
export default function AllNotifications() {
  const {
    notifications,
    loading,
    hasMore,
    nextPage,
    getAllNotifications,
    markNotificationRead,
    markAllNotificationsRead,
  } = useAllNotificationsStore();

  const observerRef = useRef<HTMLDivElement | null>(null);

  // Initial Fetch
  useEffect(() => {
    getAllNotifications(1);
  }, []);

  // Infinite Scroll
  useEffect(() => {
    if (!observerRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];

        if (first.isIntersecting && hasMore && !loading && nextPage) {
          getAllNotifications(nextPage);
        }
      },
      { threshold: 1.0 }
    );

    const target = observerRef.current;
    observer.observe(target);

    return () => {
      if (target) observer.unobserve(target);
    };
  }, [hasMore, loading, nextPage]);

  const handleClick = async (notif: NotificationItem) => {
    if (!notif.is_read) {
      await markNotificationRead(notif.id);
    }
  };


  const setUnreadCount = useNotificationStore(
    (state) => state.setUnreadCount
  );

  const handleMarkAll = async () => {
    await markAllNotificationsRead();
    setUnreadCount(0); // 🔥 keep dropdown in sync
  };


  return (
    <div className="max-w-2xl mx-auto px-4 pb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">Notifications</h1>

        <button
          onClick={handleMarkAll}
          className="text-sm text-[#008753] hover:underline"
        >
          Mark all as read
        </button>

      </div>

      {/* List */}
      {notifications.length === 0 && !loading && (
        <div className="text-center text-gray-500 py-10">
          No notifications yet 🚫
        </div>
      )}

      <div className="space-y-3">
        {notifications.map((notif) => {
          const link = getNotificationLink(notif);

          return (
            <a
              key={notif.id}
              href={link}
              onClick={() => handleClick(notif)}
              className={`block p-3 rounded-xl border transition ${
                notif.is_read
                  ? "bg-white border-gray-200"
                  : "bg-[#008753]/5 border-[#008753]/20"
              }`}
            >
              <div className="flex gap-3 items-start">
                {/* Avatar */}
                <div>
                  <img
                    src={getCloudinaryImage(notif.actor.profile_picture)}
                    alt={notif.actor.full_name || "User"}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                </div>

                {/* Content */}
                <div className="flex-1">
                  <p className="text-sm text-gray-800">
                    <span className="font-semibold">{notif.actor.full_name}</span>{" "}
{notif.message.replace(/^@\w+\s*/, "")}
                  </p>

                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(notif.created_at).toLocaleString()}
                  </p>
                </div>

                {/* Badge */}
                {!notif.is_read && (
                  <div className="w-2 h-2 mt-2 bg-[#008753] rounded-full"></div>
                )}
              </div>
            </a>
          );
        })}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-6">
          <Loader2 className="animate-spin w-6 h-6 text-gray-600" />
        </div>
      )}

      {/* Observer Anchor */}
      {hasMore && <div ref={observerRef} className="h-10"></div>}
    </div>
  );
}
