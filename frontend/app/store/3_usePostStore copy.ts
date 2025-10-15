"use client";

import { create } from "zustand";
import { post } from "../services/post";
import { io } from "socket.io-client";
import toast from "react-hot-toast";

const SOCKET_URL = "http://localhost:5000"; // Adjust if needed
let socket: any = null;

// 🧑‍💻 Types (keep the same)
type Author = {
  user_id: number;
  username: string;
  full_name: string;
  profile_picture?: string | null;
  whatsapp_number: string;
  is_following?: boolean;
};

type Hashtag = {
  tag: string;
  use_count: number;
};

type Post = {
  id: string;
  author: Author;
  content: string;
  image: string | null;
  hashtags: Hashtag[];
  likes_count: number;
  comments_count: number;
  impressions_count: number;
  reposts_count: number;
  is_liked?: boolean;
  created_at: string;
  is_bookmarked?: boolean;
  updated_at?: string;
};

type Comment = {
  id: string;
  user: Author;
  post: string;
  content: string;
  likes_count: number;
  created_at: string;
  is_liked?: boolean;
  reply_count?: number;
};

type Reply = {
  id: string;
  user: Author;
  comment: string;
  content: string;
  likes_count: number;
  created_at: string;
  is_liked?: boolean; 
};

type PostState = {
  posts: Post[];
  currentPost: Post | null;
  commentsByPost: Record<string, Comment[]>;
  replies: Reply[];
  repliesByComment: Record<string, Reply[]>;
  loading: boolean;
  loadingHashtag: boolean;
  error: string | null;
  trendingHashtags: Hashtag[];
  getTrendingHashtags: () => Promise<void>;
  filteredPosts: Post[];
  activeHashtag: string | null;
  filterPostsByHashtag: (tag: string) => Promise<void>;
  resetFilteredPosts: () => void;

  set: (partial: Partial<PostState>) => void;

  // Actions (same names)
  getAllPosts: (page?: number) => Promise<void>;
  getPostById: (id: string) => Promise<Post | null>;
  createPost: (data: FormData | object) => Promise<void>;
  likePost: (id: string) => Promise<void>;
  unlikePost: (id: string) => Promise<void>;
  bookmarkPost: (id: string) => Promise<void>;
  unbookmarkPost: (id: string) => Promise<void>;
  addComment: (postId: string, content: string) => Promise<void>;
  getComments: (postId: string) => Promise<void>;
  addReply: (commentId: string, content: string) => Promise<void>;
  getReplies: (postId: string) => Promise<void>;
  getRepliesByComment: (commentId: string) => Promise<void>;
  repostPost: (id: string, message?: string) => Promise<void>;
  likeComment: (commentId: string) => Promise<void>;
  unlikeComment: (commentId: string) => Promise<void>;
  likeReply: (replyId: string) => Promise<void>;
  unlikeReply: (replyId: string) => Promise<void>;
};

