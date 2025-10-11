// app/store/usePostStore.ts
"use client";

import { create } from "zustand";
import { post } from "../services/post";

// 🧑‍💻 Types
type Author = {
  user_id: number;
  username: string;
  full_name: string;
  profile_picture?: string | null;
  whatsapp_number: string;
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
};

// 🧱 Store shape
type PostState = {
  posts: Post[];
  currentPost: Post | null;
  commentsByPost: Record<string, Comment[]>;
  replies: Reply[];
  repliesByComment: Record<string, Reply[]>;
  loading: boolean; // global feed loading
  loadingHashtag: boolean; // separate loading flag for hashtag filtering
  error: string | null;
  trendingHashtags: Hashtag[];
  getTrendingHashtags: () => Promise<void>;
  filteredPosts: Post[];
  activeHashtag: string | null; // which hashtag we are filtering by
  filterPostsByHashtag: (tag: string) => Promise<void>;
  resetFilteredPosts: () => void;

  // Actions
  getAllPosts: (page?: number) => Promise<void>;
  getPostById: (id: string) => Promise<void>;
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

  // 📜 Get all posts
  getAllPosts: async (page = 1) => {
    set({ loading: true, error: null });
    try {
      const res = await post.getAll(page);
      const posts = res.data.results || res.data;

      const normalized = posts.map((p: Post) => ({
        ...p,
        is_liked: p.is_liked ?? false,
        author: {
          ...p.author,
          profile_picture:
            p.author.profile_picture ||
            "https://res.cloudinary.com/devqbjptr/image/upload/v1759934268/Avatar_2_rl1a6d.png",
        },
      }));

      set({ posts: normalized, loading: false });
    } catch (err: any) {
      console.error("Get all posts error:", err.response?.data || err.message);
      set({
        error: err.response?.data?.detail || "Failed to load posts",
        loading: false,
      });
    }
  },

  // 📄 Get a single post
  getPostById: async (id) => {
    set({ loading: true, error: null });
    try {
      const res = await post.getById(id);
      const p = res.data;
      const normalized = {
        ...p,
        is_liked: p.is_liked ?? false,
        author: {
          ...p.author,
          profile_picture:
            p.author.profile_picture ||
            "https://res.cloudinary.com/devqbjptr/image/upload/v1759934268/Avatar_2_rl1a6d.png",
        },
      };
      set({ currentPost: normalized, loading: false });
      return normalized; // ✅ Must return for impressions
    } catch (err: any) {
      console.error("Get post error:", err.response?.data || err.message);
      set({
        error: err.response?.data?.detail || "Failed to load post",
        loading: false,
      });
      return null; // ✅ return null on error
    }
  },

  // ✍️ Create post
  createPost: async (data) => {
    set({ loading: true, error: null });
    try {
      const res = await post.create(data);
      const newPost: Post = {
        ...res.data,
        is_liked: false,
        author: {
          ...res.data.author,
          profile_picture:
            res.data.author.profile_picture ||
            "https://res.cloudinary.com/devqbjptr/image/upload/v1759934268/Avatar_2_rl1a6d.png",
        },
      };
      set((state) => ({
        posts: [newPost, ...state.posts],
        loading: false,
      }));
    } catch (err: any) {
      console.error("Create post error:", err.response?.data || err.message);
      set({
        error: err.response?.data?.detail || "Failed to create post",
        loading: false,
      });
    }
  },

  // ❤️ Like a post
  likePost: async (id) => {
    try {
      await post.like(id);
      set((state) => ({
        posts: state.posts.map((p) =>
          p.id === id
            ? { ...p, likes_count: (p.likes_count || 0) + 1, is_liked: true }
            : p
        ),
      }));
    } catch (err) {
      console.error("Like post error:", err);
    }
  },

  // 💔 Unlike a post
  unlikePost: async (id) => {
    try {
      await post.unlike(id);
      set((state) => ({
        posts: state.posts.map((p) =>
          p.id === id && p.likes_count > 0
            ? { ...p, likes_count: p.likes_count - 1, is_liked: false }
            : p
        ),
      }));
    } catch (err) {
      console.error("Unlike post error:", err);
    }
  },

  // 🔖 Bookmark
  bookmarkPost: async (id) => {
    try {
      await post.bookmark(id);
    } catch (err) {
      console.error("Bookmark post error:", err);
    }
  },

  // ❌ Unbookmark
  unbookmarkPost: async (id) => {
    try {
      await post.unbookmark(id);
    } catch (err) {
      console.error("Unbookmark post error:", err);
    }
  },

  // 💬 Add comment
  addComment: async (postId, content) => {
    try {
      const res = await post.addComment(postId, { content });
      const newComment = res.data;

      set((state) => ({
        commentsByPost: {
          ...state.commentsByPost,
          [postId]: [...(state.commentsByPost[postId] || []), newComment],
        },
        posts: state.posts.map((p) =>
          p.id === postId
            ? { ...p, comments_count: (p.comments_count || 0) + 1 }
            : p
        ),
      }));
    } catch (err) {
      console.error("Add comment error:", err);
    }
  },

  // 💬 Get comments
  getComments: async (postId) => {
    try {
      const data = await post.getComments(postId);
      set((state) => ({
        commentsByPost: {
          ...state.commentsByPost,
          [postId]: Array.isArray(data) ? data : [],
        },
      }));
    } catch (err: any) {
      console.error("Get comments error:", err?.response?.data || err?.message);
      set((state) => ({
        commentsByPost: { ...state.commentsByPost, [postId]: [] },
      }));
    }
  },

  // 💭 Add reply
  addReply: async (commentId, content) => {
    try {
      const res = await post.addReply({ comment: commentId, content });
      set((state) => ({
        replies: [...state.replies, res.data],
      }));
    } catch (err) {
      console.error("Add reply error:", err);
    }
  },

  // 💭 Get replies for a post
  getReplies: async (postId) => {
    try {
      const res = await post.getReplies(postId);
      set({ replies: res.data });
    } catch (err) {
      console.error("Get replies error:", err);
    }
  },

  // 💭 Get replies for a specific comment
  getRepliesByComment: async (commentId: string) => {
    try {
      const res = await post.getRepliesByComment(commentId);
      set((state) => ({
        repliesByComment: {
          ...state.repliesByComment,
          [commentId]: res.data,
        },
      }));
    } catch (err) {
      console.error("Get replies by comment error:", err);
    }
  },

  // 🔁 Repost
  repostPost: async (id, message) => {
    try {
      await post.repost(id, { message });
    } catch (err) {
      console.error("Repost error:", err);
    }
  },

  // 💬 Like a comment
  likeComment: async (commentId) => {
    try {
      await post.likeComment(commentId);
      set((state) => {
        const updated = { ...state.commentsByPost };
        for (const postId in updated) {
          updated[postId] = updated[postId].map((c) =>
            c.id === commentId
              ? { ...c, likes_count: (c.likes_count || 0) + 1, is_liked: true }
              : c
          );
        }
        return { commentsByPost: updated };
      });
    } catch (err) {
      console.error("Like comment error:", err);
    }
  },

  // 💬 Unlike a comment
  unlikeComment: async (commentId) => {
    try {
      await post.unlikeComment(commentId);
      set((state) => {
        const updated = { ...state.commentsByPost };
        for (const postId in updated) {
          updated[postId] = updated[postId].map((c) =>
            c.id === commentId && c.likes_count > 0
              ? { ...c, likes_count: c.likes_count - 1, is_liked: false }
              : c
          );
        }
        return { commentsByPost: updated };
      });
    } catch (err) {
      console.error("Unlike comment error:", err);
    }
  },

  // 💭 Like a reply
  likeReply: async (replyId: string) => {
    try {
      await post.likeReply(replyId);
      set((state) => {
        const updated = { ...state.repliesByComment };
        for (const commentId in updated) {
          updated[commentId] = updated[commentId].map((r) =>
            r.id === replyId
              ? { ...r, likes_count: (r.likes_count || 0) + 1, is_liked: true }
              : r
          );
        }
        return { repliesByComment: updated };
      });
    } catch (err) {
      console.error("Like reply error:", err);
    }
  },

  // 💭 Unlike a reply
  unlikeReply: async (replyId: string) => {
    try {
      await post.unlikeReply(replyId);
      set((state) => {
        const updated = { ...state.repliesByComment };
        for (const commentId in updated) {
          updated[commentId] = updated[commentId].map((r) =>
            r.id === replyId && r.likes_count > 0
              ? { ...r, likes_count: r.likes_count - 1, is_liked: false }
              : r
          );
        }
        return { repliesByComment: updated };
      });
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
      set({ trendingHashtags: [] });
    }
  },

  // Filter posts by hashtag (separate loadingHashtag flag used)
  filterPostsByHashtag: async (tag: string) => {
    // only affect hashtag-loading, not global feed loading
    set({ loadingHashtag: true, error: null, activeHashtag: tag });
    try {
      // fetch (you could call a hashtag endpoint if available)
      const res = await post.getAll(1);
      const posts = res.data.results || res.data;

      const filtered = posts.filter((p: Post) =>
        p.hashtags.some((h) => h.tag.toLowerCase() === tag.toLowerCase())
      );

      set({ filteredPosts: filtered, loadingHashtag: false });
    } catch (err: any) {
      console.error("Filter posts by hashtag error:", err);
      set({ error: "Failed to filter posts", loadingHashtag: false });
    }
  },

  resetFilteredPosts: () =>
    set({ filteredPosts: [], activeHashtag: null, loadingHashtag: false }),
}));
