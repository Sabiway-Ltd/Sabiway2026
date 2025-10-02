"use client";

import { useState } from "react";
import Image from "next/image";
import { Heart, MessageCircle, BarChart2, Share, Bookmark } from "lucide-react";
import CommentThread from "./CommentThread";
import { FaWhatsapp } from "react-icons/fa";


interface Comment {
  id: number;
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
}

interface PostCardProps {
  author: {
    name: string;
    username: string;
    avatar: string;
  };
  content: string;
  image?: string;
  likes: number;
  comments: number;
  impressions: number;
  bookmark?: boolean; // initial state
  commentsData?: Comment[];
}

export default function PostCard({
  author,
  content,
  image,
  likes,
  comments,
  impressions,
  bookmark = false,
  commentsData = [],
}: PostCardProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(bookmark);
  const [expanded, setExpanded] = useState(false);

  // character limit before "Show more"
  const charLimit = 150;
  const shouldTruncate = content.length > charLimit;
  const displayedContent = expanded
    ? content
    : content.slice(0, charLimit) + (shouldTruncate ? "..." : "");

  return (
    <div className=" p-4 ">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Image
          src={author.avatar}
          alt={author.name}
          width={40}
          height={40}
          className="rounded-full"
        />
        <div>
          <p className="font-semibold">{author.name}</p>
          <p className="text-gray-500 text-sm">@{author.username}</p>
        </div>
      </div>

      {/* Content */}
      <div className="mt-3 text-gray-800">
        <p>
          {displayedContent}
          {shouldTruncate && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-blue-500 ml-2 hover:underline text-sm"
            >
              {expanded ? "Show less" : "Show more"}
            </button>
          )}
        </p>
      </div>

      {/* Post Image */}
      {image && (
        <div className="mt-3 rounded-xl overflow-hidden">
          <Image
            src={image}
            alt="Post image"
            width={600}
            height={400}
            className="object-cover w-full"
          />
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-between text-gray-800 mt-3 lg:w-[40%] md:w-[60%]">
        {/* Like */}
        <button
          className="flex items-center gap-1"
          onClick={() => setIsLiked(!isLiked)}
        >
          <Heart
            className={`h-5 w-5 ${isLiked ? "fill-red-500 text-red-500" : ""}`}
          />
          <span>{likes + (isLiked ? 1 : 0)}</span>
        </button>

        {/* Comments */}
        <button className="flex items-center gap-1">
          <MessageCircle className="h-5 w-5" />
          <span>{comments}</span>
        </button>

        {/* Impressions */}
        <button className="flex items-center gap-1">
          <BarChart2 className="h-5 w-5" />
          <span>{impressions}</span>
        </button>

        {/* WhatsApp */}
        <button
          className="flex items-center gap-1">
            <FaWhatsapp size={20}  />
          </button>

        {/* Bookmark */}
        <button
          className="flex items-center gap-1"
          onClick={() => setIsBookmarked(!isBookmarked)}
        >
          <Bookmark
            className={`h-5 w-5 ${
              isBookmarked ? "fill-blue-500 text-blue-500" : "text-gray-500"
            }`}
          />
        </button>

        {/* Share */}
        <button className="flex items-center gap-1">
          <Share className="h-5 w-5" />
        </button>
      </div>

      {/* Comment Box */}
      <div className="mt-3 border rounded-full px-4 py-2 bg-white flex w-full justify-between">
        <input
          type="text"
          placeholder="Leave a comment"
          className="w-[85%] text-sm  "
        />
        <button>
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path fill-rule="evenodd" clip-rule="evenodd" d="M0.110839 4.56323C-0.203328 1.74298 2.7003 -0.328105 5.26559 0.887478L19.6979 7.72423C22.4626 9.03285 22.4626 12.9672 19.6979 14.2758L5.26559 21.1138C2.7003 22.3294 -0.202119 20.2583 0.110839 17.438L0.690839 12.2084H10.5001C10.8206 12.2084 11.1279 12.081 11.3545 11.8544C11.5811 11.6278 11.7084 11.3205 11.7084 11C11.7084 10.6795 11.5811 10.3722 11.3545 10.1456C11.1279 9.91899 10.8206 9.79169 10.5001 9.79169H0.692047L0.110839 4.56323Z" fill="black"/>
            </svg>
        </button>
      </div>

      {/* Render Comments */}
      {commentsData.length > 0 && (
        <div className="mt-4 space-y-4">
          {commentsData.map((c) => (
            <CommentThread key={c.id} {...c} />
          ))}
        </div>
      )}
    </div>
  );
}
