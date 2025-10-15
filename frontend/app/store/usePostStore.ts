"use client";

import { create } from "zustand";
import { io, Socket } from "socket.io-client";
import axios from "axios";
import toast from "react-hot-toast";
import { EXPRESS_LOCAL_URL } from "../utils/MyConstants";
import { post } from "../services/post";

// ---------- Types ----------
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
  is_bookmarked?: boolean;
  created_at: string;
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
  repliesByComment: Record<string, Reply[]>;
  loading: boolean;
  loadingHashtag: boolean;
  error: string | null;
  trendingHashtags: Hashtag[];
  filteredPosts: Post[];
  activeHashtag: string | null;
  socket: Socket | null;

  // State setters
  set: (partial: Partial<PostState>) => void;

  // Actions
  initSocket: () => void;
  getAllPosts: () => Promise<void>;
  createPost: (data: FormData | object) => Promise<void>;
  // ... Add other actions like likePost, addComment, repost, etc.
};

// ---------- API ----------
const API_URL = `${EXPRESS_LOCAL_URL}/api`;

// ---------- Singleton Socket ----------
let socketInstance: Socket | null = null;
const listenersAttached = new Set<string>();

const getSocket = (token: string) => {
  if (!socketInstance) {
    socketInstance = io("http://localhost:5000", {
      auth: { token },
    });

    socketInstance.on("connect", () =>
      console.log("✅ Socket connected:", socketInstance?.id)
    );
  }
  return socketInstance;
};

const attachListener = <T = any>(event: string, handler: (data: T) => void) => {
  if (!listenersAttached.has(event) && socketInstance) {
    socketInstance.on(event, handler);
    listenersAttached.add(event);
  }
};

