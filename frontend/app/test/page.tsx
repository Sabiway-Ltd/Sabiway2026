"use client";

import { useEffect, useState } from "react";
import { usePostStoreNode } from "../store/usePostStoreNode";

export default function PostManager() {
  const { posts, fetchPosts, loading, error, createPost, deletePost, initSocket } =
    usePostStoreNode();

  const [newContent, setNewContent] = useState("");
  const [newImage, setNewImage] = useState<File | null>(null);

  useEffect(() => {
    initSocket(); // start real-time updates
    fetchPosts();
  }, []);

  const handleCreatePost = async () => {
    if (!newContent.trim() && !newImage) return alert("Post content or image required");
    await createPost(newContent, newImage || undefined);
    setNewContent("");
    setNewImage(null);
  };

  return (
    <div style={{ maxWidth: 600, margin: "0 auto" }}>
      <h2>Create a Post</h2>
      <textarea
        value={newContent}
        onChange={(e) => setNewContent(e.target.value)}
        placeholder="Write something..."
        rows={4}
        style={{ width: "100%", marginBottom: 8 }}
      />
      <input
        type="file"
        accept="image/*"
        onChange={(e) => setNewImage(e.target.files?.[0] || null)}
        style={{ marginBottom: 8 }}
      />
      <button onClick={handleCreatePost} disabled={loading}>
        {loading ? "Posting..." : "Post"}
      </button>

      {error && <p style={{ color: "red" }}>{error}</p>}

      <h2 style={{ marginTop: 32 }}>Posts</h2>
      {loading && <p>Loading posts...</p>}
      {posts.length === 0 && !loading && <p>No posts yet.</p>}

      {posts.map((post) => (
        <div key={post.id} style={{ border: "1px solid #ccc", padding: 12, marginBottom: 12 }}>
          <p>
            <strong>Post #{post.id}</strong> - {new Date(post.createdAt).toLocaleString()}
          </p>
          <p>{post.content}</p>
          {post.image && (
            <img
              src={post.image}
              alt="Post image"
              style={{ maxWidth: "100%", marginTop: 8 }}
            />
          )}
          <div style={{ marginTop: 8 }}>
            <button onClick={() => deletePost(post.id)} disabled={loading}>
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
