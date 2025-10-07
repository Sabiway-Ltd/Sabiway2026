"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { Bell, Plus, Search, Menu, X, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface CommunityNavbarProps {
  onCreatePost: () => void;
}

interface Notification {
  id: number;
  type: string;
  message: string;
  actor: {
    user_id: number;
    username: string;
    full_name: string;
    profile_picture: string | null;
  };
  is_read: boolean;
  created_at: string;
}

export default function CommunityNavbar({ onCreatePost }: CommunityNavbarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  // 🔹 Fetch notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("access");
        const res = await fetch(
          "https://sabiway-9wq4.onrender.com/api/notifications/",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (res.ok) {
          const data = await res.json();
          setNotifications(data);
        }
      } catch (err) {
        console.error("Error fetching notifications:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 🔹 Mark as read
  const markAsRead = async (id: number) => {
    try {
      const token = localStorage.getItem("access");
      const res = await fetch(
        `https://sabiway-9wq4.onrender.com/api/notifications/${id}/read/`,
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
        );
      }
    } catch (err) {
      console.error("Error marking notification as read:", err);
    }
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <nav className="w-full flex justify-center py-4 px-3 relative">
      <div className="bg-[#0087530D]/50 rounded-full max-w-[1400px] w-full relative flex items-center justify-between py-2 px-4 md:px-7 shadow-sm">
        {/* Left: Logo */}
        <div className="flex items-center gap-x-4">
          <Image
            src="/sabiwaylogo.svg"
            alt="SabiWay Logo"
            width={120}
            height={40}
            priority
            className="w-28 sm:w-32 md:w-40 h-auto"
          />

          {/* Desktop Search */}
          <div className="hidden md:flex w-60 px-3 gap-x-2 rounded py-2 bg-white items-center">
            <Search className="h-4 w-4 text-gray-600" />
            <input
              type="text"
              placeholder="Search Community"
              className="flex-1 outline-none focus:ring-0 text-sm"
            />
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center space-x-3 sm:space-x-4 relative">
          {/* Create Post */}
          <button
            onClick={onCreatePost}
            className="hidden sm:flex items-center gap-x-2 bg-[#008753] rounded-full px-4 py-2 text-sm font-medium text-white"
          >
            <span className="bg-white text-black text-xs w-7 h-7 flex items-center justify-center rounded-full font-semibold">
              CN
            </span>
            Create Post
            <Plus className="h-4 w-4" />
          </button>

          {/* Notification */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen((prev) => !prev)}
              className="bg-white p-2 rounded-full relative"
            >
              <Bell className="h-5 w-5 text-[#008753]" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] px-1.5 py-[1px] rounded-full">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Dropdown */}
            <AnimatePresence>
              {dropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border p-2 z-50 max-h-96 overflow-y-auto"
                >
                  {loading ? (
                    <p className="text-sm text-center text-gray-500 py-4">Loading...</p>
                  ) : notifications.length === 0 ? (
                    <p className="text-sm text-center text-gray-500 py-4">
                      No notifications
                    </p>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => markAsRead(n.id)}
                        className={`flex items-start gap-3 p-2 rounded-lg cursor-pointer transition ${
                          n.is_read
                            ? "bg-gray-50 hover:bg-gray-100"
                            : "bg-[#008753]/10 hover:bg-[#008753]/20"
                        }`}
                      >
                        <Image
                          src={
                            n.actor.profile_picture || "https://i.pravatar.cc/150?img=1"
                          }
                          alt={n.actor.full_name}
                          width={40}
                          height={40}
                          className="rounded-full"
                        />
                        <div className="flex-1">
                          <p className="text-sm text-gray-800">
                            <span className="font-semibold">{n.actor.full_name}</span>{" "}
                            {n.type === "like"
                              ? "liked your post"
                              : n.type === "comment"
                              ? "commented on your post"
                              : n.type === "follow"
                              ? "followed you"
                              : n.message}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(n.created_at).toLocaleString()}
                          </p>
                        </div>
                        {!n.is_read && <Check className="h-4 w-4 text-[#008753]" />}
                      </div>
                    ))
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>


          {/* Avatar */}
          <Image
            src="https://i.pravatar.cc/150?img=8"
            alt="User Avatar"
            width={36}
            height={36}
            className="rounded-full"
          />

          {/* Mobile Menu */}
          <button
            className="md:hidden bg-white p-2 rounded-full"
            onClick={() => setMenuOpen(true)}
          >
            <Menu className="h-5 w-5 text-[#008753]" />
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/20 flex justify-end"
          onClick={() => setMenuOpen(false)}
        >
          <div
            className="bg-white w-[80%] sm:w-1/2 max-w-xs h-full shadow-lg flex flex-col p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold text-[#008753]">Menu</h2>
              <button onClick={() => setMenuOpen(false)}>
                <X className="h-6 w-6 text-gray-700" />
              </button>
            </div>

            <div className="w-full px-3 text-xs gap-x-2 rounded py-2 bg-gray-100 flex items-center mb-4">
              <Search className="h-4 w-4 text-gray-600" />
              <input
                type="text"
                placeholder="Search Community"
                className="flex-1 outline-none focus:ring-0 text-sm bg-transparent"
              />
            </div>

            <button
              onClick={() => {
                onCreatePost();
                setMenuOpen(false);
              }}
              className="flex items-center gap-x-2 bg-[#008753] rounded-full px-4 py-3 text-sm font-medium text-white"
            >
              <span className="bg-white text-black text-xs w-7 h-7 flex items-center justify-center rounded-full font-semibold">
                CN
              </span>
              Create Post
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
