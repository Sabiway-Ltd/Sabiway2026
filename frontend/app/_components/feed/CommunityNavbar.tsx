"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, Plus, Search, Menu, X, Check } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useProfileStore } from "@/app/store/useProfileStore";
import { useNotificationStore } from "@/app/store/useNotificationStore";
import { useAuthStore } from "@/app/store/useAuthStore";
import { CLOUDINARY_CLOUD_NAME, DEFAULT_PROFILE_PICTURE } from "@/app/helper";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import toast from "react-hot-toast";
import { usePostStore } from "@/app/store/usePostStore";

// ✅ Include onReset here
interface CommunityNavbarProps {
  onCreatePost: () => void;
  onSearch: (searchTerm: string) => void;
  onReset?: () => void;
}

export default function CommunityNavbar({
  onCreatePost,
  onSearch,
  onReset, // ✅ added
}: CommunityNavbarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState("");
  
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);


  const router = useRouter();
  const pathname = usePathname();

  const { logout } = useAuthStore();

  const { profile, getMyProfile } = useProfileStore();
  const { socket } = useAuthStore();
  const { notifications, getNotifications, markAsRead, addNotification, loading } =
    useNotificationStore();

  const unreadCount = notifications.filter((n) => !n.is_read).length;
  

  // 🔁 Auto-refresh notifications
  useEffect(() => {
    if (!profile) getMyProfile();
    getNotifications();
    const interval = setInterval(() => getNotifications(), 5000);
    return () => clearInterval(interval);
  }, []);

  // 🔔 Socket listener
  useEffect(() => {
    if (!socket) return;
    const handleNewNotification = (notif: any) => {
      addNotification(notif);
      toast.success(notif.message || "New notification!");
    };
    socket.on("notification:new", handleNewNotification);
    return () => socket.off("notification:new", handleNewNotification);
  }, [socket, addNotification]);

  // 🪟 Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifDropdownOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);


  const getCloudinaryImage = (path: string | null) => {
    if (!path) return DEFAULT_PROFILE_PICTURE;
    return path.startsWith("http")
      ? path
      : `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/${path}`;
  };

  // 🔍 Handle search
  const handleSearchKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && searchQuery.trim() !== "") {
      onSearch(searchQuery.trim());
    } else if (e.key === "Escape") {
      setSearchQuery("");
    }
  };

  // 🟢 Handle SabiWay logo click
  const { triggerRefresh } = usePostStore.getState();
  const handleLogoClick = () => {
    // router.push("/community");
    window.location.href = "/community"
    triggerRefresh();
  };


  // For Notification
  const handleNotificationClick = async (n) => {
    try {
      // 1️⃣ Mark as read in backend
      await markAsRead(n.id);

      // 2️⃣ Navigate to relevant page
      if (n.target) {
        switch (n.target.type) {
          case "profile":
            router.push(`/profile/${n.target.username.replace("@", "")}`);
            break;
          case "post":
            router.push(`/posts/${n.target.slug || n.target.id}`);
            break;
          case "comment":
          case "reply":
            // Optional: scroll to post + highlight comment/reply
            router.push(`/posts/${n.target.post_slug || n.target.post_id}`);
            break;
          default:
            console.warn("Unknown notification target:", n.target);
        }
      }else if(n.type == "follow"){
        router.push(`/profile/${n.actor.username.replace("@", "")}`);
      }
    } catch (err) {
      console.error("Error handling notification click:", err);
    }
  };

  return (
    <nav className="w-full flex justify-center py-4 relative">
      <div className="bg-[#0087530D]/50 rounded-full max-w-[1400px] w-full relative flex items-center justify-between py-2 px-4 md:px-7 shadow-sm">
        {/* Left Section */}
        <div className="flex items-center gap-x-4">
          <button onClick={handleLogoClick}>
            <img
              src="https://res.cloudinary.com/devqbjptr/image/upload/v1761378056/Group_3_2_1_tg69iu.png"
              alt="SabiWay Logo"
              className="w-28 sm:w-32 md:w-40 h-auto cursor-pointer hover:opacity-90 transition"
            />
          </button>

          {/* Desktop Search */}
          {
            pathname === "/community" &&(
              <div className="hidden md:flex w-60 px-3 gap-x-3 rounded-md py-3 bg-white items-center shadow-sm">
                <Search className="h-4 w-4 text-gray-600 flex-shrink-0" />
                <input
                  type="text"
                  placeholder="Search Community"
                  className="flex-1 outline-none focus:ring-0 text-sm placeholder-gray-400"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleSearchKey}
                />
              </div>
            )
          }
          </div>
          

        {/* Right Section */}
        <div className="flex items-center space-x-3 sm:space-x-4 relative">
          {pathname === "/community" && (
            <button
              onClick={onCreatePost}
              className="hidden sm:flex items-center gap-x-2 bg-[#008753] rounded-full px-4 py-2 text-sm font-medium text-white"
            >
              <div className="flex items-center justify-center py-2 px-2 rounded-full bg-white/20 text-white font-semibold text-xs">
                {profile?.initials}
              </div>
              <span>Create Post</span>
              <Plus className="h-4 w-4" />
            </button>
          )}

          {/* Notifications */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setNotifDropdownOpen((prev) => !prev)}
              className="bg-white p-2 rounded-full relative"
            >
              <Bell className="h-4 w-4 md:h-6 w-6  text-[#008753]" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] px-1.5 py-[1px] rounded-full">
                  {unreadCount}
                </span>
              )}
            </button>
            <AnimatePresence>
              {notifDropdownOpen  && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="absolute md:right-0 -right-14 space-y-1 mt-2 w-80 bg-white rounded-xl shadow-lg border p-2 z-50 max-h-96 overflow-y-auto"
                >
                  {loading && notifications.length === 0 ? (
                    <p className="text-sm text-center text-gray-500 py-4">Loading...</p>
                  ) : notifications.length === 0 ? (
                    <p className="text-sm text-center text-gray-500 py-4">No notifications</p>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => handleNotificationClick(n)}
                        className={`flex items-start gap-3 p-2 rounded-lg cursor-pointer transition ${
                          n.is_read
                            ? "bg-gray-50 hover:bg-gray-100"
                            : "bg-[#008753]/10 hover:bg-[#008753]/20"
                        }`}
                      >
                        <img
                          src={getCloudinaryImage(n.actor.profile_picture)}
                          alt={n.actor.full_name || "User"}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        <div className="flex-1">
                          <p className="text-sm text-gray-800">
                            <span className="font-semibold">{n.actor.full_name}</span>{" "}
                            {n.message}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(n.created_at).toLocaleString("en-GB", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                              hour: "numeric",
                              minute: "2-digit",
                              hour12: true,
                            })}
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

          {/* Profile Picture Dropdown */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setProfileDropdownOpen((prev) => !prev)}
              className="relative group focus:outline-none"
            >
              <img
                src={getCloudinaryImage(profile?.profile_picture ?? DEFAULT_PROFILE_PICTURE)}
                alt={profile?.full_name || "User"}
                className="w-14 h-14 rounded-full object-cover border-2 border-transparent group-hover:border-[#008753] transition-all duration-200 group-hover:scale-105 cursor-pointer shadow-sm"
              />
            </button>

            <AnimatePresence>
              {profileDropdownOpen  && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-0 mt-3 w-48 bg-white rounded-xl shadow-lg border border-gray-100 z-50 py-2"
                >
                  <button
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      router.push("/profile");
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                  >
                    <img
                      src={getCloudinaryImage(profile?.profile_picture ?? DEFAULT_PROFILE_PICTURE)}
                      className="md:w-7 md:h-7 w-4 h-4 rounded-full object-cover"
                      alt="Profile"
                    />
                    Profile
                  </button>

                  <button
                    onClick={() => {handleLogoClick()}}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 text-[#008753]"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 20h5V4H2v16h5m10 0a2 2 0 002-2v-3H7v3a2 2 0 002 2h8z"
                      />
                    </svg>
                    Community
                  </button>

                  <hr className="my-1 border-gray-200" />

                  <button
                     onClick={async () => {
                        await logout();
                        window.location.href = "/login"; // redirect to login after logout
                      }}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 text-red-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v1"
                      />
                    </svg>
                    Sign Out
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>


          {/* Mobile Menu */}
          {pathname === "/community" && (
            <button className="md:hidden bg-white p-2 rounded-full" onClick={() => setMenuOpen(true)}>
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

            {/* Mobile Search */}
            <div className="w-full px-3 text-xs gap-x-2 rounded py-2 bg-gray-100 flex items-center mb-4">
              <Search className="h-4 w-4 text-gray-600" />
              <input
                type="text"
                placeholder="Search Community"
                className="flex-1 outline-none focus:ring-0 text-sm bg-transparent"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchKey}
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
