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
import ProfileDropdown from "../profile/ProfileDropdown";
import { Home, Smartphone } from "lucide-react";
import IconTooltipButton from "../common/IconTooltipButton";


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
      setMenuOpen(false); // ✅ close only on Enter
    } 
    else if (e.key === "Escape") {
      setSearchQuery("");
      setMenuOpen(false); // ✅ close only on Escape
    }
  };


  // 🟢 Handle SabiWay logo click
  const { triggerRefresh } = usePostStore.getState();
  const handleHomeClick = () => {
    // router.push("/community");
    window.location.href = "/community"
    triggerRefresh();
  };


  // For Notification
 const getNotificationLink = (n) => {
  if (n.target) {
    switch (n.target.type) {
      case "profile":
        return `/profile/${n.target.username.replace("@", "")}`;

      case "post":
        return `/posts/${n.target.slug || n.target.id}`;

      case "comment":
      case "reply":
        return `/posts/${n.target.post_slug || n.target.post_id}`;

      default:
        return "#";
    }
  }

  if (n.type === "follow") {
    return `/profile/${n.actor.username.replace("@", "")}`;
  }

  return "#";
};


  return (
    <nav className="w-full flex justify-center py-4 relative">
      <div className="bg-[#008753]/5 rounded-full max-w-[1400px] w-full relative flex items-center justify-between py-2 px-4 md:px-7 shadow-sm">
        {/* Left Section */}
        <div className="flex items-center md:gap-x-4 gap-x-2">
          {/* Logo */}
          <a href="/">
            <img
              src="https://res.cloudinary.com/devqbjptr/image/upload/v1761378056/Group_3_2_1_tg69iu.png"
              alt="SabiWay Logo"
              className="w-20 md:w-32 h-auto cursor-pointer hover:opacity-90 transition"
            />
          </a>

          {/* Home Button */}
          <div className="md:mt-3 mt-1">
            <div className="md:p-1 p-0.5 bg-white rounded-full">
              <IconTooltipButton
                onClick={() => handleHomeClick()}
                icon={Home}
                label="Home"
                size={15}
              />
            </div>
          </div>

          {/* Mobile App Button */}
          <div className="md:mt-3 mt-1 md:p-1 p-0.5 bg-white rounded-full">
            <IconTooltipButton
              onClick={() => window.open("https://play.google.com/store/apps?hl=en", "_blank")}
              icon={Smartphone}
              label="Mobile App"
              size={15}
            />
          </div>

          {/* Desktop Search */}
          {
            pathname === "/community" &&(
              <div className="hidden md:flex w-60 px-3 gap-x-3 rounded-full py-2.5 bg-white items-center shadow-sm">
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
              <div className="flex items-center justify-center py-1 px-1 rounded-full bg-white/20 text-white font-semibold text-xs">
                {profile?.initials}
              </div>
              <span>Create Post</span>
              <Plus className="h-4 w-4" />
            </button>
          )}

          {/* Notifications */}
          <div className="relative" ref={notifRef}>
            <div className="md:p-1 p-0.5 bg-white rounded-full relative">
              <IconTooltipButton
                onClick={() => setNotifDropdownOpen(prev => !prev)}
                icon={Bell}
                label="Notification"
                size={15}
              />

              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] px-1.5 py-[1px] rounded-full">
                  {unreadCount}
                </span>
              )}
            </div>
            <AnimatePresence>
              {notifDropdownOpen  && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className={`absolute md:right-0 
                    ${pathname === "/community" ? "-right-28" : "-right-14"}
                    space-y-1 mt-2 w-80 bg-white rounded-xl shadow-lg border p-2 z-50 max-h-96 overflow-y-auto`}
                >
                  {loading && notifications.length === 0 ? (
                    <p className="text-sm text-center text-gray-500 py-4">Loading...</p>
                  ) : notifications.length === 0 ? (
                    <p className="text-sm text-center text-gray-500 py-4">No notifications</p>
                  ) : (
                    notifications.map((n) => {
                      const link = getNotificationLink(n);

                      return (
                        <a
                          key={n.id}
                          href={link}
                          onClick={() => {
                            markAsRead(n.id);
                            setNotifDropdownOpen(false);
                          }}
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
                              <span className="font-semibold">
                                {n.actor.full_name}
                              </span>{" "}
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
                        </a>
                      );
                    })
                  )}
                </motion.div>

              )}
            </AnimatePresence>
          </div>

          {/* Profile Picture Dropdown */}
          <ProfileDropdown/>


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
