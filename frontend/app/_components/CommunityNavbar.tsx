"use client";

import { useState } from "react";
import Image from "next/image";
import { Bell, Plus, Search, Menu, X } from "lucide-react";
import PostBox from "./PostBox";

export default function CommunityNavbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showPostBox, setShowPostBox] = useState(false);

  return (
    <>
      <nav className="w-full flex justify-center py-4 px-3">
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
          <div className="flex items-center space-x-3 sm:space-x-4">
            {/* Desktop Create Post */}
            <button
              onClick={() => setShowPostBox(true)}
              className="hidden sm:flex items-center gap-x-2 bg-[#008753] rounded-full px-4 py-2 text-sm font-medium text-white"
            >
              <span className="bg-white text-black text-xs w-7 h-7 flex items-center justify-center rounded-full font-semibold">
                CN
              </span>
              Create Post
              <Plus className="h-4 w-4" />
            </button>

            {/* Notification */}
            <button className="bg-white p-2 rounded-full">
              <Bell className="h-5 w-5 text-[#008753]" />
            </button>

            {/* Avatar */}
            <Image
              src="https://i.pravatar.cc/150?img=8"
              alt="User Avatar"
              width={36}
              height={36}
              className="rounded-full"
            />

            {/* Mobile Menu Button */}
            <button
              className="md:hidden bg-white p-2 rounded-full"
              onClick={() => setMenuOpen(true)}
            >
              <Menu className="h-5 w-5 text-[#008753]" />
            </button>
          </div>
        </div>

        {/* Slide-in Drawer (Mobile) */}
        {menuOpen && (
          <div
            className="fixed inset-0 z-50 bg-black/20 flex justify-end"
            onClick={() => setMenuOpen(false)}
          >
            <div
              className="bg-white w-[60%] sm:w-1/2 max-w-xs h-full shadow-lg flex flex-col p-5"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-semibold text-[#008753]">Menu</h2>
                <button onClick={() => setMenuOpen(false)}>
                  <X className="h-6 w-6 text-gray-700" />
                </button>
              </div>

              {/* Search */}
              <div className="w-full px-3 text-xs gap-x-2 rounded py-2 bg-gray-100 flex items-center mb-4">
                <Search className="h-4 w-4 text-gray-600" />
                <input
                  type="text"
                  placeholder="Search Community"
                  className="flex-1 outline-none focus:ring-0 text-sm bg-transparent"
                />
              </div>

              {/* Mobile Create Post */}
              <button
                onClick={() => {
                  setShowPostBox(true);
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

      {/* PostBox (below navbar) */}
      <PostBox visible={showPostBox} onClose={() => setShowPostBox(false)} />
    </>
  );
}
