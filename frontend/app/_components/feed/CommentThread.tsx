"use client";

import { useState } from "react";
import Image from "next/image";
import { Heart, MessageCircle, BarChart2, Share, Bookmark } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";

interface Comment {
  id: string | number;
  author: {
    name: string;
    username: string;
    avatar: string;
  };
  content: string;
  likes: number;
  comments: number;
  impressions: number;
  replies?: Comment[];
  onReplySubmit?: (parentId: string | number, content: string) => Promise<void> | void;
}

export default function CommentThread({
  id,
  author,
  content,
  likes,
  comments,
  impressions,
  replies = [],
  onReplySubmit,
}: Comment) {
  const [showReplies, setShowReplies] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
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

  return (
    <div className="pl-4 border-l border-gray-200">
      {/* Single comment */}
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
            {author.name}{" "}
            <span className="text-gray-500">@{author.username}</span>
          </p>
          <p className="text-gray-800 text-sm">{content}</p>

          {/* Action bar */}
          <div className="flex flex-wrap lg:gap-x-6 md:gap-x-4 gap-x-3 justify-between text-gray-800 mt-2">
            {/* Like */}
            <button
              className="flex items-center gap-1 hover:text-red-500"
              onClick={() => setIsLiked(!isLiked)}
            >
              <Heart
                className={`h-4 w-4 ${
                  isLiked ? "fill-red-500 text-red-500" : ""
                }`}
              />
              <span className="text-xs">{likes + (isLiked ? 1 : 0)}</span>
            </button>

            {/* Reply */}
            <button
              className="flex items-center gap-1 hover:text-blue-500"
              onClick={() => setShowReplyBox(!showReplyBox)}
            >
              <MessageCircle className="h-4 w-4" />
              <span className="text-xs">Reply</span>
            </button>

            {/* Impressions */}
            <button className="flex items-center gap-1 hover:text-gray-700">
              <BarChart2 className="h-4 w-4" />
              <span className="text-xs">{impressions}</span>
            </button>

            {/* WhatsApp */}
            <button className="flex items-center gap-1 hover:text-green-500">
              <FaWhatsapp size={14} />
            </button>

            {/* Bookmark */}
            <button
              className="flex items-center gap-1 hover:text-blue-500"
              onClick={() => setIsBookmarked(!isBookmarked)}
            >
              <Bookmark
                className={`h-4 w-4 ${
                  isBookmarked ? "fill-blue-500 text-blue-500" : "text-gray-500"
                }`}
              />
            </button>

            {/* Share */}
            <button className="flex items-center gap-1 hover:text-gray-700">
              <Share className="h-4 w-4" />
            </button>
          </div>

          {/* Reply Input Box (only when clicked) */}
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

          {/* Toggle replies */}
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

      {/* Nested replies */}
      {showReplies && replies.length > 0 && (
        <div className="mt-2 space-y-2">
          {replies.map((reply) => (
            <CommentThread key={reply.id} {...reply} />
          ))}
        </div>
      )}
    </div>
  );
}
