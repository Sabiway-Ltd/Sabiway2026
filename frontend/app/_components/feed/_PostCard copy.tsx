// app/_components/feed/PostCard.tsx

"use client";

import { useEffect, useState, useRef } from "react";
import { Heart, MessageCircle, BarChart2, Share, Bookmark, Smile, Image as ImageIcon, X } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import { usePostStore } from "@/app/store/usePostStore";
import { useProfileStore } from "@/app/store/useProfileStore";
import CommentThread from "./CommentThread";
import { toast } from "react-hot-toast";
import { CLOUDINARY_CLOUD_NAME, DEFAULT_PROFILE_PICTURE } from "@/app/helper";
import dynamic from "next/dynamic";
import { EmojiClickData } from "emoji-picker-react";
import DeleteConfirmModal from "../common/DeleteConfirmModal";
import Link from "next/link";

// ✅ Load emoji picker only on client side
const EmojiPicker = dynamic(() => import("emoji-picker-react"), { ssr: false });

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
  myPosts,
  setMyPosts,
  post,
  onReloadPosts,
}: any) {
  const [isLiked, setIsLiked] = useState(is_liked);
  const [likesCount, setLikesCount] = useState(likes_count);
  const [commentCount, setCommentCount] = useState(comments_count);
  const [isBookmarked, setIsBookmarked] = useState(is_bookmarked);
  const [comment, setComment] = useState("");
  const [commentImage, setCommentImage] = useState<File | null>(null);
  const [commentImagePreview, setCommentImagePreview] = useState<string | null>(null);
  const [showComments, setShowComments] = useState(false);
  const [formattedDate, setFormattedDate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loadingComments, setLoadingComments] = useState(false);
  const [impressionsCount, setImpressionsCount] = useState(impressions_count || 0);
  const [followingLoading, setFollowingLoading] = useState(false);
  const [loading, setLoading] = useState(false);

  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editedPostContent, setEditedPostContent] = useState(content);
  const [editedPostImage, setEditedPostImage] = useState<File | null>(null);
  const [uploadingPostImage, setUploadingPostImage] = useState(false);

  const {
    getAllPosts,
    getPostById,
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

  const { followingStatus, toggleFollow, profile: currentUser } = useProfileStore();
  const comments = commentsByPost[id] || [];
  const isFollowing = followingStatus[author.user_id] ?? author.is_following ?? false;

  const getProfileSrc = (url?: string | null) => {
    if (!url) return DEFAULT_PROFILE_PICTURE;
    if (url.startsWith("http")) return url;
    return `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/${url}`;
  };

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

  const handleToggleComments = async () => {
    const nextState = !showComments;
    setShowComments(nextState);

    if (nextState) {
      setLoadingComments(true);
      try {
        await getComments(id); // ✅ always load comments when opened
      } catch (err) {
        console.error("Error loading comments:", err);
      } finally {
        setLoadingComments(false);
      }
    }
  };


  const handleCommentSubmit = async () => {
    if (!comment.trim() && !commentImage) return;
    setSubmitting(true);
    try {
      await addComment(id, comment, commentImage || undefined);
      setComment("");
      setCommentImage(null);
      setCommentImagePreview(null);
      setCommentCount((prev) => prev + 1);
      await getComments(id);
    } catch (err) {
      console.error("Error adding comment:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCommentImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCommentImage(file);
    setCommentImagePreview(URL.createObjectURL(file));
  };

  const handleRemoveCommentImage = () => {
    setCommentImage(null);
    setCommentImagePreview(null);
  };

  const handleBookmarkToggle = async () => {
    setLoading(true);
    try {
      if (isBookmarked) await unbookmarkPost(id);
      else await bookmarkPost(id);
      setIsBookmarked(!isBookmarked);
    } catch (err) {
      console.error("Bookmark error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleWhatsappClick = () => {
    if (author.whatsapp_number) {
      window.open(`https://wa.me/${author.whatsapp_number}`, "_blank");
    } else {
      toast.error("This user does not have a WhatsApp number.");
    }
  };

  const handleFollowToggle = async () => {
    if (followingLoading) return;
    setFollowingLoading(true);
    try {
      await toggleFollow(author.user_id);
      toast.success(`${isFollowing ? "Unfollowed" : "Following"} ${author.full_name}`);
    } catch {
      toast.error("Failed to update follow status");
    } finally {
      setFollowingLoading(false);
    }
  };

  // useEffect(() => {
  //   const fetchImpression = async () => {
  //     try {
  //       const res = await getPostById(id);
  //       if (res) setImpressionsCount(res.impressions_count || 0);
  //     } catch (err) {
  //       console.error("Error fetching impressions:", err);
  //     }
  //   };
  //   fetchImpression();
  // }, [id, getPostById]);

  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [comment]);

  const insertAtCursor = (emoji: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newValue = comment.slice(0, start) + emoji + comment.slice(end);
    setComment(newValue);
    requestAnimationFrame(() => {
      textarea.selectionStart = textarea.selectionEnd = start + emoji.length;
      textarea.focus();
    });
  };

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    insertAtCursor(emojiData.emoji);
    setShowEmojiPicker(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && (comment.trim() || commentImage) && !submitting) {
      e.preventDefault();
      handleCommentSubmit();
    }
  };

  // ——— Post editing and delete handlers are unchanged ———
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  useEffect(() => {
    const handleClickOutside = (event: any) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setEditedPostImage(file);
  };

  const handleSavePost = async (postId: string) => {
    try {
      setUploadingPostImage(true);
      const { post } = await import("@/app/services/post");
      const fd = new FormData();
      fd.append("content", editedPostContent || "");
      if (editedPostImage) fd.append("image", editedPostImage);
      await post.update(postId, fd);
      toast.success("Post updated successfully!");
      setEditingPostId(null);
      setEditedPostImage(null);
      onReloadPosts?.();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Failed to update post.");
    } finally {
      setUploadingPostImage(false);
    }
  };

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [postToDelete, setPostToDelete] = useState<string | null>(null);
  const confirmDeletePost = (postId: string) => {
    setPostToDelete(postId);
    setIsDeleteModalOpen(true);
  };

  const handleDeletePost = async (postId: string) => {
    try {
      const { post } = await import("@/app/services/post");
      await post.delete(postId);
      toast.success("Post deleted successfully!");
      onReloadPosts?.();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Failed to delete post.");
    }
  };

  return (
    <div className="p-4 border-b">
      {/* Header */}
      <div className="flex justify-between items-center gap-3">
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

        {author.user_id !== currentUser?.user_id ? (
          <button
            onClick={handleFollowToggle}
            disabled={followingLoading}
            className={`ml-auto px-3 py-1 rounded-full text-sm font-medium flex items-center justify-center gap-2 transition-all duration-200 ${
              isFollowing
                ? "bg-gray-200 text-gray-700 hover:bg-gray-300"
                : "bg-blue-500 text-white hover:bg-blue-600"
            } ${followingLoading ? "opacity-70 cursor-not-allowed" : ""}`}
          >
            {followingLoading ? (
              <>
                <svg
                  className="animate-spin h-4 w-4 text-current"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8z"
                  ></path>
                </svg>
                <span className="text-xs">
                  {isFollowing ? "Unfollowing..." : "Following..."}
                </span>
              </>
            ) : (
              <span>{isFollowing ? "Unfollow" : "Follow"}</span>
            )}
          </button>
        ) : (
          <div className="ml-auto relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen((prev) => !prev)}
              className="p-2 rounded-full hover:bg-gray-100 transition"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-gray-600"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
              </svg>
            </button>

            {menuOpen && (
              <div className="absolute right-0 mt-2 w-32 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                <button
                  onClick={() => setEditingPostId(id)}
                  className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                >
                  Edit
                </button>
                <button
                  onClick={() => confirmDeletePost(id)}
                  className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Content / Edit Post */}
      {editingPostId === id ? (
        <div className="mt-3 space-y-2">
          <textarea
            value={editedPostContent}
            onChange={(e) => setEditedPostContent(e.target.value)}
            className="w-full border rounded-lg p-2"
          />
          {editedPostImage ? (
            <img
              src={URL.createObjectURL(editedPostImage)}
              alt="Preview"
              className="w-full max-h-48 object-cover rounded-md"
            />
          ) : image ? (
            <img
              src={
                image.startsWith("http")
                  ? image
                  : `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/${image}`
              }
              alt="Post image"
              
              className="rounded-md mb-2 w-full h-auto"
            />
          ) : null}

          <input type="file" onChange={handleImageChange} className="mt-1 cursor-pointer" />
          <div className="flex gap-2 mt-2">
            <button
              onClick={() => handleSavePost(id)}
              className="bg-green-500 text-white px-3 py-1 rounded"
              disabled={uploadingPostImage}
            >
              {uploadingPostImage ? "Saving..." : "Save"}
            </button>
            <button
              onClick={() => setEditingPostId(null)}
              className="bg-gray-400 text-white px-3 py-1 rounded"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          <Link href={`/posts/${id}`} key={id}>
            <div className="mt-3 text-gray-800 text-sm">{content}</div>
            {image && (
              <div className="mt-3 rounded-xl overflow-hidden">
                <img
                  src={image.startsWith("http") ? image : `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/${image}`}
                  alt="Post image"
                  className="object-cover w-full max-h-[450px] rounded-xl border border-gray-100"
                />
              </div>
            )}
          </Link>
        </>
      )}

      {/* Actions */}
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

        <button
          onClick={handleBookmarkToggle}
          className="flex items-center gap-1"
          disabled={loading}
        >
          {loading ? (
            <div className="h-[1.35rem] w-[1.35rem] animate-spin border-2 border-gray-300 border-t-blue-500 rounded-full"></div>
          ) : (
            <Bookmark
              className={`h-[1.35rem] w-[1.35rem] ${
                isBookmarked ? "fill-blue-500 text-blue-500" : "text-gray-500"
              }`}
            />
          )}
        </button>

        <button className="flex items-center gap-1">
          <Share className="h-5 w-5" />
        </button>
      </div>


      {/* Comments Section */}
      {showComments && (
        <>
          {/* 💬 Comment Input with Image */}
          <div className="mt-3 border rounded-3xl bg-white flex flex-col w-full px-4 pt-2 pb-2">
            {commentImagePreview && (
              <div className="relative mb-2 w-32">
                <img
                  src={commentImagePreview}
                  alt="Preview"
                  className="rounded-lg border object-cover w-32 h-32"
                />
                <button
                  onClick={handleRemoveCommentImage}
                  className="absolute -top-2 -right-2 bg-black text-white rounded-full p-1 hover:bg-red-500"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}

            <div className="flex w-full justify-between items-start relative">
              <textarea
                ref={textareaRef}
                placeholder="Leave a comment..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={submitting}
                rows={1}
                className="flex-1 resize-none text-sm outline-none bg-transparent disabled:opacity-60 overflow-hidden"
              />

              <div className="flex items-center gap-3 mr-2">
                {/* Image Upload */}
                <label className="cursor-pointer text-gray-500 hover:text-blue-500 transition flex items-center">
                  <ImageIcon className="w-5 h-5" />
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleCommentImageChange}
                  />
                </label>

                {/* Emoji */}
                <div className="relative flex items-center">
                  <button
                    type="button"
                    onClick={() => setShowEmojiPicker((prev) => !prev)}
                    className="text-gray-500 hover:text-yellow-500 transition flex items-center"
                  >
                    <Smile className="h-5 w-5" />
                  </button>
                  {showEmojiPicker && (
                    <div className="absolute bottom-8 right-0 z-50 scale-75">
                      <EmojiPicker onEmojiClick={handleEmojiClick} />
                    </div>
                  )}
                </div>

                {/* Send */}
                <button
                  onClick={handleCommentSubmit}
                  disabled={submitting || (!comment.trim() && !commentImage)}
                  className="flex items-center justify-center disabled:opacity-50 text-gray-700 hover:text-blue-600 transition"
                >
                  {submitting ? (
                    <svg
                      className="animate-spin h-5 w-5 text-gray-500"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v8z"
                      ></path>
                    </svg>
                  ) : (
                    <svg
                      className="h-5 w-5"
                      viewBox="0 0 22 22"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M0.110839 4.56323C-0.203328 1.74298 2.7003 -0.328105 5.26559 0.887478L19.6979 7.72423C22.4626 9.03285 22.4626 12.9672 19.6979 14.2758L5.26559 21.1138C2.7003 22.3294 -0.202119 20.2583 0.110839 17.438L0.690839 12.2084H10.5001C10.8206 12.2084 11.1279 12.081 11.3545 11.8544C11.5811 11.6278 11.7084 11.3205 11.7084 11C11.7084 10.6795 11.5811 10.3722 11.3545 10.1456C11.1279 9.91899 10.8206 9.79169 10.5001 9.79169H0.692047L0.110839 4.56323Z"
                        fill="currentColor"
                      />
                    </svg>
                  )}
                </button>
              </div>

            </div>
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
                  image={c.image}
                  created_at={c.created_at}
                  onReplySubmit={(parentId, content, image) => addReply(String(parentId), content, image)}
                  onLike={(id) => likeComment(String(id))}
                  onUnlike={(id) => unlikeComment(String(id))}
                />
              ))
            )}
          </div>
        </>
      )}

      {/* Delete confirmation modal */}
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setPostToDelete(null);
        }}
        onConfirm={async () => {
          if (postToDelete) {
            await handleDeletePost(postToDelete);
          }
          setIsDeleteModalOpen(false);
          setPostToDelete(null);
        }}
      />
    </div>
  );
}
