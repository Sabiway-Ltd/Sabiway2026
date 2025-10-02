// app/_components/feed/Comment.tsx
'use client'

import { useState } from "react";

type CommentProps = {
  id: number;
  author: {
    name: string;
    avatar: string;
  };
  content: string;
  replies?: CommentProps[];
};

export default function Comment({ author, content, replies = [] }: CommentProps) {
  const [showReplies, setShowReplies] = useState(true);

  return (
    <div className="mt-2 pl-4 border-l border-gray-200">
      {/* Single Comment */}
      <div className="flex items-start gap-3">
        <img
          src={author.avatar}
          alt={author.name}
          className="w-8 h-8 rounded-full"
        />
        <div>
          <p className="font-semibold text-sm">{author.name}</p>
          <p className="text-sm text-gray-700">{content}</p>

          {/* Toggle replies */}
          {replies.length > 0 && (
            <button
              onClick={() => setShowReplies(!showReplies)}
              className="text-xs text-blue-500 mt-1"
            >
              {showReplies ? "Hide replies" : `View ${replies.length} replies`}
            </button>
          )}
        </div>
      </div>

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
