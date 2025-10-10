"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Heart, MessageCircle } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import { toast } from "react-hot-toast";
import { usePostStore } from "@/app/store/usePostStore";

interface Comment {
  id: string | number;
  author: {
    name: string;
    username: string;
    avatar: string;
    whatsapp_number: string;
  };
  content: string;
  reply_count?: number;
  likes: number;
  is_liked?: boolean;
  replies?: Comment[];
  onReplySubmit?: (parentId: string | number, content: string) => Promise<void> | void;
  onLike?: (id: string | number) => Promise<void> | void;
  onUnlike?: (id: string | number) => Promise<void> | void;
  /** 👇 NEW */
  isReply?: boolean;
  created_at?: string; // ✅ NEW
}

export default function CommentThread({
  id,
  author,
  content,
  likes,
  reply_count = 0,
  is_liked = false,
  onReplySubmit,
  onLike,
  onUnlike,
  isReply = false, // 👈 default false (means it's a top-level comment)
  created_at, // ✅ Added
}: Comment) {
  const { repliesByComment, getRepliesByComment } = usePostStore();
  const [showReplies, setShowReplies] = useState(false);
  const [localLikes, setLocalLikes] = useState(likes);
  const [liked, setLiked] = useState(is_liked);
  const [showReplyBox, setShowReplyBox] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loadingReplies, setLoadingReplies] = useState(false);
  const [formattedDate, setFormattedDate] = useState("");

  const replies = repliesByComment[String(id)] || [];

  const handleToggleReplies = async () => {
    setShowReplies((prev) => !prev);
    if (!showReplies && replies.length === 0) {
      setLoadingReplies(true);
      try {
        await getRepliesByComment(String(id));
      } finally {
        setLoadingReplies(false);
      }
    }
  };

  const handleReplySubmit = async () => {
    if (!replyText.trim()) return;
    setSubmitting(true);
    try {
      if (onReplySubmit) await onReplySubmit(id, replyText);

      // ✅ If replies are visible, refresh them to show the new one
      if (showReplies) {
        await getRepliesByComment(String(id));
      } else {
        // ✅ If replies are hidden, open them and load
        setShowReplies(true);
        await getRepliesByComment(String(id));
      }

      // ✅ Clear input after successful post
      setReplyText("");

      // ✅ Hide the reply box after submission
      setShowReplyBox(false);
    } finally {
      setSubmitting(false);
    }
  };

  




  const handleLikeToggle = async () => {
    try {
      if (liked) {
        setLocalLikes(localLikes - 1);
        setLiked(false);
        if (onUnlike) await onUnlike(id);
      } else {
        setLocalLikes(localLikes + 1);
        setLiked(true);
        if (onLike) await onLike(id);
      }
    } catch (err) {
      console.error("Error toggling like:", err);
    }
  };

  const handleWhatsappClick = () => {
    if (author.whatsapp_number) {
      window.open(`https://wa.me/${author.whatsapp_number}`, "_blank");
    } else {
      toast.error("This user does not have a WhatsApp number.");
    }
  };

  useEffect(() => {
    if (created_at) {
      const options: Intl.DateTimeFormatOptions = {
        year: "numeric",
        month: "numeric",
        day: "numeric",
        hour: "numeric",
        minute: "numeric",
        hour12: true,
      };
      setFormattedDate(new Date(created_at).toLocaleString(undefined, options));
    }
  }, [created_at]);

  return (
    <div className="pl-4 border-l border-gray-200">
      <div className="flex items-start gap-3 mb-2">
        <img
          src={
            author.avatar && author.avatar.trim() !== ""
              ? author.avatar.startsWith("http")
                ? author.avatar
                : `https://res.cloudinary.com/devqbjptr/${author.avatar}`
              : "https://res.cloudinary.com/devqbjptr/image/upload/v1759934268/Avatar_2_rl1a6d.png"
          }
          alt={author.name || "User"}
          className="w-8 h-8 rounded-full object-cover"
        />

        <div className="flex-1">
          <p className="font-semibold text-sm">
            {author.name} <span className="text-gray-500">{author.username}</span>
          </p>
          <p className="text-[11px] text-gray-400">{formattedDate}</p> {/* ✅ NEW */}
          <p className="text-gray-800 text-sm">{content}</p>

          <div className="flex flex-wrap md:gap-x-3 gap-x-2 text-gray-800 mt-2">
            {/* ❤️ Like */}
            <button
              className="flex items-center gap-1 hover:text-red-500"
              onClick={handleLikeToggle}
            >
              <Heart className={`h-4 w-4 ${liked ? "fill-red-500 text-red-500" : ""}`} />
              <span className="text-xs">{localLikes}</span>
            </button>

            {/* 💬 Reply (only show if NOT a reply) */}
            {!isReply && (
              <button
                className="flex items-center gap-1 hover:text-blue-500"
                onClick={() => setShowReplyBox(!showReplyBox)}
              >
                <MessageCircle className="h-4 w-4" />
                <span className="text-xs">Reply</span>
              </button>
            )}

            {/* 📞 WhatsApp */}
            <button
              onClick={handleWhatsappClick}
              className={`flex items-center gap-1 transition-opacity duration-200 hover:text-green-500 ${
                !author.whatsapp_number ? "opacity-50 cursor-not-allowed" : "opacity-100"
              }`}
            >
              <FaWhatsapp size={16} />
            </button>
          </div>

          {/* ✍️ Reply Box */}
          {!isReply && showReplyBox && (
            <div className="mt-2 border rounded-full px-4 py-1 bg-white flex w-full justify-between">
              <input
                type="text"
                placeholder="Write a reply..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                className="w-[85%] text-xs outline-none"
              />
              <button onClick={handleReplySubmit} disabled={submitting || !replyText.trim()}>
                <svg
                  width="16"
                  height="16"
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
          )}

          {/* 💭 View Replies */}
          {!isReply && (reply_count ?? replies.length) > 0 && (
            <button
              onClick={handleToggleReplies}
              className="text-xs text-blue-500 mt-1 hover:underline"
            >
              {showReplies
                ? "Hide replies"
                : `View ${reply_count || replies.length} ${
                    reply_count === 1 ? "reply" : "replies"
                  }`}
            </button>
          )}
        </div>
      </div>

      {/* 🌀 Replies Section */}
      {showReplies && (
      <div className="mt-2 space-y-2">
        {loadingReplies ? (
          <p className="text-xs text-gray-400 ml-10">Loading replies...</p>
        ) : replies.length > 0 ? (
          replies.map((reply) => (
            <CommentThread
              key={reply.id}
              id={reply.id}
              author={{
                name: reply.user?.full_name || "Unknown",
                username: reply.user?.username || "",
                avatar:
                  reply.user?.profile_picture ||
                  "https://res.cloudinary.com/devqbjptr/image/upload/v1759934268/Avatar_2_rl1a6d.png",
                whatsapp_number: reply.user?.whatsapp_number || "",
              }}
              content={reply.content}
              likes={reply.likes_count || 0}
              is_liked={reply.is_liked || false}
              created_at={reply.created_at} // ✅ Added
              /** ✅ Use the store actions directly */
              onLike={() => usePostStore.getState().likeReply(String(reply.id))}
              onUnlike={() => usePostStore.getState().unlikeReply(String(reply.id))}
              onReplySubmit={onReplySubmit}
              isReply={true} // 👈 this marks replies so they hide the Reply button
            />
          ))
        ) : (
          <p className="text-xs text-gray-400 ml-10">No replies yet.</p>
        )}
      </div>
    )}

    </div>
  );
}
