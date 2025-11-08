"use client";

import React from "react";
import { CLOUDINARY_CLOUD_NAME, DEFAULT_PROFILE_PICTURE } from "@/app/helper";

interface ProfileImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl?: string | null;
  altText?: string;
}

export default function ProfileImageModal({
  isOpen,
  onClose,
  imageUrl,
  altText = "User",
}: ProfileImageModalProps) {
  if (!isOpen) return null;

  const resolvedUrl =
    imageUrl && imageUrl.startsWith("http")
      ? imageUrl
      : imageUrl
      ? `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/${imageUrl}`
      : DEFAULT_PROFILE_PICTURE;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 bg-opacity-30"
      onClick={onClose}
    >
      <div
        className="relative bg-white rounded-lg shadow-lg p-2 max-w-[90%] max-h-[90%]"
        onClick={(e) => e.stopPropagation()} // prevent close on inner click
      >
        <button
          onClick={onClose}
          className="absolute top-2 right-2 bg-opacity-60 text-black rounded-full p-1 hover:bg-opacity-80"
        >
          ✕
        </button>
        <img
          src={resolvedUrl}
          alt={altText}
          className="rounded-lg max-w-full max-h-[80vh] object-contain"
          onError={(e) => {
            e.currentTarget.src = DEFAULT_PROFILE_PICTURE;
          }}
        />
      </div>
    </div>
  );
}
