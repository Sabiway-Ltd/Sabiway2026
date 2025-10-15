// app/_components/feed/CommentThread.tsx

"use client";

import { useState, useEffect } from "react";
import { Heart, MessageCircle } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import { toast } from "react-hot-toast";

interface CommentProps {
  id: string | number;
  author: {
    name: string;
    username: string;
    avatar: string;
    whatsapp_number?: string;
  };
  content: string;
  reply_count?: number;
  likes: number;
  is_liked?: boolean;
  replies?: CommentProps[];
  onReplySubmit?: (parentId: string | number, content: string) => Promise<void> | void;
  onLike?: (id: string | number) => Promise<void> | void;
  onUnlike?: (id: string | number) => Promise<void> | void;
  isReply?: boolean;
  created_at?: string;
}

export default function CommentThread({
  id,
  author,
  content,
  likes,
  reply_count = 0,
  is_liked = false,
  replies: initialReplies = [],
  onReplySubmit,
  onLike,
  onUnlike,
  isReply = false,
  created_at,
}: CommentProps) {
  const [showReplies, setShowReplies] = useState(false);
  const [localLikes, setLocalLikes] = useState(likes);
  const [liked, setLiked] = useState(is_liked);
  const [showReplyBox, setShowReplyBox] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formattedDate, setFormattedDate] = useState("");
  const [replies, setReplies] = useState<CommentProps[]>(initialReplies);

  const handleReplySubmit = async () => {
    if (!replyText.trim()) return;
    setSubmitting(true);
    try {
      const newReply: CommentProps = {
        id: Date.now(),
        author: {
          name: "Dummy User",
          username: "@dummy",
          avatar: "https://i.pravatar.cc/40?img=5",
          whatsapp_number: "",
        },
        content: replyText,
        likes: 0,
        isReply: true,
        created_at: new Date().toISOString(),
      };

      setReplies([...replies, newReply]);
      if (onReplySubmit) await onReplySubmit(id, replyText);

      setReplyText("");
      setShowReplyBox(false);
      setShowReplies(true);
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
              ? author.avatar
              : "https://res.cloudinary.com/devqbjptr/image/upload/v1759934268/Avatar_2_rl1a6d.png"
          }
          alt={author.name || "User"}
          className="w-8 h-8 rounded-full object-cover"
        />

        <div className="flex-1">
          <p className="font-semibold text-sm">
            {author.name} <span className="text-gray-500">{author.username}</span>
          </p>
          {formattedDate && (
            <p className="text-[11px] text-gray-400">{formattedDate}</p>
          )}
          <p className="text-gray-800 text-sm">{content}</p>

          <div className="flex flex-wrap md:gap-x-3 gap-x-2 text-gray-800 mt-2">
            {/* ❤️ Like */}
            <button
              className="flex items-center gap-1 hover:text-red-500"
              onClick={handleLikeToggle}
            >
              <Heart
                className={`h-4 w-4 ${liked ? "fill-red-500 text-red-500" : ""}`}
              />
              <span className="text-xs">{localLikes}</span>
            </button>

            {/* 💬 Reply */}
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
                !author.whatsapp_number
                  ? "opacity-50 cursor-not-allowed"
                  : "opacity-100"
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
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleReplySubmit();
                  }
                }}
                className="w-[85%] text-xs outline-none"
              />

              <button
                onClick={handleReplySubmit}
                disabled={submitting || !replyText.trim()}
              >
                ➤
              </button>
            </div>
          )}

          {/* 💭 View Replies */}
          {!isReply && (reply_count || replies.length) > 0 && (
            <button
              onClick={() => setShowReplies(!showReplies)}
              className="text-xs text-blue-500 mt-1 hover:underline"
            >
              {showReplies
                ? "Hide replies"
                : `View ${reply_count || replies.length} ${
                    (reply_count || replies.length) === 1 ? "reply" : "replies"
                  }`}
            </button>
          )}
        </div>
      </div>

      {/* 🌀 Replies */}
      {showReplies && (
        <div className="mt-2 space-y-2">
          {replies.length > 0 ? (
            replies.map((reply) => (
              <CommentThread
                key={reply.id}
                {...reply}
                isReply={true}
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
