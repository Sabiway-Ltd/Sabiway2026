"use client";

import { useEffect, useState } from "react";
import { Heart, MessageCircle, BarChart2, Share, Bookmark } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import CommentThread from "./CommentThread";

// Dummy profile picture
const DEFAULT_PROFILE_PICTURE =
  "https://via.placeholder.com/150?text=User";

// Dummy comments
const DUMMY_COMMENTS = [
  {
    id: "c1",
    author: {
      name: "Jane Doe",
      username: "janedoe",
      avatar: DEFAULT_PROFILE_PICTURE,
      whatsapp_number: "",
    },
    content: "This is such a great post!",
    likes: 3,
    is_liked: false,
    reply_count: 1,
    created_at: "2025-10-12T10:30:00",
  },
  {
    id: "c2",
    author: {
      name: "John Smith",
      username: "johnsmith",
      avatar: DEFAULT_PROFILE_PICTURE,
      whatsapp_number: "",
    },
    content: "I totally agree with this.",
    likes: 1,
    is_liked: true,
    reply_count: 0,
    created_at: "2025-10-12T11:00:00",
  },
];

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
    user_id: number;
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
  const [comments, setComments] = useState(DUMMY_COMMENTS);
  const [isFollowing, setIsFollowing] = useState(false);

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

  const handleToggleLike = () => {
    setIsLiked(!isLiked);
    setLikesCount(isLiked ? likesCount - 1 : likesCount + 1);
  };

  const handleToggleComments = () => {
    setShowComments(!showComments);
  };

  const handleCommentSubmit = () => {
    if (!comment.trim()) return;
    const newComment = {
      id: `c${comments.length + 1}`,
      author: {
        name: "You",
        username: "currentuser",
        avatar: DEFAULT_PROFILE_PICTURE,
        whatsapp_number: "",
      },
      content: comment,
      likes: 0,
      is_liked: false,
      reply_count: 0,
      created_at: new Date().toISOString(),
    };
    setComments([...comments, newComment]);
    setComment("");
    setCommentCount((prev) => prev + 1);
  };

  const handleBookmarkToggle = () => {
    setIsBookmarked(!isBookmarked);
  };

  const handleWhatsappClick = () => {
    if (author.whatsapp_number) {
      window.open(`https://wa.me/${author.whatsapp_number}`, "_blank");
    } else {
      alert("This user does not have a WhatsApp number.");
    }
  };

  const handleFollowToggle = () => {
    setIsFollowing(!isFollowing);
  };

  return (
    <div className="p-4 border-b">
      <div className="flex justify-between items-center gap-3">
        <div className="flex items-center gap-3">
          <img
            src={author.profile_picture || DEFAULT_PROFILE_PICTURE}
            alt={author.full_name}
            className="w-12 h-12 rounded-full object-cover border border-gray-200 shadow-sm"
          />
          <div>
            <p className="font-semibold">{author.full_name}</p>
            <p className="text-gray-500 text-sm">@{author.username}</p>
            <p className="text-[11px] text-gray-400">{formattedDate}</p>
          </div>
        </div>

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

      <div className="mt-3 text-gray-800 text-sm">{content}</div>

      {image && (
        <div className="mt-3 rounded-xl overflow-hidden">
          <img
            src={image}
            alt="Post image"
            className="object-cover w-full max-h-[450px] rounded-xl border border-gray-100"
          />
        </div>
      )}

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
          <span>{impressions_count}</span>
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
            className={`h-[1.35rem] w-[1.35rem] ${isBookmarked ? "fill-blue-500 text-blue-500" : "text-gray-500"}`}
          />
        </button>

        <button className="flex items-center gap-1">
          <Share className="h-5 w-5" />
        </button>
      </div>

      {showComments && (
        <>
          <div className="mt-3 border rounded-full px-4 py-2 bg-white flex w-full justify-between">
            <input
              type="text"
              placeholder="Leave a comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && comment.trim()) handleCommentSubmit();
              }}
              className="w-[85%] text-sm outline-none"
            />

            <button onClick={handleCommentSubmit} disabled={!comment.trim()} className="text-lg">
              ➤
            </button>
          </div>

          <div className="mt-4 space-y-4">
            {comments.length === 0 ? (
              <p className="text-sm text-gray-500 text-center">No comments yet.</p>
            ) : (
              comments.map((c) => (
                <CommentThread
                  key={c.id}
                  id={String(c.id)}
                  author={c.author}
                  content={c.content}
                  likes={c.likes}
                  is_liked={c.is_liked}
                  reply_count={c.reply_count}
                  created_at={c.created_at}
                  onReplySubmit={() => {}}
                  onLike={() => {}}
                  onUnlike={() => {}}
                />
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
