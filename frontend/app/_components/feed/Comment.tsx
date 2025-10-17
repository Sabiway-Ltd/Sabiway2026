// app/_components/feed/Comment.tsx
'use client';

import { useState } from "react";

export interface IComment {
  id: string | number;
  author: {
    name: string;
    avatar: string;
  };
  content: string;
  replies?: IComment[];
  // new: optional image to display
  image?: string | null;
  onSubmit?: (content: string, imageFile?: File | null) => Promise<void> | void;
}

export default function Comment({
  id,
  author,
  content,
  replies = [],
  image = null,
  onSubmit,
}: IComment) {
  const [showReplies, setShowReplies] = useState(true);

  // --- new local state for composing a new comment (if this component is used for composing) ---
  const [draft, setDraft] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    setPreview(f ? URL.createObjectURL(f) : null);
  };

  const removeFile = () => {
    setFile(null);
    setPreview(null);
  };

  const submit = async () => {
    if (!draft.trim() && !file) return;
    setSubmitting(true);
    try {
      if (onSubmit) await onSubmit(draft, file);
      setDraft("");
      removeFile();
    } catch (err) {
      console.error("Comment submit error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mt-2 pl-4 border-l border-gray-200">
      {/* Single Comment */}
      <div className="flex items-start gap-3">
        <img
          src={author.avatar}
          alt={author.name}
          className="w-8 h-8 rounded-full object-cover"
        />
        <div className="flex-1">
          <p className="font-semibold text-sm">{author.name}</p>
          <p className="text-sm text-gray-700">{content}</p>

          {/* Display comment image if present */}
          {image && (
            <div className="mt-2">
              <img src={image} alt="comment image" className="max-h-48 rounded-md object-cover" />
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

      {/* Compose new comment UI (optional) */}
      {onSubmit && (
        <div className="mt-2">
          <textarea
            placeholder="Write a comment..."
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className="w-full border rounded-lg p-2 text-sm"
            rows={2}
          />

          <div className="flex items-center gap-2 mt-2">
            <label className="cursor-pointer text-sm text-gray-600">
              <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
              Attach image
            </label>

            {preview && (
              <div className="relative">
                <img src={preview} alt="preview" className="w-20 h-20 object-cover rounded-md" />
                <button
                  onClick={removeFile}
                  className="absolute -top-2 -right-2 bg-white rounded-full p-1 text-xs border"
                  type="button"
                >
                  ×
                </button>
              </div>
            )}

            <button
              onClick={submit}
              disabled={submitting || (!draft.trim() && !file)}
              className="ml-auto bg-blue-500 text-white px-3 py-1 rounded"
            >
              {submitting ? "Sending..." : "Send"}
            </button>
          </div>
        </div>
      )}

      {/* Nested Replies */}
      {showReplies && replies.length > 0 && (
        <div className="mt-2 space-y-2">
          {replies.map((reply) => (
            <Comment key={reply.id} {...reply} />
          ))}
        </div>
      )}
    </div>
  );
}