export const usePostStore = create<PostState>((set, get) => ({
  posts: [],
  currentPost: null,
  commentsByPost: {},
  replies: [],
  repliesByComment: {},
  loading: false,
  loadingHashtag: false,
  error: null,
  trendingHashtags: [],
  filteredPosts: [],
  activeHashtag: null,

  set: (partial) => set((state) => ({ ...state, ...partial })),

  // ⚡ Socket connection
  connectSocket: (user: any) => {
    if (!socket) {
      socket = io(SOCKET_URL, { transports: ["websocket"], withCredentials: true });
      socket.on("connect", () => console.log("✅ Socket connected", socket.id));

      // Post events
      socket.on("post:created", (p: Post) =>
        set((state) => ({ posts: [p, ...state.posts] }))
      );
      socket.on("post:updated", (p: Post) =>
        set((state) => ({
          posts: state.posts.map((post) => (post.id === p.id ? p : post)),
        }))
      );
      socket.on("post:deleted", ({ id }: { id: string }) =>
        set((state) => ({
          posts: state.posts.filter((p) => p.id !== id),
        }))
      );
      socket.on("post:liked", ({ postId, result }: any) =>
        set((state) => ({
          posts: state.posts.map((p) =>
            p.id === postId ? { ...p, likes_count: result.likes_count, is_liked: true } : p
          ),
        }))
      );
      socket.on("post:unliked", ({ postId, result }: any) =>
        set((state) => ({
          posts: state.posts.map((p) =>
            p.id === postId ? { ...p, likes_count: result.likes_count, is_liked: false } : p
          ),
        }))
      );
      socket.on("comment:created", ({ postId, comment }: any) =>
        set((state) => ({
          commentsByPost: {
            ...state.commentsByPost,
            [postId]: [...(state.commentsByPost[postId] || []), comment],
          },
        }))
      );
    }
  },

  // 📜 Get all posts
  getAllPosts: async (page = 1) => {
    set({ loading: true, error: null });
    try {
      const res = await post.getAll(page);
      const posts = res.data.results || res.data;
      set({ posts, loading: false });
    } catch (err: any) {
      console.error("Get all posts error:", err.response?.data || err.message);
      set({ error: err.response?.data?.detail || "Failed to load posts", loading: false });
    }
  },

  getPostById: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const res = await post.getById(id);
      set({ currentPost: res.data, loading: false });
      return res.data;
    } catch (err: any) {
      console.error("Get post error:", err.response?.data || err.message);
      set({ error: err.response?.data?.detail || "Failed to load post", loading: false });
      return null;
    }
  },

  createPost: async (data) => {
    set({ loading: true, error: null });
    try {
      const res = await post.create(data);
      set((state) => ({ posts: [res.data, ...state.posts], loading: false }));
    } catch (err: any) {
      console.error("Create post error:", err.response?.data || err.message);
      set({ error: err.response?.data?.detail || "Failed to create post", loading: false });
    }
  },

  likePost: async (id) => {
    try {
      await post.like(id);
    } catch (err) {
      console.error("Like post error:", err);
    }
  },
  unlikePost: async (id) => {
    try {
      await post.unlike(id);
    } catch (err) {
      console.error("Unlike post error:", err);
    }
  },
  bookmarkPost: async (id) => {
    try {
      await post.bookmark(id);
    } catch (err) {
      console.error("Bookmark post error:", err);
    }
  },
  unbookmarkPost: async (id) => {
    try {
      await post.unbookmark(id);
    } catch (err) {
      console.error("Unbookmark post error:", err);
    }
  },
  addComment: async (postId, content) => {
    try {
      const res = await post.addComment(postId, { content });
      set((state) => ({
        commentsByPost: {
          ...state.commentsByPost,
          [postId]: [...(state.commentsByPost[postId] || []), res.data],
        },
      }));
    } catch (err) {
      console.error("Add comment error:", err);
    }
  },
  getComments: async (postId) => {
    try {
      const data = await post.getComments(postId);
      set((state) => ({
        commentsByPost: { ...state.commentsByPost, [postId]: data },
      }));
    } catch (err) {
      console.error("Get comments error:", err);
    }
  },
  addReply: async (commentId, content) => {
    try {
      const res = await post.addReply({ comment: String(commentId), content });
      set((state) => ({ replies: [...state.replies, res.data] }));
    } catch (err) {
      console.error("Add reply error:", err);
    }
  },
  getReplies: async (postId) => {
    try {
      const res = await post.getReplies(postId);
      set({ replies: res.data });
    } catch (err) {
      console.error("Get replies error:", err);
    }
  },
  getRepliesByComment: async (commentId) => {
    try {
      const res = await post.getRepliesByComment(commentId);
      set((state) => ({
        repliesByComment: { ...state.repliesByComment, [commentId]: res.data },
      }));
    } catch (err) {
      console.error("Get replies by comment error:", err);
    }
  },
  repostPost: async (id, message) => {
    try {
      await post.repost(id, { message });
    } catch (err) {
      console.error("Repost error:", err);
    }
  },
  likeComment: async (commentId) => {
    try {
      await post.likeComment(commentId);
    } catch (err) {
      console.error("Like comment error:", err);
    }
  },
  unlikeComment: async (commentId) => {
    try {
      await post.unlikeComment(commentId);
    } catch (err) {
      console.error("Unlike comment error:", err);
    }
  },
  likeReply: async (replyId) => {
    try {
      await post.likeReply(replyId);
    } catch (err) {
      console.error("Like reply error:", err);
    }
  },
  unlikeReply: async (replyId) => {
    try {
      await post.unlikeReply(replyId);
    } catch (err) {
      console.error("Unlike reply error:", err);
    }
  },
  getTrendingHashtags: async () => {
    try {
      const res = await post.getTrendingHashtags();
      set({ trendingHashtags: res.data });
    } catch (err) {
      console.error("Fetch trending hashtags error:", err);
    }
  },
  filterPostsByHashtag: async (tag) => {
    set({ loadingHashtag: true, activeHashtag: tag });
    try {
      const res = await post.getAll();
      const posts = res.data.results || res.data;
      const filtered = posts.filter((p: Post) =>
        p.hashtags.some((h) => h.tag.toLowerCase() === tag.toLowerCase())
      );
      set({ filteredPosts: filtered, loadingHashtag: false });
    } catch (err) {
      console.error("Filter posts by hashtag error:", err);
      set({ loadingHashtag: false });
    }
  },
  resetFilteredPosts: () =>
    set({ filteredPosts: [], activeHashtag: null, loadingHashtag: false }),
}));
