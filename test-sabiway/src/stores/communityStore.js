import { create } from "zustand";
import { io } from "socket.io-client";
import { useAuthStore } from "./authStore";
import axios from "axios";

const API_URL = "http://localhost:5000/api"; // <-- Your API base URL

// ---------- Singleton Socket ----------
let socketInstance = null;
const listenersAttached = new Set();

const getSocket = (token) => {
  if (!socketInstance) {
    socketInstance = io("http://localhost:5000", { auth: { token } });
    socketInstance.on("connect", () =>
      console.log("Socket connected:", socketInstance.id)
    );
  }
  return socketInstance;
};

const attachListener = (event, handler) => {
  if (!listenersAttached.has(event) && socketInstance) {
    socketInstance.on(event, handler);
    listenersAttached.add(event);
  }
};

// ---------- Zustand Store ----------
export const useCommunityStore = create((set, get) => ({
  posts: [],
  loading: false,
  message: "",
  socket: null,

  // ---------- Init ----------
  init: async () => {
    const token = useAuthStore.getState().token;
    if (!token) return;

    // Connect singleton socket
    const socket = getSocket(token);
    set({ socket });

    // ---------- Post Events ----------
    attachListener("post:created", (post) =>
      set((state) => ({ posts: [post, ...state.posts] }))
    );

    attachListener("post:updated", (updated) =>
      set((state) => ({
        posts: state.posts.map((p) => (p.id === updated.id ? updated : p))
      }))
    );

    attachListener("post:deleted", ({ id }) =>
      set((state) => ({ posts: state.posts.filter((p) => p.id !== id) }))
    );

    attachListener("post:liked", ({ postId, result }) =>
      set((state) => ({
        posts: state.posts.map((p) =>
          p.id === postId ? { ...p, likes: result?.likes || p.likes } : p
        )
      }))
    );

    attachListener("post:unliked", ({ postId, result }) =>
      set((state) => ({
        posts: state.posts.map((p) =>
          p.id === postId ? { ...p, likes: result?.likes || p.likes } : p
        )
      }))
    );

    attachListener("post:bookmarked", ({ postId }) =>
      set((state) => ({
        posts: state.posts.map((p) =>
          p.id === postId ? { ...p, bookmarked: true } : p
        )
      }))
    );

    attachListener("post:unbookmarked", ({ postId }) =>
      set((state) => ({
        posts: state.posts.map((p) =>
          p.id === postId ? { ...p, bookmarked: false } : p
        )
      }))
    );

    // ---------- Comment Events ----------
    attachListener("comment:created", ({ postId, comment }) =>
      set((state) => ({
        posts: state.posts.map((p) =>
          p.id === postId
            ? { ...p, comments: [comment, ...(p.comments || [])] }
            : p
        )
      }))
    );

    attachListener("comment:liked", ({ commentId, data }) =>
      set((state) => ({
        posts: state.posts.map((p) => ({
          ...p,
          comments: p.comments?.map((c) =>
            c.id === commentId ? { ...c, likes: data?.likes || c.likes } : c
          )
        }))
      }))
    );

    attachListener("comment:unliked", ({ commentId, data }) =>
      set((state) => ({
        posts: state.posts.map((p) => ({
          ...p,
          comments: p.comments?.map((c) =>
            c.id === commentId ? { ...c, likes: data?.likes || c.likes } : c
          )
        }))
      }))
    );

    // ---------- Reply Events ----------
    attachListener("reply:liked", ({ replyId, data }) =>
      set((state) => ({
        posts: state.posts.map((p) => ({
          ...p,
          comments: p.comments?.map((c) => ({
            ...c,
            replies: c.replies?.map((r) =>
              r.id === replyId ? { ...r, likes: data?.likes || r.likes } : r
            )
          }))
        }))
      }))
    );

    attachListener("reply:unliked", ({ replyId, data }) =>
      set((state) => ({
        posts: state.posts.map((p) => ({
          ...p,
          comments: p.comments?.map((c) => ({
            ...c,
            replies: c.replies?.map((r) =>
              r.id === replyId ? { ...r, likes: data?.likes || r.likes } : r
            )
          }))
        }))
      }))
    );

    // ---------- Repost Events ----------
    attachListener("post:reposted", ({ postId, repost }) =>
      set((state) => ({
        posts: state.posts.map((p) =>
          p.id === postId
            ? { ...p, reposts: [...(p.reposts || []), repost] }
            : p
        )
      }))
    );

    attachListener("post:unreposted", ({ postId, repostId }) =>
      set((state) => ({
        posts: state.posts.map((p) =>
          p.id === postId
            ? { ...p, reposts: (p.reposts || []).filter((r) => r.id !== repostId) }
            : p
        )
      }))
    );

    // Fetch initial posts
    await get().fetchPosts();
  },

  // ---------- API Actions ----------
  fetchPosts: async () => {
    set({ loading: true });
    const token = useAuthStore.getState().token;
    if (!token) {
      set({ message: "Not logged in", loading: false });
      return;
    }

    try {
      const res = await axios.get(`${API_URL}/posts`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      set({ posts: res.data, loading: false });
    } catch (err) {
      set({
        message: err.response?.data?.error || "Failed to fetch posts",
        loading: false
      });
    }
  },

  // ---------- Post CRUD ----------
  createPost: async (content) => {
    const token = useAuthStore.getState().token;
    if (!token || !content.trim()) return;

    try {
      await axios.post(`${API_URL}/posts`, { content }, { headers: { Authorization: `Bearer ${token}` } });
      // ✅ Server emits "post:created", no state update here
    } catch (err) {
      set({ message: err.response?.data?.error || "Failed to create post" });
    }
  },

  updatePost: async (id, content) => {
    const token = useAuthStore.getState().token;
    if (!token || !content.trim()) return;

    try {
      await axios.put(`${API_URL}/posts/${id}`, { content }, { headers: { Authorization: `Bearer ${token}` } });
    } catch (err) {
      set({ message: err.response?.data?.error || "Failed to update post" });
    }
  },

  deletePost: async (id) => {
    const token = useAuthStore.getState().token;
    if (!token) return;

    try {
      await axios.delete(`${API_URL}/posts/${id}`, { headers: { Authorization: `Bearer ${token}` } });
    } catch (err) {
      set({ message: err.response?.data?.error || "Failed to delete post" });
    }
  },

  // ---------- Comment & Reply CRUD ----------
  createComment: async (postId, content) => {
    const token = useAuthStore.getState().token;
    if (!token || !content.trim()) return;

    try {
      await axios.post(`${API_URL}/posts/${postId}/comments`, { content }, { headers: { Authorization: `Bearer ${token}` } });
    } catch (err) {
      set({ message: err.response?.data?.error || "Failed to create comment" });
    }
  },

  createReply: async (postId, commentId, content) => {
    const token = useAuthStore.getState().token;
    if (!token || !content.trim()) return;

    try {
      await axios.post(`${API_URL}/posts/${postId}/comments/${commentId}/replies`, { content }, { headers: { Authorization: `Bearer ${token}` } });
    } catch (err) {
      set({ message: err.response?.data?.error || "Failed to create reply" });
    }
  },

updateReply: async (postId, commentId, replyId, content) => {
  const token = useAuthStore.getState().token;
  if (!token || !content.trim()) return;

  try {
    await axios.put(`${API_URL}/posts/${postId}/comments/${commentId}/replies/${replyId}`, { content }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    // ❌ Server emits "reply:updated" if implemented
  } catch (err) {
    set({ message: err.response?.data?.error || "Failed to update reply" });
  }
},

deleteReply: async (postId, commentId, replyId) => {
  const token = useAuthStore.getState().token;
  if (!token) return;

  try {
    await axios.delete(`${API_URL}/posts/${postId}/comments/${commentId}/replies/${replyId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    // ❌ Server emits "reply:deleted"
  } catch (err) {
    set({ message: err.response?.data?.error || "Failed to delete reply" });
  }
},


}));
