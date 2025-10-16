"use client";

import { useEffect, useState, useRef } from "react";
import { Bell, Plus, Search, Menu, X, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useProfileStore } from "@/app/store/useProfileStore";
import { useNotificationStore } from "@/app/store/useNotificationStore";
import {
  CLOUDINARY_CLOUD_NAME,
  DEFAULT_PROFILE_PICTURE,
} from "@/app/helper";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";

interface CommunityNavbarProps {
  onCreatePost: () => void;
}

export default function CommunityNavbar({ onCreatePost }: CommunityNavbarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();

  const { profile, getMyProfile } = useProfileStore();
  const {
    notifications,
    getNotifications,
    markAsRead,
    unreadCount,
    loading,
  } = useNotificationStore();

  /* -------------------------
     Load profile + notifications
  --------------------------*/
  useEffect(() => {
    if (!profile) getMyProfile();
  }, [profile, getMyProfile]);

  // ✅ Local 5-second polling for notifications
  useEffect(() => {
  getNotifications(); // first fetch shows loading
  const interval = setInterval(() => {
    getNotifications(true); // silent refresh every 5 seconds
  }, 5000);
  return () => clearInterval(interval);
}, [getNotifications]);

  /* -------------------------
     Close dropdown on outside click
  --------------------------*/
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /* -------------------------
     Helper: Cloudinary image
  --------------------------*/
  const getCloudinaryImage = (path: string | null) => {
    if (!path) return DEFAULT_PROFILE_PICTURE;
    if (path.startsWith("http")) return path;
    return `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/${path}`;
  };

  return (
    <nav className="w-full flex justify-center py-4 relative">
      <div className="bg-[#0087530D]/50 rounded-full max-w-[1400px] w-full relative flex items-center justify-between py-2 px-4 md:px-7 shadow-sm">
        {/* Left Section */}
        <div className="flex items-center gap-x-4">
          <button onClick={() => router.replace("/community")}>
            <img
              src="/sabiwaylogo.svg"
              alt="SabiWay Logo"
              className="w-28 sm:w-32 md:w-40 h-auto"
            />
          </button>

          {/* Desktop Search */}
          <div className="hidden md:flex w-60 px-3 gap-x-3 rounded-md py-3 bg-white items-center shadow-sm">
            <Search className="h-4 w-4 text-gray-600 flex-shrink-0" />
            <input
              type="text"
              placeholder="Search Community"
              className="flex-1 outline-none focus:ring-0 text-sm placeholder-gray-400"
            />
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center space-x-3 sm:space-x-4 relative">
          {/* ✅ Create Post */}
          {pathname === "/community" && (
            <button
              onClick={onCreatePost}
              className="hidden sm:flex items-center gap-x-2 bg-[#008753] rounded-full px-4 py-2 text-sm font-medium text-white"
            >
              <img
                src={getCloudinaryImage(profile?.profile_picture ?? DEFAULT_PROFILE_PICTURE)}
                alt={profile?.full_name || "User"}
                onError={(e) => (e.currentTarget.src = DEFAULT_PROFILE_PICTURE)}
                className="w-7 h-7 rounded-full object-cover"
              />
              Create Post
              <Plus className="h-4 w-4" />
            </button>
          )}

          {/* 🔔 Notifications */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen((prev) => !prev)}
              className="bg-white p-2 rounded-full relative"
            >
              <Bell className="h-5 w-5 text-[#008753]" />
              {unreadCount() > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] px-1.5 py-[1px] rounded-full">
                  {unreadCount()}
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
      className="absolute md:right-0 -right-14 space-y-3 mt-2 w-80 bg-white rounded-xl shadow-lg border p-2 z-50 max-h-96 overflow-y-auto"
    >
      {/* Show "Loading..." only when there are no notifications yet */}
      {loading && notifications.length === 0 ? (
        <p className="text-sm text-center text-gray-500 py-4">Loading...</p>
      ) : notifications.length === 0 ? (
        <p className="text-sm text-center text-gray-500 py-4">No notifications</p>
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
            <img
              src={getCloudinaryImage(n.actor.profile_picture)}
              alt={n.actor.full_name || "User"}
              onError={(e) => (e.currentTarget.src = DEFAULT_PROFILE_PICTURE)}
              className="w-10 h-10 rounded-full object-cover"
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

          {/* ✅ User Avatar */}
          <Link href="/profile" className="relative group">
            <img
              src={getCloudinaryImage(profile?.profile_picture ?? DEFAULT_PROFILE_PICTURE)}
              alt={profile?.full_name || "User"}
              onError={(e) => (e.currentTarget.src = DEFAULT_PROFILE_PICTURE)}
              className="w-10 h-10 rounded-full object-cover border-2 border-transparent group-hover:border-[#008753] transition-all duration-200 group-hover:scale-105 cursor-pointer shadow-sm"
            />
            <span className="absolute inset-0 rounded-full ring-2 ring-transparent group-hover:ring-[#008753]/40 transition"></span>
          </Link>

          {/* Mobile Menu */}
          {pathname === "/community" && (
            <button
              className="md:hidden bg-white p-2 rounded-full"
              onClick={() => setMenuOpen(true)}
            >
              <Menu className="h-5 w-5 text-[#008753]" />
            </button>
          )}
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
              <img
                src={getCloudinaryImage(profile?.profile_picture ?? DEFAULT_PROFILE_PICTURE)}
                alt={profile?.full_name || "User"}
                onError={(e) => (e.currentTarget.src = DEFAULT_PROFILE_PICTURE)}
                className="w-7 h-7 rounded-full object-cover"
              />
              Create Post
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
