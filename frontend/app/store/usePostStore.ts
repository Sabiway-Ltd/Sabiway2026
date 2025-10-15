import { create } from "zustand";
import { io, Socket } from "socket.io-client";
import axios from "axios";

const API_URL = "http://localhost:5000/api"; // <-- Update if needed

// ---------- Types ----------
interface Comment {
  id: string;
  content: string;
  likes: number;
  replies?: Reply[];
}

interface Reply {
  id: string;
  content: string;
  likes: number;
}

interface Post {
  id: string;
  content: string;
  likes: number;
  bookmarked?: boolean;
  comments?: Comment[];
  reposts?: any[];
}

interface CommunityState {
  posts: Post[];
  loading: boolean;
  message: string;
  socket: Socket | null;
  init: () => Promise<void>;
  fetchPosts: () => Promise<void>;
  createPost: (content: string) => Promise<void>;
  updatePost: (id: string, content: string) => Promise<void>;
  deletePost: (id: string) => Promise<void>;
  createComment: (postId: string, content: string) => Promise<void>;
  createReply: (postId: string, commentId: string, content: string) => Promise<void>;
  updateReply: (postId: string, commentId: string, replyId: string, content: string) => Promise<void>;
  deleteReply: (postId: string, commentId: string, replyId: string) => Promise<void>;
}

// ---------- Singleton Socket ----------
let socketInstance: Socket | null = null;
const listenersAttached = new Set<string>();

const getSocket = (token: string) => {
  if (!socketInstance) {
    socketInstance = io("http://localhost:5000", { auth: { token } });
    socketInstance.on("connect", () => console.log("Socket connected:", socketInstance?.id));
  }
  return socketInstance;
};

const attachListener = (event: string, handler: (...args: any) => void) => {
  if (!listenersAttached.has(event) && socketInstance) {
    socketInstance.on(event, handler);
    listenersAttached.add(event);
  }
};

