// app/_components/feed/PostBox.tsx

"use client";

import { useState, useRef } from "react";
import dynamic from "next/dynamic"; // ✅ for emoji picker
import { ImageIcon, Smile, Hash, X } from "lucide-react";
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

  // 🔹 Dummy logged-in profile
  const profile = {
    full_name: "Static User",
    profile_picture: "https://i.pravatar.cc/100?img=5",
  };

  if (!visible) return null;

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

    // Simulate API call delay
    setTimeout(() => {
      console.log("New Post Created (Static Mode):", { content, image });
      setContent("");
      setImage(null);
      setPreview(null);
      onClose();
      setSubmitting(false);
      alert("✅ Post created (static mode)!");
    }, 1000);
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
            src={profile.profile_picture}
            alt={profile.full_name}
            className="w-10 h-10 rounded-full object-cover"
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