// ---------- Store ----------
export const usePostStore = create<PostState>((set, get) => ({
  posts: [],
  currentPost: null,
  commentsByPost: {},
  repliesByComment: {},
  loading: false,
  loadingHashtag: false,
  error: null,
  trendingHashtags: [],
  filteredPosts: [],
  activeHashtag: null,
  socket: null,

  set: (partial) => set((state) => ({ ...state, ...partial })),

  // ---------- Initialize Socket ----------
  initSocket: async () => {
    const token = localStorage.getItem("access");
    if (!token) return;

    const socket = getSocket(token);
    set({ socket });

    // ---------- Post Events ----------
    attachListener<Post>("post:created", (post) =>
      set((state) => ({
        posts: state.posts.some((p) => p.id === post.id)
          ? state.posts
          : [post, ...state.posts],
      }))
    );

    attachListener<Post>("post:updated", (updated) =>
      set((state) => ({
        posts: state.posts.map((p) => (p.id === updated.id ? updated : p)),
      }))
    );

    attachListener<{ id: string }>("post:deleted", ({ id }) =>
      set((state) => ({ posts: state.posts.filter((p) => p.id !== id) }))
    );

    attachListener<{ postId: string; result: any }>("post:liked", ({ postId, result }) =>
      set((state) => ({
        posts: state.posts.map((p) =>
          p.id === postId ? { ...p, likes_count: result?.likes || p.likes_count } : p
        ),
      }))
    );

    attachListener<{ postId: string; result: any }>("post:unliked", ({ postId, result }) =>
      set((state) => ({
        posts: state.posts.map((p) =>
          p.id === postId ? { ...p, likes_count: result?.likes || p.likes_count } : p
        ),
      }))
    );

    attachListener<{ postId: string }>("post:bookmarked", ({ postId }) =>
      set((state) => ({
        posts: state.posts.map((p) =>
          p.id === postId ? { ...p, is_bookmarked: true } : p
        ),
      }))
    );

    attachListener<{ postId: string }>("post:unbookmarked", ({ postId }) =>
      set((state) => ({
        posts: state.posts.map((p) =>
          p.id === postId ? { ...p, is_bookmarked: false } : p
        ),
      }))
    );

    // ---------- Comment Events ----------
    attachListener<{ postId: string; comment: Comment }>("comment:created", ({ postId, comment }) =>
      set((state) => ({
        commentsByPost: {
          ...state.commentsByPost,
          [postId]: [...(state.commentsByPost[postId] || []), comment],
        },
      }))
    );

    attachListener<{ commentId: string; data: any }>("comment:liked", ({ commentId, data }) =>
      set((state) => ({
        commentsByPost: Object.fromEntries(
          Object.entries(state.commentsByPost).map(([postId, comments]) => [
            postId,
            comments.map((c) =>
              c.id === commentId ? { ...c, likes_count: data?.likes || c.likes_count } : c
            ),
          ])
        ),
      }))
    );

    attachListener<{ commentId: string; data: any }>("comment:unliked", ({ commentId, data }) =>
      set((state) => ({
        commentsByPost: Object.fromEntries(
          Object.entries(state.commentsByPost).map(([postId, comments]) => [
            postId,
            comments.map((c) =>
              c.id === commentId ? { ...c, likes_count: data?.likes || c.likes_count } : c
            ),
          ])
        ),
      }))
    );

    // ---------- Reply Events ----------
    attachListener<{ replyId: string; data: any }>("reply:liked", ({ replyId, data }) =>
      set((state) => ({
        repliesByComment: Object.fromEntries(
          Object.entries(state.repliesByComment).map(([commentId, replies]) => [
            commentId,
            replies.map((r) =>
              r.id === replyId ? { ...r, likes_count: data?.likes || r.likes_count } : r
            ),
          ])
        ),
      }))
    );

    attachListener<{ replyId: string; data: any }>("reply:unliked", ({ replyId, data }) =>
      set((state) => ({
        repliesByComment: Object.fromEntries(
          Object.entries(state.repliesByComment).map(([commentId, replies]) => [
            commentId,
            replies.map((r) =>
              r.id === replyId ? { ...r, likes_count: data?.likes || r.likes_count } : r
            ),
          ])
        ),
      }))
    );

    // ---------- Repost Events ----------
    attachListener<{ postId: string; repost: any }>("post:reposted", ({ postId, repost }) =>
      set((state) => ({
        posts: state.posts.map((p) =>
          p.id === postId
            ? { ...p, reposts_count: (p.reposts_count || 0) + 1 }
            : p
        ),
      }))
    );

    attachListener<{ postId: string; repostId: string }>("post:unreposted", ({ postId }) =>
      set((state) => ({
        posts: state.posts.map((p) =>
          p.id === postId
            ? { ...p, reposts_count: Math.max((p.reposts_count || 1) - 1, 0) }
            : p
        ),
      }))
    );

    // Fetch initial posts
    await get().getAllPosts();
  },

  // ---------- Get all posts ----------
  getAllPosts: async () => {
    set({ loading: true });
    const token = localStorage.getItem("access");
    if (!token) return set({ error: "Not logged in", loading: false });

    try {
      const res = await axios.get<Post[]>(`${API_URL}/posts`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      set({ posts: res.data, loading: false });
    } catch (err: any) {
      console.error("Get all posts error:", err);
      set({ error: "Failed to fetch posts", loading: false });
    }
  },

  // ---------- Create post ----------
  createPost: async (data: FormData | object) => {
    set({ loading: true, error: null });
    try {
      const token = localStorage.getItem("access");
      if (!token) throw new Error("Not authenticated");

      const headers: Record<string, string> = { Authorization: `Bearer ${token}` };
      if (data instanceof FormData) headers["Content-Type"] = "multipart/form-data";

      const res = await axios.post<Post>(`${API_URL}/posts/`, data, { headers });
      const newPost = res.data;

      // Update local state immediately
      set((state) => ({
        posts: [newPost, ...state.posts],
        loading: false,
      }));

      toast.success("Post created successfully!");
    } catch (err: any) {
      console.error("Create post error:", err);
      set({ error: "Failed to create post", loading: false });
      toast.error("Failed to create post.");
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
