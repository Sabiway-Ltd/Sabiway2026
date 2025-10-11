"use client";

import { useState, useRef } from "react";
import dynamic from "next/dynamic"; // ✅ needed for client-only emoji picker
import { ImageIcon, Smile, Hash, X } from "lucide-react";
import { usePostStore } from "@/app/store/usePostStore";
import { useProfileStore } from "@/app/store/useProfileStore";
import { CLOUDINARY_CLOUD_NAME, DEFAULT_PROFILE_PICTURE } from "@/app/helper";
import toast from "react-hot-toast";
import { EmojiClickData } from "emoji-picker-react";


// ✅ Dynamically import EmojiPicker (prevents SSR issues)
const EmojiPicker = dynamic(() => import("emoji-picker-react"), { ssr: false });

interface PostBoxProps {
  visible: boolean;
  onClose: () => void;
}

export default function PostBox({ visible, onClose }: PostBoxProps) {
  const [content, setContent] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { createPost, getAllPosts, getTrendingHashtags } = usePostStore();
  const { profile, getTopContributors } = useProfileStore();

  if (!visible) return null;

  const getCloudinaryImage = (path: string | null) => {
    if (!path) return DEFAULT_PROFILE_PICTURE;
    if (path.startsWith("http")) return path;
    return `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/${path}`;
  };

  const insertAtCursor = (text: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newValue = content.slice(0, start) + text + content.slice(end);
    setContent(newValue);

    requestAnimationFrame(() => {
      textarea.selectionStart = textarea.selectionEnd = start + text.length;
      textarea.focus();
    });
  };

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    insertAtCursor(emojiData.emoji);
    setShowEmojiPicker(false);
  };


  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async () => {
    if (!content.trim() && !image) return;

    setSubmitting(true);
    const formData = new FormData();
    formData.append("content", content);
    if (image) formData.append("image", image);

    try {
      await createPost(formData);   // ✅ Create post
      await getAllPosts();          // ✅ Refresh feed
      getTrendingHashtags?.();      // ✅ Refresh trending hashtags
      getTopContributors?.();       // ✅ Refresh top contributors

      setContent("");
      setImage(null);
      setPreview(null);
      onClose();
      toast.success("Post created successfully!");
    } catch (err) {
      console.error("Error creating post:", err);
      toast.error("Failed to create post. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full mt-4 px-3 relative">
      <div className="bg-white rounded-xl shadow-md w-full p-4 relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex gap-3">
          <img
            src={getCloudinaryImage(profile?.profile_picture ?? DEFAULT_PROFILE_PICTURE)}
            alt={profile?.full_name || "User Avatar"}
            className="w-10 h-10 rounded-full object-cover"
            onError={(e) => (e.currentTarget.src = DEFAULT_PROFILE_PICTURE)}
          />

          <textarea
            ref={textareaRef}
            placeholder="What's on your mind?"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="flex-1 resize-none border-0 outline-none p-2 text-sm bg-transparent"
            rows={4}
          />
        </div>

        {preview && (
          <div className="mt-3 relative">
            <img
              src={preview}
              alt="Preview"
              className="w-full rounded-lg object-cover"
            />
            <button
              onClick={() => {
                setImage(null);
                setPreview(null);
              }}
              className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        <div className="flex justify-end items-center mt-3 relative">
          <div className="flex space-x-4 text-black">
            <label className="cursor-pointer">
              <ImageIcon className="h-5 w-5" />
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </label>

            <div className="relative">
              <button
                type="button"
                onClick={() => setShowEmojiPicker((prev) => !prev)}
                className="hover:text-[#008753] transition"
              >
                <Smile className="h-5 w-5" />
              </button>

              {showEmojiPicker && (
                <div className="absolute bottom-8 right-0 z-50">
                  <EmojiPicker onEmojiClick={handleEmojiClick} />
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => insertAtCursor(" #")}
              className="hover:text-[#008753] transition"
            >
              <Hash className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSubmit}
          disabled={submitting || (!content.trim() && !image)}
          className={`bg-[#008753] text-white text-sm font-medium px-8 py-2 mt-3 rounded-md ${
            submitting || (!content.trim() && !image)
              ? "opacity-50 cursor-not-allowed"
              : "hover:bg-[#007347]"
          }`}
        >
          {submitting ? "Posting..." : "Post"}
        </button>
      </div>
    </div>
  );
}
