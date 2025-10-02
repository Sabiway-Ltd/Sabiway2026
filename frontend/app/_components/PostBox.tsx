"use client";

import Image from "next/image";
import { ImageIcon, Smile, Hash, X } from "lucide-react";

interface PostBoxProps {
  visible: boolean;
  onClose: () => void;
}

export default function PostBox({ visible, onClose }: PostBoxProps) {
  if (!visible) return null;

  return (
    <div className="w-full  mt-4 px-3 ">
      <div className="bg-white rounded-xl shadow-md w-full p-4 relative ">
        {/* Close button (optional for mobile use) */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
        >
          <X className="h-5 w-5" />
        </button>

        {/* User Avatar + textarea */}
        <div className="flex gap-3">
          <Image
            src="https://i.pravatar.cc/150?img=8"
            alt="User Avatar"
            width={40}
            height={40}
            className="w-10 h-10 rounded-full object-cover"
            />

          <textarea
            placeholder="What's on your mind?"
            className="flex-1 resize-none border-0 outline-none p-2 text-sm bg-transparent"
            rows={4}
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end items-center mt-3">
          <div className="flex space-x-4 text-black">
            <button><ImageIcon className="h-5 w-5" /></button>
            <button><Smile className="h-5 w-5" /></button>
            <button><Hash className="h-5 w-5" /></button>
          </div>

        </div>
      </div>
      <div className="flex justify-end">
        <button className="bg-[#008753] text-white text-sm font-medium px-8 py-2 mt-3 rounded-md">
            Post
        </button>
      </div>

        
    </div>
  );
}
