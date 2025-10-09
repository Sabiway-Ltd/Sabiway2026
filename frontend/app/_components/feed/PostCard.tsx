"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Heart, MessageCircle, BarChart2, Share, Bookmark } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import { usePostStore } from "@/app/store/usePostStore";
import CommentThread from "./CommentThread";
import { toast } from "react-hot-toast";

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
    whatsapp_number: string;
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
    likeComment,
    unlikeComment,
    addReply,
  } = usePostStore();

  const comments = commentsByPost[id] || [];

  // Format date
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

  // Post like/unlike
  const handleToggleLike = async () => {
    const prevLiked = isLiked;
    const prevCount = likesCount;
    setIsLiked(!prevLiked);
    setLikesCount(prevLiked ? prevCount - 1 : prevCount + 1);

    try {
      if (prevLiked) await unlikePost(id);
      else await likePost(id);
    } catch (err) {
      setIsLiked(prevLiked);
      setLikesCount(prevCount);
      console.error("Error toggling like:", err);
    }
  };

  // Toggle comments
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

  // Add comment
  const handleCommentSubmit = async () => {
    if (!comment.trim()) return;
    setSubmitting(true);
    try {
      await addComment(id, comment);
      setComment("");
      setCommentCount((prev) => prev + 1);
      await getComments(id); // refresh comments
    } catch (err) {
      console.error("Error adding comment:", err);
    } finally {
      setSubmitting(false);
    }
  };

  // Bookmark toggle
  const handleBookmarkToggle = async () => {
    try {
      if (isBookmarked) await unbookmarkPost(id);
      else await bookmarkPost(id);
      setIsBookmarked(!isBookmarked);
    } catch (err) {
      console.error("Bookmark error:", err);
    }
  };

  // WhatsApp
  const handleWhatsappClick = () => {
    if (author.whatsapp_number) {
      window.open(`https://wa.me/${author.whatsapp_number}`, "_blank");
    } else {
      toast.error("This user does not have a WhatsApp number.");
    }
  };

  return (
    <div className="p-4 border-b">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Image
          src={author.profile_picture || "https://res.cloudinary.com/devqbjptr/image/upload/v1759934268/Avatar_2_rl1a6d.png"}
          alt={author.full_name}
          width={40}
          height={40}
          className="rounded-full"
          unoptimized
        />
        <div>
          <p className="font-semibold">{author.full_name}</p>
          <p className="text-gray-500 text-sm">{author.username}</p>
          <p className="text-[11px] text-gray-400">{formattedDate}</p>
        </div>
      </div>

      {/* Content */}
      <div className="mt-3 text-gray-800 text-sm">{content}</div>

      {/* Image */}
      {image && (
        <div className="mt-3 rounded-xl overflow-hidden">
          <Image
            src={image.startsWith("http") ? image : `https://res.cloudinary.com/devqbjptr/${image}`}
            alt="Post image"
            width={600}
            height={400}
            className="object-cover w-full"
            unoptimized
          />
        </div>
      )}

      {/* Action Bar */}
      <div className="flex justify-between text-gray-800 mt-3 lg:w-[40%] md:w-[60%]">
        <button onClick={handleToggleLike} className="flex items-center gap-1">
          <Heart className={`h-5 w-5 ${isLiked ? "fill-red-500 text-red-500" : ""}`} />
          <span>{likesCount}</span>
        </button>

        <button onClick={handleToggleComments} className="flex items-center gap-1">
          <MessageCircle className="h-5 w-5" />
          <span>{commentCount}</span>
        </button>

        <button className="flex items-center gap-1">
          <BarChart2 className="h-5 w-5" />
          <span>{impressions_count || 0}</span>
        </button>

        <button onClick={handleWhatsappClick} className={`flex items-center gap-1 transition-opacity duration-200 ${!author.whatsapp_number ? "opacity-50 cursor-not-allowed" : "opacity-100"}`}>
          <FaWhatsapp size={20} />
        </button>

        <button onClick={handleBookmarkToggle} className="flex items-center gap-1">
          <Bookmark className={`h-5 w-5 ${isBookmarked ? "fill-blue-500 text-blue-500" : "text-gray-500"}`} />
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
              className="w-[85%] text-sm outline-none"
            />
            <button onClick={handleCommentSubmit} disabled={submitting || !comment.trim()}>
              Reply
            </button>
          </div>

          {/* Comments */}
          <div className="mt-4 space-y-4">
            {loadingComments ? (
              <p className="text-sm text-gray-500 text-center">Loading comments...</p>
            ) : comments.length === 0 ? (
              <p className="text-sm text-gray-500 text-center">No comments yet.</p>
            ) : (
              comments.map((c) => (
                <CommentThread
                  key={c.id}
                  id={String(c.id)}
                  author={{
                    name: c.user?.full_name || "Unknown",
                    username: c.user?.username || "unknown",
                    avatar: c.user?.profile_picture || "https://res.cloudinary.com/devqbjptr/image/upload/v1759934268/Avatar_2_rl1a6d.png",
                    whatsapp_number: c.user?.whatsapp_number || "",
                  }}
                  content={c.content}
                  likes={c.likes_count || 0}
                  is_liked={c.is_liked || false}
                  replies={c.replies || []}
                  onReplySubmit={addReply}
                  onLike={likeComment}
                  onUnlike={unlikeComment}
                />
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
