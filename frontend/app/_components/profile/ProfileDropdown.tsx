"use client";

import { useState, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter, usePathname } from "next/navigation";
import { CLOUDINARY_CLOUD_NAME, DEFAULT_PROFILE_PICTURE } from "@/app/helper";
import { useAuthStore } from "@/app/store/useAuthStore";
import { useProfileStore } from "@/app/store/useProfileStore";
import { usePostStore } from "@/app/store/usePostStore";
import Link from "next/link";

export default function ProfileDropdown() {
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  const router = useRouter();
  const pathname = usePathname();

  const { logout } = useAuthStore();
  const { profile } = useProfileStore();
  const { triggerRefresh } = usePostStore.getState();

  const getCloudinaryImage = (path: string | null) => {
    if (!path) return DEFAULT_PROFILE_PICTURE;
    return path.startsWith("http")
      ? path
      : `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/${path}`;
  };

  const handleHomeClick = () => {
    // router.push("/community");
    window.location.href = "/community";
    triggerRefresh();
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative " ref={profileRef}>
      <button
        onClick={() => setProfileDropdownOpen(prev => !prev)}
        className="relative block group focus:outline-none"
      >
        <div className="w-8 h-8 md:w-10 md:h-10 rounded-full overflow-hidden border-2 border-transparent group-hover:border-[#008753] transition-all duration-200 group-hover:scale-105 cursor-pointer shadow-sm flex-shrink-0">
          <img
            src={getCloudinaryImage(profile?.profile_picture ?? DEFAULT_PROFILE_PICTURE)}
            alt={profile?.full_name || "User"}
            className="w-full h-full object-cover"
          />
        </div>


      </button>

      <AnimatePresence>
        {profileDropdownOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-3 w-48 bg-white rounded-xl shadow-lg border border-gray-100 z-50 py-2"
          >
            {pathname !== "/profile" && (
              <a href={"/profile"}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
              >
                <img
                  src={getCloudinaryImage(profile?.profile_picture ?? DEFAULT_PROFILE_PICTURE)}
                  className="md:w-7 md:h-7 w-4 h-4 rounded-full object-cover"
                  alt="Profile"
                />
                Profile
              </a>
            )}

            {pathname !== "/community" && (
              <button
                onClick={() => handleHomeClick()}
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
            )}

            <hr className="my-1 border-gray-200" />

            <button
              onClick={async () => {
                await logout();
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
  );
}
