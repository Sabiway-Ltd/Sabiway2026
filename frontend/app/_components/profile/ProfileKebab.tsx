"use client";
import { useRef, useEffect, useState } from "react";

interface ProfileKebabProps {
  handleCopyPostLink: () => Promise<void> | void;
  handleBookmarkToggle: () => Promise<void> | void;
  isBookmarked: boolean;
  loading: boolean; // 👈 added
}

export default function ProfileKebab({
  handleCopyPostLink,
  handleBookmarkToggle,
  isBookmarked,
  loading,
}: ProfileKebabProps) {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleActionClick = async (callback: () => void | Promise<void>) => {
    await callback();
    setOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Kebab icon */}
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="p-1 rounded-full hover:bg-gray-100"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="w-5 h-5 text-gray-600"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zm0 6a.75.75 0 110-1.5.75.75 0 010 1.5zm0 6a.75.75 0 110-1.5.75.75 0 010 1.5z"
          />
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 mt-2 w-40 bg-white border rounded-lg shadow-lg z-10 py-1">
          <button
            onClick={() => handleActionClick(handleCopyPostLink)}
            className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
          >
            Copy link
          </button>

          <button
            onClick={() => handleActionClick(handleBookmarkToggle)}
            disabled={loading}
            className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${
              loading ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {loading
              ? "Processing..."
              : isBookmarked
              ? "Unbookmark"
              : "Bookmark"}
          </button>
        </div>
      )}
    </div>
  );
}
