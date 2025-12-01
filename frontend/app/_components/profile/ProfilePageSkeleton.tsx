"use client";

import PostSkeleton from "../feed/PostSkeleton";

export default function ProfilePageSkeleton() {
  return (
    <div className="max-w-3xl mx-auto pb-5 animate-pulse">
      {/* Profile Header */}
      <div className="flex flex-col md:flex-row md:items-center gap-4 relative bg-white p-4 rounded-lg shadow-sm animate-pulse border border-gray-200 py-5 px-4.5">
        {/* Row 1: Profile picture + info */}
        <div className="flex items-center gap-4 flex-1">
          {/* Profile Picture */}
          <div className="relative w-[80px] h-[80px] md:w-[100px] md:h-[100px] rounded-full bg-gray-200" />

          {/* Profile Info */}
          <div className="flex-1 space-y-2">
            <div className="w-32 h-5 bg-gray-200 rounded-md"></div> {/* Name */}
            <div className="w-48 h-4 bg-gray-200 rounded-md"></div> {/* Job / Username */}
            <div className="w-full h-3 bg-gray-200 rounded-md"></div> {/* Bio */}
            <div className="flex gap-2 mt-2">
              <div className="w-20 h-8 bg-gray-200 rounded-md"></div> {/* Follow / Button */}
              <div className="w-8 h-8 bg-gray-200 rounded-full"></div> {/* Icon */}
            </div>
          </div>
        </div>

        {/* Row 2: Action buttons */}
        <div className="hidden md:flex justify-start md:justify-end gap-x-2 items-center w-full md:w-auto">
          <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
          <div className="w-20 h-8 bg-gray-200 rounded-md"></div>
        </div>
      </div>

      {/* Posts Section */}
      <div className="space-y-4 pb-6 mt-4">
        {[...Array(1)].map((_, i) => (
          <PostSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
