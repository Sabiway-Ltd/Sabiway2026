"use client";

import { useState } from "react";
import Image from "next/image";
import { ImageIcon, Smile, Hash, X } from "lucide-react";
import { usePostStore } from "@/app/store/usePostStore";
import toast from "react-hot-toast";

interface PostBoxProps {
  visible: boolean;
  onClose: () => void;
}

export default function PostBox({ visible, onClose }: PostBoxProps) {
  const [content, setContent] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { createPost, getAllPosts } = usePostStore();

  if (!visible) return null;

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
      await createPost(formData);
      await getAllPosts(); // refresh feed
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
    <div className="w-full mt-4 px-3">
      <div className="bg-white rounded-xl shadow-md w-full p-4 relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
        >
          <X className="h-5 w-5" />
        </button>

        {/* User Avatar + textarea */}
        <div className="flex gap-3">
          <Image
            src="https://i.pravatar.cc/150?img=8"
            alt="User Avatar"
            width={40}
            height={40}
            className="w-10 h-10 rounded-full object-cover"
          />

          <textarea
            placeholder="What's on your mind?"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="flex-1 resize-none border-0 outline-none p-2 text-sm bg-transparent"
            rows={4}
          />
        </div>

        {/* Image Preview */}
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

        {/* Actions */}
        <div className="flex justify-end items-center mt-3">
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
            <button>
              <Smile className="h-5 w-5" />
            </button>
            <button>
              <Hash className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Post Button (separated for layout consistency with old version) */}
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
