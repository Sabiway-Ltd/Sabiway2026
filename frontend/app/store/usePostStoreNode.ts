"use client";

import { create } from "zustand";
import { io, Socket } from "socket.io-client";

export interface Post {
  id: number;
  content: string;
  image: string | null;
  createdAt: string;
}

interface PostState {
  posts: Post[];
  loading: boolean;
  error: string | null;
  socket?: Socket;
  initSocket: () => void;
  fetchPosts: () => Promise<void>;
  createPost: (content: string, image?: File) => Promise<void>;
  updatePost: (id: number, content: string, image?: File | null) => Promise<void>;
  deletePost: (id: number) => Promise<void>;
}

const EXPRESS_URL = "http://localhost:4000";

export const usePostStoreNode = create<PostState>((set, get) => ({
  posts: [],
  loading: false,
  error: null,
  socket: undefined,

  // Initialize Socket.IO
  initSocket: () => {
    if (get().socket) return; // already initialized

    const socket = io(EXPRESS_URL);

    socket.on("connect", () => console.log("✅ Socket connected:", socket.id));
    socket.on("disconnect", () => console.log("❌ Socket disconnected"));

    // Real-time events
    socket.on("postCreated", (post: Post) => {
      set({ posts: [post, ...get().posts] });
    });

    socket.on("postUpdated", (post: Post) => {
      set({
        posts: get().posts.map((p) => (p.id === post.id ? post : p)),
      });
    });

    socket.on("postDeleted", (id: number) => {
      set({ posts: get().posts.filter((p) => p.id !== id) });
    });

    set({ socket });
  },

  fetchPosts: async () => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(`${EXPRESS_URL}/posts`);
      if (!res.ok) throw new Error("Failed to fetch posts");
      const data: Post[] = await res.json();
      set({ posts: data });
    } catch (err: any) {
      set({ error: err.message });
    } finally {
      set({ loading: false });
    }
  },

  createPost: async (content, image) => {
    set({ loading: true, error: null });
    try {
      const formData = new FormData();
      formData.append("content", content);
      if (image) formData.append("image", image);

      const res = await fetch(`${EXPRESS_URL}/posts`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Failed to create post");
      // No need to update state manually; socket will handle it
    } catch (err: any) {
      set({ error: err.message });
    } finally {
      set({ loading: false });
    }
  },

  updatePost: async (id, content, image) => {
    set({ loading: true, error: null });
    try {
      const formData = new FormData();
      formData.append("content", content);
      if (image !== undefined) {
        if (image === null) formData.append("image", ""); // remove image
        else formData.append("image", image);
      }

      const res = await fetch(`${EXPRESS_URL}/posts/${id}`, {
        method: "PUT",
        body: formData,
      });

      if (!res.ok) throw new Error("Failed to update post");
      // Socket will update state
    } catch (err: any) {
      set({ error: err.message });
    } finally {
      set({ loading: false });
    }
  },

  deletePost: async (id) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(`${EXPRESS_URL}/posts/${id}`, {
        method: "DELETE",
      });

      if (!res.ok && res.status !== 204) throw new Error("Failed to delete post");
      // Socket will remove post
    } catch (err: any) {
      set({ error: err.message });
    } finally {
      set({ loading: false });
    }
  },
}));
