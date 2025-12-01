// app/_components/profile/ProfilePostCard.tsx

import Link from "next/link";
import { usePostStore } from "@/app/store/usePostStore";
import { useState } from "react";
import { getProfileImage } from "@/app/helper";
import toast from "react-hot-toast";
import ProfileKebab from "./ProfileKebab";
import { CLOUDINARY_CLOUD_NAME } from "@/app/helper";

export default function ProfilePostCard({ post }) {
  const { bookmarkPost, unbookmarkPost } = usePostStore();
  const [isBookmarked, setIsBookmarked] = useState(post.is_bookmarked);
  const [loading, setLoading] = useState(false);

  const formattedDate = new Date(post.created_at).toLocaleString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  const handleBookmarkToggle = async () => {
    setLoading(true);
    try {
      if (isBookmarked) {
        await unbookmarkPost(post.id);
        toast.success("Post unbookmarked");
      } else {
        await bookmarkPost(post.id);
        toast.success("Post bookmarked");
      }
      setIsBookmarked(!isBookmarked);
    } catch (err) {
      console.error("Bookmark error:", err);
      toast.error("Failed to update bookmark");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyPostLink = async () => {
    const postUrl = `${window.location.origin}/posts/${post.id}`;
    await navigator.clipboard.writeText(postUrl);
    toast.success("Post link copied");
  };

  return (
    <div className="border rounded-xl p-4 bg-white hover:shadow-sm transition relative">
      {/* 🔹 Header */}
      <div className="flex justify-between items-start">
        <a href={`/profile/${post.author.username}`}>
          <div className="flex items-center gap-3">
            <img
              src={getProfileImage(post.author.profile_picture)}
              alt={post.author.full_name}
              className="w-10 h-10 rounded-full object-cover border"
            />
            <div>
              <p className="font-semibold text-gray-800">{post.author.full_name}</p>
              <p className="text-gray-500 text-sm">{post.author.username}</p>
              <p className="text-gray-500 text-xs">{formattedDate}</p>
            </div>
          </div>
        </a>

        <ProfileKebab
          handleCopyPostLink={handleCopyPostLink}
          handleBookmarkToggle={handleBookmarkToggle}
          isBookmarked={isBookmarked}
          loading={loading}
        />
      </div>

      {/* 🔹 Content */}
      <a href={`/posts/${post.id}`} key={post.id}>
        <p className="text-gray-700 mt-3 whitespace-pre-line">{post.content}</p>
      </a>

      {/* 🔹 Image (if available) */}
      {post.image && (
        <a href={`/posts/${post.id}`}>
          <img
            src={
              post.image.startsWith("http")
                ? post.image
                : `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/${post.image}`
            }
            alt="Post"
            className="w-full rounded-lg mt-3 object-cover"
          />
        </a>
      )}
    </div>
  );
}
