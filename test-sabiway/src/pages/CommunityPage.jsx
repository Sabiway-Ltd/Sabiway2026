import React, { useEffect, useState } from "react";
import { useCommunityStore } from "../stores/communityStore";

const CommunityPage = () => {
  const {
    posts,
    init,
    loading,
    message,
    createPost,
    updatePost,
    deletePost,
    createComment,
    updateComment,
    deleteComment,
    createReply,
    updateReply,
    deleteReply
  } = useCommunityStore();

  const [newPost, setNewPost] = useState("");
  const [editingPost, setEditingPost] = useState({ id: null, content: "" });
  const [commentInputs, setCommentInputs] = useState({});
  const [replyInputs, setReplyInputs] = useState({});
  const [editingComment, setEditingComment] = useState({});
  const [editingReply, setEditingReply] = useState({});

  // --- Initialize store + Socket.IO ---
  useEffect(() => {
    init();
  }, []);

  // --- Handlers ---
  const handlePost = () => {
    if (!newPost.trim()) return;
    createPost(newPost);
    setNewPost("");
  };

  const handleCommentInput = (postId, value) => {
    setCommentInputs({ ...commentInputs, [postId]: value });
  };

  const handleReplyInput = (commentId, value) => {
    setReplyInputs({ ...replyInputs, [commentId]: value });
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Community</h2>

      {loading && <p>Loading posts...</p>}
      {message && <p style={{ color: "red" }}>{message}</p>}

      {/* --- Create Post --- */}
      <div style={{ marginBottom: "20px" }}>
        <textarea
          value={newPost}
          onChange={(e) => setNewPost(e.target.value)}
          placeholder="What's on your mind?"
          style={{ width: "100%", minHeight: "60px" }}
        />
        <button onClick={handlePost} style={{ marginTop: "5px" }}>
          Post
        </button>
      </div>

      {/* --- Posts List --- */}
      {posts.length === 0 && !loading && <p>No posts yet.</p>}

      {posts.map((post) => (
  <div
    key={`post-${post.id}`}
    style={{ border: "1px solid #ccc", padding: "10px", marginBottom: "15px" }}
  >
    {/* --- Post content --- */}
    {editingPost.id === post.id ? (
      <>
        <textarea
          value={editingPost.content}
          onChange={(e) => setEditingPost({ ...editingPost, content: e.target.value })}
          style={{ width: "100%" }}
        />
        <button
          onClick={() => {
            updatePost(post.id, editingPost.content);
            setEditingPost({ id: null, content: "" });
          }}
        >
          Save
        </button>
        <button onClick={() => setEditingPost({ id: null, content: "" })}>
          Cancel
        </button>
      </>
    ) : (
      <>
        <p>{post.content}</p>
        <button onClick={() => setEditingPost({ id: post.id, content: post.content })}>
          Edit
        </button>
        <button onClick={() => deletePost(post.id)}>Delete</button>
      </>
    )}

    {/* --- Comments --- */}
    <div style={{ marginLeft: "20px", marginTop: "10px" }}>
      <h4>Comments:</h4>
      {post.comments?.map((comment) => (
        <div
          key={`comment-${comment.id}`}
          style={{ marginBottom: "5px", borderTop: "1px dashed #ccc", paddingTop: "5px" }}
        >
          {/* Comment content */}
          {editingComment[comment.id] ? (
            <>
              <textarea
                value={editingComment[comment.id]}
                onChange={(e) =>
                  setEditingComment({ ...editingComment, [comment.id]: e.target.value })
                }
                style={{ width: "100%" }}
              />
              <button
                onClick={() => {
                  updateComment(post.id, comment.id, editingComment[comment.id]);
                  setEditingComment({ ...editingComment, [comment.id]: null });
                }}
              >
                Save
              </button>
              <button
                onClick={() => setEditingComment({ ...editingComment, [comment.id]: null })}
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              <p>{comment.content}</p>
              <button
                onClick={() =>
                  setEditingComment({ ...editingComment, [comment.id]: comment.content })
                }
              >
                Edit
              </button>
              <button onClick={() => deleteComment(post.id, comment.id)}>Delete</button>
            </>
          )}

          {/* --- Replies --- */}
          <div style={{ marginLeft: "20px", marginTop: "5px" }}>
            {comment.replies?.map((reply) => (
              <div key={`reply-${reply.id}`} style={{ marginBottom: "3px" }}>
                {editingReply[reply.id] ? (
                  <>
                    <textarea
                      value={editingReply[reply.id]}
                      onChange={(e) =>
                        setEditingReply({ ...editingReply, [reply.id]: e.target.value })
                      }
                      style={{ width: "100%" }}
                    />
                    <button
                      onClick={() => {
                        updateReply(post.id, comment.id, reply.id, editingReply[reply.id]);
                        setEditingReply({ ...editingReply, [reply.id]: null });
                      }}
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingReply({ ...editingReply, [reply.id]: null })}
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <p>{reply.content}</p>
                    <button
                      onClick={() =>
                        setEditingReply({ ...editingReply, [reply.id]: reply.content })
                      }
                    >
                      Edit
                    </button>
                    <button onClick={() => deleteReply(post.id, comment.id, reply.id)}>
                      Delete
                    </button>
                  </>
                )}
              </div>
            ))}

            {/* --- Add Reply --- */}
            <div>
              <input
                type="text"
                value={replyInputs[comment.id] || ""}
                onChange={(e) => handleReplyInput(comment.id, e.target.value)}
                placeholder="Reply..."
              />
              <button
                onClick={() => {
                  if (!replyInputs[comment.id]?.trim()) return;
                  createReply(post.id, comment.id, replyInputs[comment.id]);
                  setReplyInputs({ ...replyInputs, [comment.id]: "" });
                }}
              >
                Reply
              </button>
            </div>
          </div>
        </div>
      ))}

      {/* --- Add Comment --- */}
      <div style={{ marginTop: "5px" }}>
        <input
          type="text"
          value={commentInputs[post.id] || ""}
          onChange={(e) => handleCommentInput(post.id, e.target.value)}
          placeholder="Add a comment..."
        />
        <button
          onClick={() => {
            if (!commentInputs[post.id]?.trim()) return;
            createComment(post.id, commentInputs[post.id]);
            setCommentInputs({ ...commentInputs, [post.id]: "" });
          }}
        >
          Comment
        </button>
      </div>
    </div>
  </div>
))}

    </div>
  );
};

export default CommunityPage;
