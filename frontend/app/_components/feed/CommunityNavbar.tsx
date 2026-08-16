"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, Plus, Search, Menu, X, Check } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useProfileStore } from "@/app/store/useProfileStore";
import { useAuthStore } from "@/app/store/useAuthStore";
import { CLOUDINARY_CLOUD_NAME, DEFAULT_PROFILE_PICTURE } from "@/app/helper";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import toast from "react-hot-toast";
import { usePostStore } from "@/app/store/usePostStore";
import ProfileDropdown from "../profile/ProfileDropdown";
import { Home, Smartphone } from "lucide-react";
import IconTooltipButton from "../common/IconTooltipButton";
import NotificationDropdown from "../common/NotificationDropdown";


// ✅ Include onReset here
interface CommunityNavbarProps {
  onCreatePost: () => void;
  onSearch?: (searchTerm: string) => void;
  hideSearch?: boolean;
  onReset?: () => void;
}

export default function CommunityNavbar({
  onCreatePost,
  onSearch,
  onReset, // ✅ added
  hideSearch = false,
}: CommunityNavbarProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  
  const [searchQuery, setSearchQuery] = useState("");
  const profileRef = useRef<HTMLDivElement>(null);


  const router = useRouter();
  const pathname = usePathname();

  const { logout } = useAuthStore();

  const { profile, getMyProfile } = useProfileStore();


  const getCloudinaryImage = (path: string | null) => {
    if (!path) return DEFAULT_PROFILE_PICTURE;
    return path.startsWith("http")
      ? path
      : `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/${path}`;
  };

  // 🔍 Handle search
  const handleSearchKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && searchQuery.trim() !== "") {
      onSearch?.(searchQuery.trim());
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


 


  return (
    <div>
      <nav className="w-full flex justify-center py-4 relative">
        <div className="bg-[#008753]/5 rounded-full max-w-[1400px] w-full relative flex items-center justify-between py-2 pl-1 pr-3 md:pl-7 md:pr-8 shadow-sm">
          {/* I want all the contens inside this block to tak the usinform hight of this div */}
          <div className="flex items-center gap-x-2 justify-between w-full md:h-[3rem] h-[2.5rem] ">
            {/* Left Section */}
            <div className="flex items-center md:gap-x-4 gap-x-2 h-full">
              {/* Logo */}
              <a href="/">
                <img
                  src="https://res.cloudinary.com/dk6ew5ikb/image/upload/v1764564358/Group_3_2_1_tg69iu_rj7pko.png"
                  alt="SabiWay Logo"
                  className="w-20 md:w-32 cursor-pointer hover:opacity-90 transition md:block hidden"
                />
              </a>

              <a href="/">
                <img
                  src="https://res.cloudinary.com/dk6ew5ikb/image/upload/v1764248519/sabiway_small_logo_pmddcw.png"
                  alt="SabiWay Logo"
                  className="h-6 w-auto cursor-pointer hover:opacity-90 transition md:hidden"
                />
              </a>

              {/* Home Button */}
              <div className="md:p-1 p-0.5 bg-white rounded-full ">
                <IconTooltipButton
                  onClick={() => handleHomeClick()}
                  icon={Home}
                  label="Home"
                  size={17}
                />
              </div>

              {/* Mobile App Button */}
              <div className="md:p-1 p-0.5 bg-white rounded-full ">
                <IconTooltipButton
                  onClick={() =>
                    window.open(
                      "https://play.google.com/store/apps?hl=en",
                      "_blank"
                    )
                  }
                  icon={Smartphone}
                  label="Mobile App"
                  size={17}
                />
              </div>

              {/* Desktop Search */}
              {pathname === "/community" && (
                <div className="hidden md:flex w-60 px-3 gap-x-3 rounded-full py-2.5 bg-white items-center shadow-sm">
                  <Search className="h-4 w-4 text-gray-600 flex-shrink-0" />
                  <input
                    type="text"
                    placeholder="Search SabiForum"
                    className="flex-1 outline-none focus:ring-0 text-sm placeholder-gray-400"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={handleSearchKey}
                  />
                </div>
              )}
            </div>

              

            {/* Right Section */}
            <div className="flex items-center gap-x-2 md:gap-x-4 relative">
              {pathname === "/community" && (
                <div>
                  <button
                    onClick={onCreatePost}
                    className="hidden md:flex items-center gap-x-2 bg-[#008753] rounded-full px-4 py-2 text-sm font-medium text-white"
                  >
                    <div className="flex items-center justify-center py-1 px-1 rounded-full bg-white/20 text-white font-semibold text-xs">
                      {profile?.initials}
                    </div>
                    <span>Ask Question</span>
                    <Plus className="h-4 w-4" />
                  </button>

                  <button
                    onClick={onCreatePost}
                    className="md:hidden  items-center gap-x-2 text-[#008753] bg-white py-2.5 px-2.5 rounded-full  text-sm font-medium "
                  >
                    <span></span>
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              )}

              {/* Mobile Search */}
              {pathname === "/community" && (
                <div className="md:hidden md:p-1 p-0.5 bg-white rounded-full ">
                  <IconTooltipButton
                    onClick={() => setMobileSearchOpen((prev) => !prev)}
                    icon={Search}
                    label="Search SabiForum"
                    size={18}
                  />
                </div>
              )}


              {/* Notifications */}
              <NotificationDropdown/>


              {/* Profile Picture Dropdown */}
              <ProfileDropdown/>

              
            </div>
          </div>
        </div>
      </nav>

      {mobileSearchOpen && (
        <div className="md:hidden mb-2 w-full px-4 py-2 shadow-sm bg-[#008753]/5 rounded-lg p-4">
          <div className="flex items-center gap-x-2 rounded-full bg-white px-3 py-2">
            <Search className="h-4 w-4 text-gray-600" />
            <input
              type="text"
              placeholder="Search SabiForum"
              className="flex-1 outline-none bg-transparent text-sm placeholder-gray-400"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearchKey} // use your existing Enter/Escape handler
            />
          </div>
        </div>
      )}
    </div>

  );
}