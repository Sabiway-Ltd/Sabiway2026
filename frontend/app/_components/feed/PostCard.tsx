"use client";

import { useEffect, useState } from "react";
import { Heart, MessageCircle, BarChart2, Share, Bookmark } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import { usePostStore } from "@/app/store/usePostStore";
import CommentThread from "./CommentThread";
import { toast } from "react-hot-toast";
import { CLOUDINARY_CLOUD_NAME, DEFAULT_PROFILE_PICTURE } from "@/app/helper";


export default function PostCard({
  id,
  author,
  content,
  image,
  likes_count,
  comments_count,
  impressions_count,
  is_liked = false,
  is_bookmarked = false,
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
  is_bookmarked?: boolean;
  created_at: string;
}) {
  const [isLiked, setIsLiked] = useState(is_liked);
  const [likesCount, setLikesCount] = useState(likes_count);
  const [commentCount, setCommentCount] = useState(comments_count);
  const [isBookmarked, setIsBookmarked] = useState(is_bookmarked);
  const [comment, setComment] = useState("");
  const [showComments, setShowComments] = useState(false);
  const [formattedDate, setFormattedDate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loadingComments, setLoadingComments] = useState(false);
  const [impressionsCount, setImpressionsCount] = useState(impressions_count || 0);
  const { getPostById } = usePostStore();
  const [isFollowing, setIsFollowing] = useState(false); // initial state depends on your API

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

  // ✅ Utility: Build Cloudinary-safe URL
  const getProfileSrc = (url?: string | null) => {
    if (!url) return DEFAULT_PROFILE_PICTURE;
    if (url.startsWith("http")) return url;
    return `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/${url}`;
  };

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

  // Like / Unlike
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
      await getComments(id);
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

  // For impression
  useEffect(() => {
    const fetchImpression = async () => {
      try {
        const res = await getPostById(id);
        if (res) setImpressionsCount(res.impressions_count || 0);
      } catch (err) {
        console.error("Error fetching impressions:", err);
      }
    };
    fetchImpression();
  }, [id]);


  

  // Follow and unfollow
  const handleFollowToggle = async () => {
    try {
      if (isFollowing) {
        // Call API to unfollow
        await unfollowUser(author.username); // Replace with your API call
        setIsFollowing(false);
      } else {
        // Call API to follow
        await followUser(author.username); // Replace with your API call
        setIsFollowing(true);
      }
    } catch (err) {
      console.error("Follow toggle error:", err);
    }
  };


  return (
    <div className="p-4 border-b">
      {/* Header */}
      <div className="flex justify-between items-center gap-3">
        {/* Profile pic and names */}
        <div className="flex items-center gap-3">
          <img
            src={getProfileSrc(author.profile_picture)}
            alt={author.full_name}
            className="w-12 h-12 rounded-full object-cover border border-gray-200 shadow-sm"
          />
          <div>
            <p className="font-semibold">{author.full_name}</p>
            <p className="text-gray-500 text-sm">{author.username}</p>
            <p className="text-[11px] text-gray-400">{formattedDate}</p>
          </div>
        </div>


         {/* Follow / Unfollow Button */}
        <button
          onClick={handleFollowToggle}
          className={`ml-auto px-3 py-1 rounded-full text-sm font-medium ${
            isFollowing
              ? "bg-gray-200 text-gray-700 hover:bg-gray-300"
              : "bg-blue-500 text-white hover:bg-blue-600"
          }`}
        >
          {isFollowing ? "Unfollow" : "Follow"}
        </button>
      </div>

      {/* Content */}
      <div className="mt-3 text-gray-800 text-sm">{content}</div>

      {/* Image */}
      {image && (
        <div className="mt-3 rounded-xl overflow-hidden">
          <img
            src={
              image.startsWith("http")
                ? image
                : `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/${image}`
            }
            alt="Post image"
            className="object-cover w-full max-h-[450px] rounded-xl border border-gray-100"
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
          <span>{impressionsCount}</span>
        </button>

        <button
          onClick={handleWhatsappClick}
          className={`flex items-center gap-1 transition-opacity duration-200 ${
            !author.whatsapp_number ? "opacity-50 cursor-not-allowed" : "opacity-100"
          }`}
        >
          <FaWhatsapp size={20} />
        </button>

        <button onClick={handleBookmarkToggle} className="flex items-center gap-1">
          <Bookmark
            className={`h-[1.35rem] w-[1.35rem] ${
              isBookmarked ? "fill-blue-500 text-blue-500" : "text-gray-500"
            }`}
          />
        </button>

        <button className="flex items-center gap-1">
          <Share className="h-5 w-5" />
        </button>
      </div>

      {/* Comments */}
      {showComments && (
        <>
          {/* Comment Input */}
          <div className="mt-3 border rounded-full px-4 py-2 bg-white flex w-full justify-between">
            <input
              type="text"
              placeholder="Leave a comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-[85%] text-sm outline-none"
            />
            <button onClick={handleCommentSubmit} disabled={submitting || !comment.trim()}>
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

          {/* Comments List */}
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
                    avatar: getProfileSrc(c.user?.profile_picture),
                    whatsapp_number: c.user?.whatsapp_number || "",
                  }}
                  content={c.content}
                  likes={c.likes_count || 0}
                  is_liked={c.is_liked || false}
                  reply_count={c.reply_count || 0}
                  created_at={c.created_at}
                  onReplySubmit={addReply}
                  onLike={likeComment}
                  onUnlike={unlikeComment}
                  avatarSize="small" // 👈 optional prop you can use in CommentThread to size avatars smaller
                />
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
