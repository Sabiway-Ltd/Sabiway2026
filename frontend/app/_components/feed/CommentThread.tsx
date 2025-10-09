"use client";

import { useState } from "react";
import Image from "next/image";
import { Heart, MessageCircle } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import { toast } from "react-hot-toast";

interface Comment {
  id: string | number;
  author: {
    name: string;
    username: string;
    avatar: string;
    whatsapp_number: string;
  };
  content: string;
  likes: number;
  is_liked?: boolean;
  replies?: Comment[];
  onReplySubmit?: (parentId: string | number, content: string) => Promise<void> | void;
  onLike?: (id: string | number) => Promise<void> | void;
  onUnlike?: (id: string | number) => Promise<void> | void;
}

export default function CommentThread({
  id,
  author,
  content,
  likes,
  is_liked = false,
  replies = [],
  onReplySubmit,
  onLike,
  onUnlike,
}: Comment) {
  const [showReplies, setShowReplies] = useState(true);
  const [localLikes, setLocalLikes] = useState(likes);
  const [liked, setLiked] = useState(is_liked);
  const [showReplyBox, setShowReplyBox] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleReplySubmit = async () => {
    if (!replyText.trim()) return;
    setSubmitting(true);
    try {
      if (onReplySubmit) await onReplySubmit(id, replyText);
      setReplyText("");
      setShowReplyBox(false);
    } catch (err) {
      console.error("Error submitting reply:", err);
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
      // Rollback UI change if API fails
      setLocalLikes(liked ? localLikes + 1 : localLikes - 1);
      setLiked(liked);
    }
  };

  const handleWhatsappClick = () => {
    if (author.whatsapp_number) {
      const whatsappUrl = `https://wa.me/${author.whatsapp_number}`;
      window.open(whatsappUrl, "_blank");
    } else {
      toast.error("This user does not have a WhatsApp number.");
    }
  };

  return (
    <div className="pl-4 border-l border-gray-200">
      <div className="flex items-start gap-3 mb-2">
        <Image
          src={author.avatar}
          alt={author.name}
          width={32}
          height={32}
          className="rounded-full"
        />
        <div className="flex-1">
          <p className="font-semibold text-sm">
            {author.name} <span className="text-gray-500">{author.username}</span>
          </p>
          <p className="text-gray-800 text-sm">{content}</p>

          <div className="flex flex-wrap md:gap-x-3 gap-x-2 text-gray-800 mt-2">
            {/* Like */}
            <button
              className="flex items-center gap-1 hover:text-red-500"
              onClick={handleLikeToggle}
            >
              <Heart className={`h-4 w-4 ${liked ? "fill-red-500 text-red-500" : ""}`} />
              <span className="text-xs">{localLikes}</span>
            </button>

            {/* Reply */}
            <button
              className="flex items-center gap-1 hover:text-blue-500"
              onClick={() => setShowReplyBox(!showReplyBox)}
            >
              <MessageCircle className="h-4 w-4" />
              <span className="text-xs">Reply</span>
            </button>

            {/* WhatsApp */}
            <button
              onClick={handleWhatsappClick}
              className={`flex items-center gap-1 transition-opacity duration-200 hover:text-green-500 ${
                !author.whatsapp_number ? "opacity-50 cursor-not-allowed" : "opacity-100"
              }`}
            >
              <FaWhatsapp size={14} />
            </button>
          </div>

          {showReplyBox && (
            <div className="mt-2 border rounded-full px-4 py-1 bg-white flex w-full justify-between">
              <input
                type="text"
                placeholder="Write a reply..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                className="w-[85%] text-xs outline-none"
              />
              <button
                onClick={handleReplySubmit}
                disabled={submitting || !replyText.trim()}
              >
                Reply
              </button>
            </div>
          )}

          {replies.length > 0 && (
            <button
              onClick={() => setShowReplies(!showReplies)}
              className="text-xs text-blue-500 mt-1 hover:underline"
            >
              {showReplies ? "Hide replies" : `View ${replies.length} replies`}
            </button>
          )}
        </div>
      </div>

      {showReplies && replies.length > 0 && (
        <div className="mt-2 space-y-2">
          {replies.map((reply) => (
            <CommentThread
              key={reply.id}
              {...reply}
              onLike={onLike}
              onUnlike={onUnlike}
              onReplySubmit={onReplySubmit}
            />
          ))}
        </div>
      )}
    </div>
  );
}
