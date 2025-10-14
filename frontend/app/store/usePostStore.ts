// app/store/usePostStore.ts
"use client";

import { create } from "zustand";
import { post } from "../services/post";
import { connectSocket, getSocket } from "../services/socket"; // ✅ socket import
import { useProfileStore } from "./useProfileStore"; // your store path

// 🧑‍💻 Types
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

  set: (partial: Partial<PostState>) => void;

  // Actions
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


  // ---------------------------------
  // 🧠 Add socket event listeners here
  // ---------------------------------
  // inside usePostStore.ts — replace your initializeSocket implementation with this:

initializeSocket: () => {
  const socket = getSocket() || connectSocket();
  if (!socket) {
    console.warn("Socket not available when initializing listeners");
    return;
  }

  // Prevent duplicate listeners: remove previous handlers for these events
  const safeOff = (ev: string) => {
    try {
      socket.off(ev);
    } catch (e) {
      /* ignore */
    }
  };

  // List of server events (match server.js exactly)
  safeOff("post:created");
  safeOff("post:updated");
  safeOff("post:deleted");

  safeOff("post:liked");
  safeOff("post:unliked");

  safeOff("comment:created");
  safeOff("comment:updated");
  safeOff("comment:deleted");
  safeOff("comment:liked");
  safeOff("comment:unliked");

  safeOff("reply:created");
  safeOff("reply:updated");
  safeOff("reply:deleted");
  safeOff("reply:liked");
  safeOff("reply:unliked");

  // POSTS
  socket.on("post:created", (newPost: Post) => {
    // avoid duplicates if already present
    set((state) => {
      if (state.posts.some((p) => p.id === newPost.id)) return {};
      return { posts: [newPost, ...state.posts] };
    });
  });

  socket.on("post:updated", (updatedPost: Post) => {
    set((state) => ({
      posts: state.posts.map((p) => (p.id === updatedPost.id ? { ...p, ...updatedPost } : p)),
      currentPost: state.currentPost?.id === updatedPost.id ? updatedPost : state.currentPost,
    }));
  });

  socket.on("post:deleted", ({ id }: { id: string }) => {
    set((state) => ({
      posts: state.posts.filter((p) => p.id !== id),
      currentPost: state.currentPost?.id === id ? null : state.currentPost,
    }));
  });

  // LIKES (post)
  socket.on("post:liked", ({ postId, userId }: { postId: string; userId: number }) => {
    set((state) => ({
      posts: state.posts.map((p) =>
        p.id === postId ? { ...p, likes_count: (p.likes_count || 0) + 1 } : p
      ),
    }));
  });

  socket.on("post:unliked", ({ postId, userId }: { postId: string; userId: number }) => {
    set((state) => ({
      posts: state.posts.map((p) =>
        p.id === postId && p.likes_count > 0 ? { ...p, likes_count: p.likes_count - 1 } : p
      ),
    }));
  });

  // COMMENTS
  socket.on("comment:created", (comment: any) => {
    const postId = String(comment.post);
    set((state) => ({
      commentsByPost: {
        ...state.commentsByPost,
        [postId]: [...(state.commentsByPost[postId] || []), comment],
      },
      posts: state.posts.map((p) =>
        p.id === postId ? { ...p, comments_count: (p.comments_count || 0) + 1 } : p
      ),
    }));
  });

  socket.on("comment:updated", (comment: any) => {
    const postId = String(comment.post);
    set((state) => {
      const updated = { ...state.commentsByPost };
      updated[postId] = (updated[postId] || []).map((c) => (c.id === comment.id ? comment : c));
      return { commentsByPost: updated };
    });
  });

  socket.on("comment:deleted", ({ id, post }: { id: string; post: string }) => {
    const postId = String(post);
    set((state) => {
      const updated = { ...state.commentsByPost };
      updated[postId] = (updated[postId] || []).filter((c) => c.id !== id);
      return { commentsByPost: updated };
    });
    set((state) => ({
      posts: state.posts.map((p) => (p.id === postId && p.comments_count > 0 ? { ...p, comments_count: p.comments_count - 1 } : p)),
    }));
  });

  socket.on("comment:liked", ({ commentId, postId }: { commentId: string; postId: string }) => {
    set((state) => {
      const updated = { ...state.commentsByPost };
      updated[postId] = (updated[postId] || []).map((c) =>
        c.id === commentId ? { ...c, likes_count: (c.likes_count || 0) + 1 } : c
      );
      return { commentsByPost: updated };
    });
  });

  socket.on("comment:unliked", ({ commentId, postId }: { commentId: string; postId: string }) => {
    set((state) => {
      const updated = { ...state.commentsByPost };
      updated[postId] = (updated[postId] || []).map((c) =>
        c.id === commentId && c.likes_count > 0 ? { ...c, likes_count: c.likes_count - 1 } : c
      );
      return { commentsByPost: updated };
    });
  });

  // REPLIES
  socket.on("reply:created", (reply: any) => {
    const commentId = String(reply.comment);
    set((state) => ({
      repliesByComment: {
        ...state.repliesByComment,
        [commentId]: [...(state.repliesByComment[commentId] || []), reply],
      },
    }));
  });

  socket.on("reply:updated", (reply: any) => {
    const commentId = String(reply.comment);
    set((state) => {
      const updated = { ...state.repliesByComment };
      updated[commentId] = (updated[commentId] || []).map((r) => (r.id === reply.id ? reply : r));
      return { repliesByComment: updated };
    });
  });

  socket.on("reply:deleted", ({ id, post }: { id: string; post: string }) => {
    // we remove by scanning comments — better if server includes comment id. fallback: no-op
    // If your server emits comment id with reply:deleted, adjust accordingly.
    // This is a no-op unless you modify the server to include comment id.
    console.log("reply deleted", id);
  });

  socket.on("reply:liked", ({ replyId, postId }: { replyId: string; postId: string }) => {
    set((state) => {
      const updated = { ...state.repliesByComment };
      for (const commentId in updated) {
        updated[commentId] = updated[commentId].map((r) =>
          r.id === replyId ? { ...r, likes_count: (r.likes_count || 0) + 1 } : r
        );
      }
      return { repliesByComment: updated };
    });
  });

  socket.on("reply:unliked", ({ replyId, postId }: { replyId: string; postId: string }) => {
    set((state) => {
      const updated = { ...state.repliesByComment };
      for (const commentId in updated) {
        updated[commentId] = updated[commentId].map((r) =>
          r.id === replyId && r.likes_count > 0 ? { ...r, likes_count: r.likes_count - 1 } : r
        );
      }
      return { repliesByComment: updated };
    });
  });

  // Optionally monitor connection errors
  socket.off("connect_error");
  socket.on("connect_error", (err: any) => {
    console.error("Socket connect error:", err?.message || err);
  });
},



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
  getPostById: async (id: string): Promise<Post | null> => {
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
      console.error("Get post error:", err.response?.data || err.message);
      set({
        error: err.response?.data?.detail || "Failed to load post",
        loading: false,
      });
      return null;
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
      // after set((state) => ({ posts: [newPost, ...state.posts], loading: false }))
      const socket = getSocket();
      if (socket && socket.connected) {
        socket.emit("post:created", newPost);
      }

    } catch (err: any) {
      console.error("Create post error:", err.response?.data || err.message);
      set({
        error: err.response?.data?.detail || "Failed to create post",
        loading: false,
      });
    }
  },

  // ❤️ Like a post
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

    const socket = getSocket();
    const currentUser = useProfileStore.getState().profile; // ✅ get current user id
    if (socket && socket.connected && currentUser) {
      socket.emit("post:liked", { postId: id, userId: currentUser.user_id });
    }

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

    const socket = getSocket();
    const currentUser = useProfileStore.getState().profile;
    if (socket && socket.connected && currentUser) {
      socket.emit("post:unliked", { postId: id, userId: currentUser.user_id });
    }

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
      // after updating commentsByPost and posts counts
      const socket = getSocket();
      if (socket && socket.connected) {
        socket.emit("comment:created", newComment); // ensure comment has 'post' property
      }

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
  addReply: async (commentId: string | number, content: string) => {
    try {
      const res = await post.addReply({ comment: String(commentId), content });
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
