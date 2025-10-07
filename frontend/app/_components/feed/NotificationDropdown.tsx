// app/_components/feed/NotificationDropdown.tsx
"use client";

import { useEffect, useState, useRef } from "react";
import { Bell } from "lucide-react";
import { api } from "@/app/services/api";

export default function NotificationDropdown() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await api.get("/notifications/");
        setNotifications(res.data);
      } catch (error) {
        console.error("Failed to fetch notifications:", error);
      }
    };

    fetchNotifications();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Icon */}
      <button
        onClick={() => setOpen(!open)}
        className="bg-white p-2 rounded-full relative"
      >
        <Bell className="h-5 w-5 text-[#008753]" />
        {notifications.some((n) => !n.is_read) && (
          <span className="absolute top-1 right-1 bg-red-500 rounded-full w-2.5 h-2.5" />
        )}
      </button>

      {/* Dropdown Panel */}
      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden">
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">
                No notifications yet.
              </p>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`flex items-start gap-3 p-3 hover:bg-gray-50 ${
                    !n.is_read ? "bg-green-50/30" : ""
                  }`}
                >
                  <img
                    src={n.actor?.profile_picture || "/default-avatar.png"}
                    alt={n.actor?.full_name}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                  <div className="flex-1">
                    <p className="text-sm text-gray-800">
                      <span className="font-semibold">{n.actor?.full_name}</span>{" "}
                      {n.type === "follow"
                        ? "started following you"
                        : n.type === "like"
                        ? "liked your post"
                        : n.type === "comment"
                        ? `commented: "${n.message}"`
                        : "did something new!"}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(n.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
