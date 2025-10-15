// app/(posts)/page.tsx
"use client";

import { useEffect, useState } from "react";
import { usePostStore, Post, Comment, Reply } from "@/app/store/usePostStore";
import toast from "react-hot-toast";

export default function PostsPage() {
  const {
    posts,
    loading,
    fetchPosts,
    likePost,
    unlikePost,
    bookmarkPost,
    unbookmarkPost,
    repost,
    unrepost,
    fetchComments,
    commentsByPost,
    createComment,
    fetchReplies,
    repliesByPost,
    createReply,
    connectPostSocket,
    disconnectPostSocket,
  } = usePostStore();

  const [page, setPage] = useState(1);
  const [newComment, setNewComment] = useState<Record<string, string>>({});
  const [newReply, setNewReply] = useState<Record<string, string>>({});

  /* ------------------------------
     🔹 Load posts and connect socket
  ------------------------------- */
  useEffect(() => {
    fetchPosts(page);
    connectPostSocket();

    return () => {
      disconnectPostSocket();
    };
  }, []);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    fetchPosts(nextPage);
    setPage(nextPage);
  };

  const handleLikeToggle = (post: Post) => {
    post.liked_by_me ? unlikePost(post.id) : likePost(post.id);
  };

  const handleBookmarkToggle = (post: Post) => {
    post.bookmarked_by_me ? unbookmarkPost(post.id) : bookmarkPost(post.id);
  };

  const handleRepostToggle = (post: Post) => {
    if (post.reposted_by_me) {
      unrepost(post.id, "repostId-placeholder"); // Replace with real repostId if you track it
    } else {
      repost(post.id);
    }
  };

  const handleAddComment = async (postId: string) => {
    const content = newComment[postId];
    if (!content) return toast.error("Comment cannot be empty");
    await createComment(postId, content);
    setNewComment({ ...newComment, [postId]: "" });
    fetchComments(postId);
  };

  const handleAddReply = async (postId: string, commentId: string) => {
    const content = newReply[commentId];
    if (!content) return toast.error("Reply cannot be empty");
    await createReply(commentId, content);
    setNewReply({ ...newReply, [commentId]: "" });
    fetchReplies(postId);
  };

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Posts Feed</h1>

      {loading && <p>Loading posts...</p>}

      {!loading && posts.length === 0 && <p>No posts available.</p>}

      {posts.map((post) => (
        <div key={post.id} className="border rounded-lg p-4 mb-4 shadow-sm">
          {/* Post header */}
          <div className="flex items-center mb-2">
            <img
              src={post.author.profile_picture || "/default-avatar.png"}
              alt={post.author.username}
              className="w-10 h-10 rounded-full mr-2"
            />
            <span className="font-semibold">{post.author.full_name}</span>
          </div>

          {/* Post content */}
          <p className="mb-2">{post.content}</p>
          {post.image && <img src={post.image} className="rounded-lg mb-2" />}

          {/* Post actions */}
          <div className="flex items-center space-x-4 text-sm mb-2">
            <button onClick={() => handleLikeToggle(post)}>
              {post.liked_by_me ? "💖" : "🤍"} {post.likes_count}
            </button>
            <button onClick={() => handleBookmarkToggle(post)}>
              {post.bookmarked_by_me ? "🔖" : "📑"}
            </button>
            <button onClick={() => handleRepostToggle(post)}>
              🔁 {post.reposts_count || 0}
            </button>
            <span>💬 {post.comments_count}</span>
          </div>

          {/* Comments */}
          <div className="mt-2 ml-4">
            <h3 className="font-semibold">Comments</h3>
            <div className="mb-2">
              <input
                type="text"
                placeholder="Add a comment..."
                className="border rounded px-2 py-1 w-full"
                value={newComment[post.id] || ""}
                onChange={(e) =>
                  setNewComment({ ...newComment, [post.id]: e.target.value })
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAddComment(post.id);
                }}
              />
            </div>
            {commentsByPost[post.id]?.map((comment) => (
              <div key={comment.id} className="mb-2 ml-2 border-l pl-2">
                <p className="font-semibold">{comment.user.full_name}</p>
                <p>{comment.content}</p>
                <div className="flex items-center space-x-2 text-sm">
                  <span>Likes: {comment.likes_count}</span>
                  <button
                    onClick={() =>
                      toast("Like/unlike comment feature can be added here")
                    }
                  >
                    👍
                  </button>
                  <input
                    type="text"
                    placeholder="Reply..."
                    className="border rounded px-2 py-1"
                    value={newReply[comment.id] || ""}
                    onChange={(e) =>
                      setNewReply({ ...newReply, [comment.id]: e.target.value })
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleAddReply(post.id, comment.id);
                    }}
                  />
                </div>

                {/* Replies */}
                {repliesByPost[post.id]
                  ?.filter((r) => comment.id === r.comment)
                  .map((reply) => (
                    <div key={reply.id} className="ml-4 border-l pl-2 mt-1">
                      <p className="font-semibold">{reply.user.full_name}</p>
                      <p>{reply.content}</p>
                      <span className="text-sm">Likes: {reply.likes_count}</span>
                    </div>
                  ))}
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Load more */}
      <div className="text-center mt-4">
        <button
          onClick={handleLoadMore}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Load More
        </button>
      </div>
    </div>
  );
}
