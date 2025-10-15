// app/store/usePostStore.ts
"use client";

import { create } from "zustand";
import { post } from "../services/post";
import { io, Socket } from "socket.io-client";

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

// ---------- Store shape ----------
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

  set: (partial: Partial<PostState>) => void;

  // Actions
  initSocket: () => void;
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
  getTrendingHashtags: () => Promise<void>;
  filterPostsByHashtag: (tag: string) => Promise<void>;
  resetFilteredPosts: () => void;
};

// ---------- Singleton socket ----------
let socketInstance: Socket | null = null;
const listenersAttached = new Set<string>();

const getSocket = (token: string) => {
  if (!socketInstance) {
    socketInstance = io(process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000", {
      auth: { token },
    });

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

// ---------- Zustand store ----------
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

  // ---------- Socket init ----------
  initSocket: () => {
    const token = localStorage.getItem("access");
    if (!token) return;

    const socket = getSocket(token);
    set({ socket });

    // Post events
    attachListener("post:created", (post: Post) =>
      set((state) => ({ posts: [post, ...state.posts] }))
    );

    attachListener("post:updated", (updated: Post) =>
      set((state) => ({
        posts: state.posts.map((p) => (p.id === updated.id ? updated : p)),
      }))
    );

    attachListener("post:deleted", ({ id }: { id: string }) =>
      set((state) => ({ posts: state.posts.filter((p) => p.id !== id) }))
    );

    attachListener("post:liked", ({ postId, result }: any) =>
      set((state) => ({
        posts: state.posts.map((p) =>
          p.id === postId ? { ...p, likes_count: result?.likes ?? p.likes_count } : p
        ),
      }))
    );

    attachListener("post:unliked", ({ postId, result }: any) =>
      set((state) => ({
        posts: state.posts.map((p) =>
          p.id === postId ? { ...p, likes_count: result?.likes ?? p.likes_count } : p
        ),
      }))
    );

    attachListener("post:bookmarked", ({ postId }: { postId: string }) =>
      set((state) => ({
        posts: state.posts.map((p) =>
          p.id === postId ? { ...p, is_bookmarked: true } : p
        ),
      }))
    );

    attachListener("post:unbookmarked", ({ postId }: { postId: string }) =>
      set((state) => ({
        posts: state.posts.map((p) =>
          p.id === postId ? { ...p, is_bookmarked: false } : p
        ),
      }))
    );

    // Comment events
    attachListener("comment:created", ({ postId, comment }: any) =>
      set((state) => ({
        commentsByPost: {
          ...state.commentsByPost,
          [postId]: [...(state.commentsByPost[postId] || []), comment],
        },
        posts: state.posts.map((p) =>
          p.id === postId
            ? { ...p, comments_count: (p.comments_count || 0) + 1 }
            : p
        ),
      }))
    );

    attachListener("comment:liked", ({ commentId, result }: any) =>
      set((state) => {
        const updated = { ...state.commentsByPost };
        for (const postId in updated) {
          updated[postId] = updated[postId].map((c) =>
            c.id === commentId ? { ...c, likes_count: result?.likes ?? c.likes_count } : c
          );
        }
        return { commentsByPost: updated };
      })
    );

    attachListener("comment:unliked", ({ commentId, result }: any) =>
      set((state) => {
        const updated = { ...state.commentsByPost };
        for (const postId in updated) {
          updated[postId] = updated[postId].map((c) =>
            c.id === commentId ? { ...c, likes_count: result?.likes ?? c.likes_count } : c
          );
        }
        return { commentsByPost: updated };
      })
    );

    // Reply events
    attachListener("reply:liked", ({ replyId, result }: any) =>
      set((state) => {
        const updated = { ...state.repliesByComment };
        for (const commentId in updated) {
          updated[commentId] = updated[commentId].map((r) =>
            r.id === replyId ? { ...r, likes_count: result?.likes ?? r.likes_count } : r
          );
        }
        return { repliesByComment: updated };
      })
    );

    attachListener("reply:unliked", ({ replyId, result }: any) =>
      set((state) => {
        const updated = { ...state.repliesByComment };
        for (const commentId in updated) {
          updated[commentId] = updated[commentId].map((r) =>
            r.id === replyId ? { ...r, likes_count: result?.likes ?? r.likes_count } : r
          );
        }
        return { repliesByComment: updated };
      })
    );
  },

  // ---------- Actions (call post service as before) ----------
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
      console.log(normalized)
    } catch (err: any) {
      set({ error: err.response?.data?.detail || "Failed to load posts", loading: false });
    }
  },

  getPostById: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const res = await post.getById(id);
      const p = res.data;
      const normalized: Post = {
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
      return normalized;
    } catch (err: any) {
      set({ error: err.response?.data?.detail || "Failed to load post", loading: false });
      return null;
    }
  },

  createPost: async (data) => {
    set({ loading: true, error: null });
    try {
      console.log(data)
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
      set((state) => ({ posts: [newPost, ...state.posts], loading: false }));
    } catch (err: any) {
      set({ error: err.response?.data?.detail || "Failed to create post", loading: false });
    }
  },

  likePost: async (id) => { try { await post.like(id); } catch (err) { console.error(err); } },
  unlikePost: async (id) => { try { await post.unlike(id); } catch (err) { console.error(err); } },
  bookmarkPost: async (id) => { try { await post.bookmark(id); } catch (err) { console.error(err); } },
  unbookmarkPost: async (id) => { try { await post.unbookmark(id); } catch (err) { console.error(err); } },
  addComment: async (postId, content) => { try { await post.addComment(postId, { content }); } catch (err) { console.error(err); } },
  getComments: async (postId) => { try { const data = await post.getComments(postId); set((state) => ({ commentsByPost: { ...state.commentsByPost, [postId]: data } })); } catch (err) { console.error(err); } },
  addReply: async (commentId, content) => { try { await post.addReply({ comment: String(commentId), content }); } catch (err) { console.error(err); } },
  getReplies: async (postId) => { try { const res = await post.getReplies(postId); set({ repliesByComment: { ...get().repliesByComment, [postId]: res.data } }); } catch (err) { console.error(err); } },
  getRepliesByComment: async (commentId) => { try { const res = await post.getRepliesByComment(commentId); set((state) => ({ repliesByComment: { ...state.repliesByComment, [commentId]: res.data } })); } catch (err) { console.error(err); } },
  repostPost: async (id, message) => { try { await post.repost(id, { message }); } catch (err) { console.error(err); } },
  likeComment: async (commentId) => { try { await post.likeComment(commentId); } catch (err) { console.error(err); } },
  unlikeComment: async (commentId) => { try { await post.unlikeComment(commentId); } catch (err) { console.error(err); } },
  likeReply: async (replyId) => { try { await post.likeReply(replyId); } catch (err) { console.error(err); } },
  unlikeReply: async (replyId) => { try { await post.unlikeReply(replyId); } catch (err) { console.error(err); } },

  getTrendingHashtags: async () => { try { const res = await post.getTrendingHashtags(); set({ trendingHashtags: res.data }); } catch (err) { console.error(err); set({ trendingHashtags: [] }); } },
  filterPostsByHashtag: async (tag) => { try { const res = await post.getAll(); const posts = res.data.results || res.data; set({ filteredPosts: posts.filter((p: Post) => p.hashtags.some((h) => h.tag.toLowerCase() === tag.toLowerCase())), activeHashtag: tag }); } catch (err) { console.error(err); set({ filteredPosts: [], activeHashtag: null }); } },
  resetFilteredPosts: () => set({ filteredPosts: [], activeHashtag: null, loadingHashtag: false }),
}));