// ---------- Zustand Store ----------
export const useCommunityStore = create<CommunityState>((set, get) => ({
  posts: [],
  loading: false,
  message: "",
  socket: null,

  init: async () => {
    const token = localStorage.getItem("access");
    if (!token) return;

    const socket = getSocket(token);
    set({ socket });

    // ---------- Post Events ----------
    attachListener("post:created", (post: Post) =>
      set((state) => ({ posts: [post, ...state.posts] }))
    );

    attachListener("post:updated", (updated: Post) =>
      set((state) => ({
        posts: state.posts.map((p) => (p.id === updated.id ? updated : p))
      }))
    );

    attachListener("post:deleted", ({ id }: { id: string }) =>
      set((state) => ({ posts: state.posts.filter((p) => p.id !== id) }))
    );

    attachListener("post:liked", ({ postId, result }: any) =>
      set((state) => ({
        posts: state.posts.map((p) =>
          p.id === postId ? { ...p, likes: result?.likes ?? p.likes } : p
        )
      }))
    );

    attachListener("post:unliked", ({ postId, result }: any) =>
      set((state) => ({
        posts: state.posts.map((p) =>
          p.id === postId ? { ...p, likes: result?.likes ?? p.likes } : p
        )
      }))
    );

    attachListener("post:bookmarked", ({ postId }: { postId: string }) =>
      set((state) => ({
        posts: state.posts.map((p) =>
          p.id === postId ? { ...p, bookmarked: true } : p
        )
      }))
    );

    attachListener("post:unbookmarked", ({ postId }: { postId: string }) =>
      set((state) => ({
        posts: state.posts.map((p) =>
          p.id === postId ? { ...p, bookmarked: false } : p
        )
      }))
    );

    // ---------- Comment Events ----------
    attachListener("comment:created", ({ postId, comment }: any) =>
      set((state) => ({
        posts: state.posts.map((p) =>
          p.id === postId
            ? { ...p, comments: [comment, ...(p.comments || [])] }
            : p
        )
      }))
    );

    attachListener("comment:liked", ({ commentId, data }: any) =>
      set((state) => ({
        posts: state.posts.map((p) => ({
          ...p,
          comments: p.comments?.map((c) =>
            c.id === commentId ? { ...c, likes: data?.likes ?? c.likes } : c
          )
        }))
      }))
    );

    attachListener("comment:unliked", ({ commentId, data }: any) =>
      set((state) => ({
        posts: state.posts.map((p) => ({
          ...p,
          comments: p.comments?.map((c) =>
            c.id === commentId ? { ...c, likes: data?.likes ?? c.likes } : c
          )
        }))
      }))
    );

    // ---------- Reply Events ----------
    attachListener("reply:liked", ({ replyId, data }: any) =>
      set((state) => ({
        posts: state.posts.map((p) => ({
          ...p,
          comments: p.comments?.map((c) => ({
            ...c,
            replies: c.replies?.map((r) =>
              r.id === replyId ? { ...r, likes: data?.likes ?? r.likes } : r
            )
          }))
        }))
      }))
    );

    attachListener("reply:unliked", ({ replyId, data }: any) =>
      set((state) => ({
        posts: state.posts.map((p) => ({
          ...p,
          comments: p.comments?.map((c) => ({
            ...c,
            replies: c.replies?.map((r) =>
              r.id === replyId ? { ...r, likes: data?.likes ?? r.likes } : r
            )
          }))
        }))
      }))
    );

    // ---------- Repost Events ----------
    attachListener("post:reposted", ({ postId, repost }: any) =>
      set((state) => ({
        posts: state.posts.map((p) =>
          p.id === postId
            ? { ...p, reposts: [...(p.reposts || []), repost] }
            : p
        )
      }))
    );

    attachListener("post:unreposted", ({ postId, repostId }: any) =>
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

  fetchPosts: async () => {
    set({ loading: true });
    const token = localStorage.getItem("access");
    if (!token) {
      set({ message: "Not logged in", loading: false });
      return;
    }

    try {
      const res = await axios.get<Post[]>(`${API_URL}/posts`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      set({ posts: res.data, loading: false });
    } catch (err: any) {
      set({
        message: err.response?.data?.error ?? "Failed to fetch posts",
        loading: false
      });
    }
  },

  createPost: async (content) => {
    const token = localStorage.getItem("access");
    if (!token || !content.trim()) return;

    try {
      await axios.post(`${API_URL}/posts`, { content }, { headers: { Authorization: `Bearer ${token}` } });
    } catch (err: any) {
      set({ message: err.response?.data?.error ?? "Failed to create post" });
    }
  },

  updatePost: async (id, content) => {
    const token = localStorage.getItem("access");
    if (!token || !content.trim()) return;

    try {
      await axios.put(`${API_URL}/posts/${id}`, { content }, { headers: { Authorization: `Bearer ${token}` } });
    } catch (err: any) {
      set({ message: err.response?.data?.error ?? "Failed to update post" });
    }
  },

  deletePost: async (id) => {
    const token = localStorage.getItem("access");
    if (!token) return;

    try {
      await axios.delete(`${API_URL}/posts/${id}`, { headers: { Authorization: `Bearer ${token}` } });
    } catch (err: any) {
      set({ message: err.response?.data?.error ?? "Failed to delete post" });
    }
  },

  createComment: async (postId, content) => {
    const token = localStorage.getItem("access");
    if (!token || !content.trim()) return;

    try {
      await axios.post(`${API_URL}/posts/${postId}/comments`, { content }, { headers: { Authorization: `Bearer ${token}` } });
    } catch (err: any) {
      set({ message: err.response?.data?.error ?? "Failed to create comment" });
    }
  },

  createReply: async (postId, commentId, content) => {
    const token = localStorage.getItem("access");
    if (!token || !content.trim()) return;

    try {
      await axios.post(`${API_URL}/posts/${postId}/comments/${commentId}/replies`, { content }, { headers: { Authorization: `Bearer ${token}` } });
    } catch (err: any) {
      set({ message: err.response?.data?.error ?? "Failed to create reply" });
    }
  },

  updateReply: async (postId, commentId, replyId, content) => {
    const token = localStorage.getItem("access");
    if (!token || !content.trim()) return;

    try {
      await axios.put(`${API_URL}/posts/${postId}/comments/${commentId}/replies/${replyId}`, { content }, { headers: { Authorization: `Bearer ${token}` } });
    } catch (err: any) {
      set({ message: err.response?.data?.error ?? "Failed to update reply" });
    }
  },

  deleteReply: async (postId, commentId, replyId) => {
    const token = localStorage.getItem("access");
    if (!token) return;

    try {
      await axios.delete(`${API_URL}/posts/${postId}/comments/${commentId}/replies/${replyId}`, { headers: { Authorization: `Bearer ${token}` } });
    } catch (err: any) {
      set({ message: err.response?.data?.error ?? "Failed to delete reply" });
    }
  }
}));
