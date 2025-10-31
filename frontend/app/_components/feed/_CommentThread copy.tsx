"use client";

import { useState, useRef, useEffect } from "react";
import dynamic from "next/dynamic";
import { Smile, Image as ImageIcon, Heart, MessageCircle } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import { EmojiClickData } from "emoji-picker-react";
import { toast } from "react-hot-toast";
import { usePostStore } from "@/app/store/usePostStore";
import { useProfileStore } from "@/app/store/useProfileStore";
import { isRiskyContent } from "@/app/utils/contentValidator";
import { getProfileSrc } from "@/app/helper";
import Link from "next/link";
import { MoreHorizontal, Pencil, Trash2, X, Check } from "lucide-react";


const EmojiPicker = dynamic(() => import("emoji-picker-react"), { ssr: false });

// ✅ Updated Comment interface
interface Comment {
  id: string | number;
  parentId?: string | number; // ✅ the parent comment or reply ID
  postId?: string | number;
  parentType?: "comment" | "reply"; // ✅ to distinguish
  author: {
    name: string;
    job: string;
    username: string;
    avatar: string;
    phone_number: string;
  };
  content: string;
  comment?: string | number;
  likes: number;
  is_liked?: boolean;
  reply_count?: number;
  replies?: Comment[];
  onReplySubmit?: (
    parentId: string | number,
    content: string,
    imageFile?: File | null,
    parentType?: "comment" | "reply"
  ) => Promise<void> | void;
  onLike?: (id: string | number) => Promise<void> | void;
  onUnlike?: (id: string | number) => Promise<void> | void;
  isReply?: boolean;
  created_at?: string;
  image?: string | null; // ✅ Added for image display
}

export default function CommentThread({
  id,
  parentId,          // ✅ Add this
  parentType,   
  author,
  content,
  comment,
  postId,
  likes,
  is_liked = false,
  reply_count = 0,
  onReplySubmit,
  onLike,
  onUnlike,
  isReply = false,
  created_at,
  image, // ✅ destructure
  replies: childReplies = [],
}: Comment) {
  let { repliesByComment, getRepliesByComment, addNestedReply, addReply, nestedReplies } = usePostStore();
  repliesByComment = repliesByComment || {};
  nestedReplies = nestedReplies || {};

  const [showReplies, setShowReplies] = useState(false);
  const [localLikes, setLocalLikes] = useState(likes);
  const [liked, setLiked] = useState(is_liked);
  const [showReplyBox, setShowReplyBox] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [replyImage, setReplyImage] = useState<File | null>(null);
  const [replyPreview, setReplyPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [loadingReplies, setLoadingReplies] = useState(false);
  const [formattedDate, setFormattedDate] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  // ✏️ Edit/Delete state
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(content);
  const [editImage, setEditImage] = useState<File | null>(null);
  const [editPreview, setEditPreview] = useState<string | null>(image || null);
  const [showOptions, setShowOptions] = useState(false);
  const [updating, setUpdating] = useState(false);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);


  

  

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const replies =
  parentType === "reply"
    ? childReplies // <-- this uses the prop, not the store
    : repliesByComment[String(id)] || [];







  // 🧭 Handle reply image selection
  const handleReplyImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      setReplyImage(file);
      setReplyPreview(URL.createObjectURL(file));
    }
  };

  const removeReplyImage = () => {
    setReplyImage(null);
    setReplyPreview(null);
  };

  // 🗓️ Format date
  useEffect(() => {
    if (created_at) {
      const options: Intl.DateTimeFormatOptions = {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "numeric",
        hour12: true,
      };
      setFormattedDate(new Date(created_at).toLocaleString(undefined, options));
    }
  }, [created_at]);

  // ✨ Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [replyText]);

  // 🧠 Emoji insertion
  const insertAtCursor = (emoji: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newValue = replyText.slice(0, start) + emoji + replyText.slice(end);
    setReplyText(newValue);
    requestAnimationFrame(() => {
      textarea.selectionStart = textarea.selectionEnd = start + emoji.length;
      textarea.focus();
    });
  };

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    insertAtCursor(emojiData.emoji);
    setShowEmojiPicker(false);
  };

  const handleLikeToggle = async () => {
    try {
      if (liked) {
        setLocalLikes((l) => l - 1);
        setLiked(false);
        if (onUnlike) await onUnlike(id);
      } else {
        setLocalLikes((l) => l + 1);
        setLiked(true);
        if (onLike) await onLike(id);
      }
    } catch (err) {
      console.error("Like toggle error:", err);
    }
  };

  const { profile, getMyProfile } = useProfileStore();
  useEffect(() => {
    if (!profile) {
      getMyProfile();
    }
  }, [profile, getMyProfile]);
  const handleReplySubmit = async () => {
  if (!replyText.trim() && !replyImage) return;
  if (isRiskyContent(replyText))
    return toast.error("Sharing contact info outside SabiWay is not allowed ❌");

  setSubmitting(true);

  try {
    if (parentType === "reply") {
      // 🪄 Add nested reply under a reply
      await addNestedReply(String(id), replyText, replyImage);
      // ✅ Refresh the replies for the parent comment
      await getRepliesByComment(String(comment));
    } else {
      // 🪄 Add reply under a main comment
      await addReply(String(id), replyText, replyImage);
      // ✅ Refresh replies for this comment
      await getRepliesByComment(String(id));
    }

    // ✅ Reset UI and show updated replies
    setReplyText("");
    removeReplyImage();
    setShowReplyBox(false);
    setShowReplies(true);
  } catch (err) {
    console.error("Failed to submit reply:", err);
    toast.error("Failed to submit reply");
  } finally {
    setSubmitting(false);
  }
};








