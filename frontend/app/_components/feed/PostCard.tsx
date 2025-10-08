"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  Heart,
  MessageCircle,
  BarChart2,
  Share,
  Bookmark,
} from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import { usePostStore } from "@/app/store/usePostStore";
import CommentThread from "./CommentThread";


export default function PostCard({
  id,
  author,
  content,
  image,
  likes_count,
  comments_count,
  impressions_count,
  is_liked = false,
  created_at,
}: {
  id: string;
  author: {
    full_name: string;
    username: string;
    profile_picture?: string | null;
  };
  content: string;
  image?: string | null;
  likes_count: number;
  comments_count: number;
  impressions_count?: number;
  is_liked?: boolean;
  created_at: string;
}) {
  const [isLiked, setIsLiked] = useState(is_liked);
  const [likesCount, setLikesCount] = useState(likes_count);
  const [commentCount, setCommentCount] = useState(comments_count);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [comment, setComment] = useState("");
  const [showComments, setShowComments] = useState(false);
  const [formattedDate, setFormattedDate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loadingComments, setLoadingComments] = useState(false);

  const {
    likePost,
    unlikePost,
    addComment,
    getComments,
    bookmarkPost,
    unbookmarkPost,
    commentsByPost,
  } = usePostStore();

  const comments = commentsByPost[id] || [];

  // 🕒 Format date
  useEffect(() => {
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      hour12: true,
    };
    setFormattedDate(new Date(created_at).toLocaleString(undefined, options));
  }, [created_at]);

  // ❤️ Toggle like
  const handleToggleLike = async () => {
    try {
      if (isLiked) {
        setIsLiked(false);
        setLikesCount((prev) => prev - 1);
        await unlikePost(id);
      } else {
        setIsLiked(true);
        setLikesCount((prev) => prev + 1);
        await likePost(id);
      }
    } catch (err) {
      console.error("Error toggling like:", err);
    }
  };

  // 💬 Load comments
  const handleToggleComments = async () => {
    const nextState = !showComments;
    setShowComments(nextState);
    if (nextState && comments.length === 0) {
      setLoadingComments(true);
      try {
        await getComments(id);
      } catch (err) {
        console.error("Error loading comments:", err);
      } finally {
        setLoadingComments(false);
      }
    }
  };

  // ✍️ Add comment
  const handleCommentSubmit = async () => {
    if (!comment.trim()) return;
    setSubmitting(true);
    try {
      await addComment(id, comment);
      setComment("");
      setCommentCount((prev) => prev + 1);
      await getComments(id); // refresh comment list
    } catch (err) {
      console.error("Error adding comment:", err);
    } finally {
      setSubmitting(false);
    }
  };

  // 🔖 Bookmark
  const handleBookmarkToggle = async () => {
    try {
      if (isBookmarked) {
        await unbookmarkPost(id);
      } else {
        await bookmarkPost(id);
      }
      setIsBookmarked(!isBookmarked);
    } catch (err) {
      console.error("Bookmark error:", err);
    }
  };

  return (
    <div className="p-4 border-b">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Image
          src={
            author.profile_picture ||
            "https://res.cloudinary.com/devqbjptr/image/upload/v1759934268/Avatar_2_rl1a6d.png"
          }
          alt={author.full_name}
          width={40}
          height={40}
          className="rounded-full"
          unoptimized
        />
        <div>
          <p className="font-semibold">{author.full_name}</p>
          <p className="text-gray-500 text-sm">@{author.username}</p>
          <p className="text-[11px] text-gray-400">{formattedDate}</p>
        </div>
      </div>

      {/* Content */}
      <div className="mt-3 text-gray-800 text-sm">{content}</div>

      {/* Image */}
      {image && (
        <div className="mt-3 rounded-xl overflow-hidden">
          <Image
            src={image}
            alt="Post image"
            width={600}
            height={400}
            className="object-cover w-full"
          />
        </div>
      )}

      {/* Action Bar */}
      <div className="flex justify-between text-gray-800 mt-3 lg:w-[40%] md:w-[60%]">
        <button onClick={handleToggleLike} className="flex items-center gap-1">
          <Heart
            className={`h-5 w-5 ${
              isLiked ? "fill-red-500 text-red-500" : ""
            }`}
          />
          <span>{likesCount}</span>
        </button>

        <button
          onClick={handleToggleComments}
          className="flex items-center gap-1"
        >
          <MessageCircle className="h-5 w-5" />
          <span>{commentCount}</span>
        </button>

        <button className="flex items-center gap-1">
          <BarChart2 className="h-5 w-5" />
          <span>{impressions_count || 0}</span>
        </button>

        <button className="flex items-center gap-1">
          <FaWhatsapp size={20} />
        </button>

        <button
          onClick={handleBookmarkToggle}
          className="flex items-center gap-1"
        >
          <Bookmark
            className={`h-5 w-5 ${
              isBookmarked ? "fill-blue-500 text-blue-500" : "text-gray-500"
            }`}
          />
        </button>

        <button className="flex items-center gap-1">
          <Share className="h-5 w-5" />
        </button>
      </div>

      {/* Comment Box */}
      {showComments && (
        <>
          <div className="mt-3 border rounded-full px-4 py-2 bg-white flex w-full justify-between">
            <input
              type="text"
              placeholder="Leave a comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-[85%] text-sm"
            />
            <button
              onClick={handleCommentSubmit}
              disabled={submitting || !comment.trim()}
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 22 22"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M0.110839 4.56323C-0.203328 1.74298 2.7003 -0.328105 5.26559 0.887478L19.6979 7.72423C22.4626 9.03285 22.4626 12.9672 19.6979 14.2758L5.26559 21.1138C2.7003 22.3294 -0.202119 20.2583 0.110839 17.438L0.690839 12.2084H10.5001C10.8206 12.2084 11.1279 12.081 11.3545 11.8544C11.5811 11.6278 11.7084 11.3205 11.7084 11C11.7084 10.6795 11.5811 10.3722 11.3545 10.1456C11.1279 9.91899 10.8206 9.79169 10.5001 9.79169H0.692047L0.110839 4.56323Z"
                  fill="black"
                />
              </svg>
            </button>
          </div>

          {/* Comments */}
          <div className="mt-4 space-y-4">
            {loadingComments ? (
              <p className="text-sm text-gray-500 text-center">
                Loading comments...
              </p>
            ) : comments.length === 0 ? (
              <p className="text-sm text-gray-500 text-center">
                No comments yet.
              </p>
            ) : (
              comments.map((c) => (
                <CommentThread
                  key={c.id}
                  id={Number(c.id)}
                  author={{
                    name: c.user?.full_name || "Unknown",
                    username: c.user?.username || "unknown",
                    avatar:
                      c.user?.profile_picture ||
                      "https://res.cloudinary.com/devqbjptr/image/upload/v1759934268/Avatar_2_rl1a6d.png",
                  }}
                  content={c.content}
                  likes={c.likes_count}
                  comments={0}
                  impressions={0}
                  replies={[]}
                />
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
