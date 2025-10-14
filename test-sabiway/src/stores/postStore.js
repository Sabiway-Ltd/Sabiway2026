import { create } from "zustand";
import { io } from "socket.io-client";
import { useAuthStore } from "./authStore";
import axios from "axios";

export const usePostStore = create((set, get) => ({
  posts: [],
  loading: false,
  message: "",
  socket: null,

  // --- Initialize store and Socket.IO ---
  init: async () => {
    const token = useAuthStore.getState().token;
    if (!token) return;

    // Connect Socket.IO
    const socket = io("http://localhost:5000", {
      auth: { token }
    });

    socket.on("connect", () => console.log("Connected to socket:", socket.id));

    // Listen for real-time post events
    socket.on("newPost", (post) => {
      set((state) => ({ posts: [post, ...state.posts] }));
    });

    socket.on("updatePost", (updated) => {
      set((state) => ({
        posts: state.posts.map((p) => (p.id === updated.id ? updated : p))
      }));
    });

    socket.on("deletePost", (id) => {
      set((state) => ({
        posts: state.posts.filter((p) => p.id !== id)
      }));
    });

    set({ socket });

    // Fetch initial posts
    await get().fetchPosts();
  },

  // --- API actions ---
  fetchPosts: async () => {
    set({ loading: true });
    const token = useAuthStore.getState().token;
    try {
      const res = await axios.get("/api/posts", { headers: { Authorization: `Bearer ${token}` } });
      set({ posts: res.data, loading: false });
    } catch (err) {
      set({ message: err.response?.data?.error || "Failed to fetch posts", loading: false });
    }
  },

  createPost: async (content) => {
    const token = useAuthStore.getState().token;
    try {
      const res = await axios.post("/api/posts", { content }, { headers: { Authorization: `Bearer ${token}` } });
      // Emit event to socket
      get().socket?.emit("createPost", res.data);
      // Local update
      set((state) => ({ posts: [res.data, ...state.posts] }));
    } catch (err) {
      set({ message: err.response?.data?.error || "Failed to create post" });
    }
  },

  updatePost: async (id, content) => {
    const token = useAuthStore.getState().token;
    try {
      const res = await axios.put(`/api/posts/${id}`, { content }, { headers: { Authorization: `Bearer ${token}` } });
      get().socket?.emit("editPost", res.data);
      set((state) => ({
        posts: state.posts.map((p) => (p.id === id ? res.data : p))
      }));
    } catch (err) {
      set({ message: err.response?.data?.error || "Failed to update post" });
    }
  },

  deletePost: async (id) => {
    const token = useAuthStore.getState().token;
    try {
      await axios.delete(`/api/posts/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      get().socket?.emit("removePost", id);
      set((state) => ({
        posts: state.posts.filter((p) => p.id !== id)
      }));
    } catch (err) {
      set({ message: err.response?.data?.error || "Failed to delete post" });
    }
  }
}));