const handleToggleReplies = async () => {
  const willShow = !showReplies;
  setShowReplies(willShow);

  if (willShow && parentType !== "reply") {
    setLoadingReplies(true);
    try {
      await getRepliesByComment(String(id));
    } finally {
      setLoadingReplies(false);
    }
  }
};






  const handleWhatsappClick = () => {
    if (author.phone_number)
      window.open(`https://wa.me/${author.phone_number}`, "_blank");
    else toast.error("This user does not have a WhatsApp number.");
  };

  // 🧾 Build Cloudinary URL helper
  const getImageUrl = (path?: string | null) => {
    if (!path) return null;
    return path.startsWith("http")
      ? path
      : `https://res.cloudinary.com/devqbjptr/${path}`;
  };



  const { updateComment, deleteComment, updateReply, deleteReply } = usePostStore();

  const handleEditSave = async () => {
    if (!editText.trim() && !editImage) return;
    setUpdating(true);

    try {
      // ✅ Update on backend
      if (parentType === "reply") {
        await updateReply(String(id), editText, String(comment), editImage || undefined);
      } else if (parentType === "comment") {
        await updateComment(String(id), editText, String(postId), editImage || undefined);
      }

      // ✅ Refetch to sync UI with latest backend data
      if (parentType === "reply") {
        await getRepliesByComment(String(comment));
      }

      setIsEditing(false);
    } catch (err) {
      console.error("Edit failed:", err);
      toast.error("Update failed");
    } finally {
      setUpdating(false);
    }
  };



  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this?")) return;
    try {
      if (parentType === "reply") {
        await deleteReply(String(id));
      } else {
        await deleteComment(String(id));
      }
    } catch (err) {
      console.error("Delete failed:", err);
      toast.error("Failed to delete");
    }
  };


  return (
    <div className="pl-4 border-l border-gray-200">
      <div className="flex items-start gap-3 mb-2">
        <Link href={`/profile/${author.username}`}>
          <img
            src={author.avatar}
            alt={author.name}
            className="w-8 h-8 rounded-full object-cover"
          />
        </Link>

        <div className="flex-1">
          <div className="flex gap-3 justify-between">
            <Link href={`/profile/${author.username}`}>
              <div className="font-semibold text-sm flex flex-col md:flex-row md:items-center gap-x-1">
                <span>{author.name}</span>
                {author.job && (
                  <span className="text-gray-500 font-light md:ml-1">
                    {`| ${author.job}`}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-gray-400">{formattedDate}</p>
            </Link>


            
            {/* ⋮ Options for edit/delete (only for user's own comment) */}
            {profile?.username === author.username && (
              <div className="relative inline-block float-right">
                <button
                  onClick={() => setShowOptions(!showOptions)}
                  className="text-gray-400 hover:text-gray-600 p-1 rounded"
                >
                  {/* <MoreHorizontal size={16} /> */}
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-5 h-5 text-gray-600"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zm0 6a.75.75 0 110-1.5.75.75 0 010 1.5zm0 6a.75.75 0 110-1.5.75.75 0 010 1.5z"
                    />
                  </svg>
                </button>

                {showOptions && (
                  <div className="absolute right-0 mt-1 w-28 bg-white border border-gray-200 rounded-md shadow-lg z-50">
                    <button
                      onClick={() => {
                        setIsEditing(true);
                        setShowOptions(false);
                      }}
                      className="flex items-center gap-2 px-3 py-1 text-xs hover:bg-gray-100 w-full text-left"
                    >
                      <Pencil size={12} /> Edit
                    </button>

                    <button
                      onClick={async () => {
                        // keep modal open during deletion
                        setUpdating(true);
                        try {
                          await handleDelete();
                        } finally {
                          setUpdating(false);
                          // only close after deletion finishes
                          setShowOptions(false);
                        }
                      }}
                      disabled={updating}
                      className={`flex items-center gap-2 px-3 py-1 text-xs w-full text-left ${
                        updating ? "text-gray-400 cursor-not-allowed" : "text-red-500 hover:bg-gray-100"
                      }`}
                    >
                      {updating ? (
                        <>
                          <svg
                            className="animate-spin h-3.5 w-3.5 text-gray-500"
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
                          Deleting...
                        </>
                      ) : (
                        <>
                          <Trash2 size={12} /> Delete
                        </>
                      )}
                    </button>
                  </div>
                )}

              </div>
            )}
          </div>






          {/* 🖼️ Comment/Reply content */}
          {/* <p className="text-gray-800 text-sm">{content}</p> */}

          {isEditing ? (
  <div className="mt-1">
    <textarea
      value={editText}
      onChange={(e) => setEditText(e.target.value)}
      className="w-full text-sm border rounded-md p-2 focus:outline-none focus:ring-1 focus:ring-blue-400"
      rows={2}
    />

    {/* 🖼️ Image preview if editing */}
    {editPreview && (
      <div className="mt-2 relative inline-block">
        <img
          src={editPreview}
          alt="preview"
          className="w-32 h-32 object-cover rounded-md"
        />
        <button
          type="button"
          onClick={() => {
            setEditImage(null);
            setEditPreview(null);
          }}
          className="absolute top-1 right-1 bg-white text-gray-700 hover:text-red-500 rounded-full p-1 shadow-md border border-gray-200"
        >
          <X size={12} />
        </button>
      </div>
    )}

    {/* 📤 Upload new image (optional) */}
    <div className="mt-2 flex items-center gap-3">
      <input
        id={`edit-img-${id}`}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            setEditImage(file);
            setEditPreview(URL.createObjectURL(file));
          }
        }}
      />
      <label
        htmlFor={`edit-img-${id}`}
        className="cursor-pointer text-gray-600 hover:text-blue-500 flex items-center gap-1 text-xs font-medium"
      >
        <ImageIcon size={14} />
        Change Image
      </label>
    </div>

    {/* ✅ Buttons */}
    <div className="flex justify-end mt-3 gap-2">
      <button
        onClick={() => setIsEditing(false)}
        className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
      >
        <X size={12} /> Cancel
      </button>
      <button
        onClick={handleEditSave}
        disabled={updating}
        className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
      >
        {updating ? "Saving..." : (
          <>
            <Check size={12} /> Save
          </>
        )}
      </button>
    </div>
  </div>
) : (
  <p className="text-gray-800 text-sm">{content}</p>
)}



          {/* ✅ Show image if present */}
          {image && (
            <div className="mt-2">
              <img
                src={getImageUrl(image)}
                alt="comment image"
                className="max-h-48 rounded-md object-cover"
              />
            </div>
          )}

          {/* ❤️ / 💬 / 📞 Actions */}
          <div className="flex flex-wrap md:gap-x-3 gap-x-2 text-gray-800 mt-2">
            <button
              className="flex items-center gap-1 hover:text-red-500"
              onClick={handleLikeToggle}
            >
              <Heart
                className={`h-4 w-4 ${
                  liked ? "fill-red-500 text-red-500" : ""
                }`}
              />
              <span className="text-xs">{localLikes}</span>
            </button>

            <button
                className="flex items-center gap-1 hover:text-blue-500"
                onClick={() => setShowReplyBox(!showReplyBox)}
              >
              <MessageCircle className="h-4 w-4" />
              <span className="text-xs">Reply</span>
            </button>
          </div>

          {/* ✍️ Reply Box */}
          {showReplyBox && (
            <div className="mt-2 border rounded-2xl px-4 pt-2 bg-white flex w-full justify-between items-start relative">
              <div className="flex-1">
                <textarea
                  ref={textareaRef}
                  placeholder="Write a reply..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onKeyDown={(e) => {
                    if (
                      e.key === "Enter" &&
                      !e.shiftKey &&
                      (replyText.trim() || replyImage)
                    ) {
                      e.preventDefault();
                      handleReplySubmit();
                    }
                  }}
                  disabled={submitting}
                  rows={1}
                  className="w-full resize-none text-xs outline-none bg-transparent disabled:opacity-60 overflow-hidden"
                />

                {/* 🖼️ image preview */}
                {replyPreview && (
                  <div className="mt-2 relative inline-block">
                    <img
                      src={replyPreview}
                      alt="preview"
                      className="w-28 h-28 object-cover rounded-md"
                    />
                    <button
                      type="button"
                      onClick={removeReplyImage}
                      className="absolute top-1 right-1 bg-white text-gray-700 hover:text-red-500 rounded-full p-1 shadow-md border border-gray-200 transition"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-3.5 w-3.5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  </div>
                )}

              </div>

              <div className="flex items-center gap-3">
                {/* 🖼️ Image Upload */}
                <input
                  id={`reply-img-${id}`}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleReplyImageChange}
                />
                <label
                  htmlFor={`reply-img-${id}`}
                  className="text-gray-500 cursor-pointer hover:text-blue-500 transition flex items-center"
                >
                  <ImageIcon className="h-5 w-5" />
                </label>

                {/* 😀 Emoji Picker */}
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

                {/* 🚀 Send */}
                <button
                  onClick={handleReplySubmit}
                  disabled={submitting || (!replyText.trim() && !replyImage)}
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
          )}

          {/* 💬 Replies */}
          {(reply_count ?? replies.length) > 0 && (
              <button
                onClick={handleToggleReplies}
                className="text-xs text-blue-500 mt-1 hover:underline"
              >
                {showReplies
                  ? "Hide replies"
                  : isReply
                  ? `View nested ${reply_count || replies.length} replies`
                  : `View ${reply_count || replies.length} replies`}
              </button>
            )}



        </div>
      </div>

      {/* 🧩 Replies Section */}
      {showReplies && (
      <div className="mt-2 space-y-2">
        {replies.length > 0 ? (
          replies.map((reply) => (
            <CommentThread
              key={reply.id}
              id={reply.id}
              parentId={reply.parent_reply_id}
              parentType="reply"
              postId={reply.id}
              author={{
                name: reply.user?.full_name || profile?.full_name || "You",
                job: reply.user?.job || profile?.job || "",
                username: reply.user?.username || profile?.username || "",
                avatar: getProfileSrc(reply.user?.profile_picture)||
                  getProfileSrc(profile?.profile_picture),
                phone_number: reply.user?.phone_number || profile?.phone_number || "",
              }}
              content={reply.content}
              likes={reply.likes_count || 0}
              is_liked={reply.is_liked || false}
              created_at={reply.created_at}
              image={reply.image}
              replies={reply.nested_replies || []} // ✅ pass nested replies explicitly
              onLike={() => usePostStore.getState().likeReply(String(reply.id))}
              onUnlike={() => usePostStore.getState().unlikeReply(String(reply.id))}
              reply_count={reply.nested_replies?.length || 0}
              comment={reply.comment}
              isReply
            />
          ))
        ) : loadingReplies ? (
          <p className="text-xs text-gray-400 ml-10">Loading replies...</p>
        ) : (
          <p className="text-xs text-gray-400 ml-10">No replies yet.</p>
        )}
      </div>
    )}


    </div>
  );
}
