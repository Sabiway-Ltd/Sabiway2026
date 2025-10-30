// app/store/usePostStore.ts

"use client";

import { create } from "zustand";
import { io, Socket } from "socket.io-client";
import axios from "axios";
import toast from "react-hot-toast";
import { EXPRESS_URL, DJANGO_URL } from "../utils/MyConstants";
import { post } from "../services/post";

const SOCKET_URL = EXPRESS_URL

// ---------- Types ----------
type Author = {
  user_id: number;
  username: string;
  full_name: string;
  profile_picture?: string | null;
  phone_number: string;
  is_following?: boolean;
  job?: string;
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
  getAllPosts: (page?: number) => Promise<void>;
  createPost: (data: FormData | object) => Promise<void>;
  // ... Add other actions like likePost, addComment, repost, etc.
};

// ---------- API ----------
const API_URL = `${EXPRESS_URL}/api`;

// ---------- Singleton Socket ----------
let socketInstance: Socket | null = null;
const listenersAttached = new Set<string>();

const getSocket = (token: string) => {
  if (!socketInstance) {
    socketInstance = io(EXPRESS_URL, {
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
  nextPage: 1,
  hasMore: true,
  userPosts: [],
  userNextPage: 1,
  userHasMore: true,
  myPosts: [],
  myNextPage: 1,
  myHasMore: true,
  

  refreshFeed: false,
  triggerRefresh: () => set({ refreshFeed: true }),
  consumeRefresh: () => set({ refreshFeed: false }),

  set: (partial) => set((state) => ({ ...state, ...partial })),

  // ---------- Initialize Socket ----------
  initSocket: async () => {
  if (get().socket) return; // prevent duplicate connections

  const token = localStorage.getItem("access");
  if (!token) {
    console.warn("⚠️ No token found — cannot init socket.");
    return;
  }

  // ✅ Initialize socket with token (backend reads this)
  const socket = io(SOCKET_URL, {
    transports: ["websocket"],
    withCredentials: true,
    auth: { token },
  });

  // ✅ Helper for listeners
  const attachListener = (event: string, handler: (...args: any[]) => void) => {
    socket.on(event, handler);
  };

  // ✅ Save socket in Zustand
  set({ socket });

  // ------------------ Connection lifecycle ------------------
  socket.on("connect", () => {
    console.log("✅ Socket connected:", socket.id);
  });

  socket.on("disconnect", (reason) => {
    console.log("🔴 Socket disconnected:", reason);
  });

  socket.io.on("reconnect", () => {
    console.log("♻️ Socket reconnected:", socket.id);
  });

  // ✅ Listen for online users (you can store or log them)
  socket.on("users:online", (users) => {
    console.log("🟢 Online users:", users);
    set({ onlineUsers: users }); // optional if you have this in store
  });

  /* -------------------------
      🟢 Post Events
  --------------------------*/
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
    set((state) => ({
      posts: state.posts.filter((p) => p.id !== id),
    }))
  );

  attachListener<{ postId: string; result: { likes: number } }>(
    "post:liked",
    ({ postId, result }) =>
      set((state) => ({
        posts: state.posts.map((p) =>
          p.id === postId ? { ...p, likes: result?.likes ?? p.likes } : p
        ),
      }))
  );

  attachListener<{ postId: string; result: { likes: number } }>(
    "post:unliked",
    ({ postId, result }) =>
      set((state) => ({
        posts: state.posts.map((p) =>
          p.id === postId ? { ...p, likes: result?.likes ?? p.likes } : p
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

  attachListener<{ postId: string; repost: any }>("post:reposted", ({ postId }) =>
    set((state) => ({
      posts: state.posts.map((p) =>
        p.id === postId ? { ...p, reposts_count: (p.reposts_count || 0) + 1 } : p
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

  /* -------------------------
      💬 Comment Events
  --------------------------*/
  attachListener<{ postId: string; comment: Comment }>(
    "comment:created",
    ({ postId, comment }) =>
      set((state) => ({
        commentsByPost: {
          ...state.commentsByPost,
          [postId]: [...(state.commentsByPost[postId] || []), comment],
        },
      }))
  );

  attachListener<{ commentId: string; data: any }>(
    "comment:liked",
    ({ commentId, data }) =>
      set((state) => ({
        commentsByPost: Object.fromEntries(
          Object.entries(state.commentsByPost).map(([postId, comments]) => [
            postId,
            comments.map((c) =>
              c.id === commentId
                ? {
                    ...c,
                    likes_count: data?.likes || c.likes_count,
                    is_liked: true,
                  }
                : c
            ),
          ])
        ),
      }))
  );

  attachListener<{ commentId: string; data: any }>(
    "comment:unliked",
    ({ commentId, data }) =>
      set((state) => ({
        commentsByPost: Object.fromEntries(
          Object.entries(state.commentsByPost).map(([postId, comments]) => [
            postId,
            comments.map((c) =>
              c.id === commentId
                ? {
                    ...c,
                    likes_count: data?.likes || c.likes_count,
                    is_liked: false,
                  }
                : c
            ),
          ])
        ),
      }))
  );

  /* -------------------------
      💬 Reply Events
  --------------------------*/
  attachListener<{ commentId: string; reply: any }>(
    "reply:created",
    ({ commentId, reply }) =>
      set((state) => ({
        repliesByComment: {
          ...state.repliesByComment,
          [commentId]: [...(state.repliesByComment[commentId] || []), reply],
        },
      }))
  );

  attachListener<{ replyId: string; data: any }>(
    "reply:liked",
    ({ replyId, data }) =>
      set((state) => ({
        repliesByComment: Object.fromEntries(
          Object.entries(state.repliesByComment).map(([commentId, replies]) => [
            commentId,
            replies.map((r) =>
              r.id === replyId
                ? {
                    ...r,
                    likes_count: data?.likes || r.likes_count,
                    is_liked: true,
                  }
                : r
            ),
          ])
        ),
      }))
  );

  attachListener<{ replyId: string; data: any }>(
    "reply:unliked",
    ({ replyId, data }) =>
      set((state) => ({
        repliesByComment: Object.fromEntries(
          Object.entries(state.repliesByComment).map(([commentId, replies]) => [
            commentId,
            replies.map((r) =>
              r.id === replyId
                ? {
                    ...r,
                    likes_count: data?.likes || r.likes_count,
                    is_liked: false,
                  }
                : r
            ),
          ])
        ),
      }))
  );

  /* -------------------------
      🔄 Fetch initial posts
  --------------------------*/
  await get().getAllPosts(1);

  console.log("✅ Socket initialized and event listeners attached");
},

  // ---------- Get all posts ----------
  // getAllPosts: async () => {
  //   set({ loading: true });
  //   const token = localStorage.getItem("access");
  //   if (!token) return set({ error: "Not logged in", loading: false });
 getAllPosts: async (page = 1) => {
    const { loading, nextPage } = get(); // ✅ Access current state first
    if (loading || (page !== nextPage && page !== 1)) return; // ✅ Prevent duplicate fetch

    set({ loading: true, error: null });

    const token = localStorage.getItem("access");
    if (!token) return set({ error: "Not logged in", loading: false });

    try {
      const res = await axios.get(`${API_URL}/posts/?page=${page}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // DRF pagination returns { count, next, previous, results }
      const newPosts = res.data.results || res.data;

      set((state) => ({
        posts: page === 1 ? newPosts : [...state.posts, ...newPosts],
        nextPage: res.data.next ? page + 1 : null,
        hasMore: !!res.data.next,
        loading: false,
      }));
    } catch (err) {
      console.error("Get all posts error:", err);
      set({ error: "Failed to fetch posts", loading: false });
    }
  },

  getPostsByUsername: async (username: string, page = 1) => {
    const { loading, userNextPage } = get();
    if (loading || (page !== 1 && page !== userNextPage)) return;

    set({ loading: true, error: null });

    try {
      const res = await post.getByUsername(username, page);
      const newPosts = res.data.results || res.data;

      set((state) => ({
        userPosts: page === 1 ? newPosts : [...state.userPosts, ...newPosts],
        userNextPage: res.data.next ? page + 1 : null,
        userHasMore: !!res.data.next,
        loading: false,
      }));
    } catch (err: any) {
      console.error("Posts by username fetch error:", err.response?.data || err.message);
      set({
        error: err.response?.data?.detail || "Failed to fetch posts for this user",
        loading: false,
      });
    }
  },

  resetUserPosts: () => set({ userPosts: [], userNextPage: 1, userHasMore: true }),



  getMyPosts: async (page = 1) => {
    const { loading } = get();
    if (loading) return;

    set({ loading: true, error: null });

    try {
      const res = await post.getByMe(page);
      const newPosts = res.data.results || res.data;

      set((state) => ({
        myPosts: page === 1 ? newPosts : [...state.myPosts, ...newPosts],
        myNextPage: res.data.next ? page + 1 : null,
        myHasMore: !!res.data.next,
        loading: false,
      }));
    } catch (err: any) {
      console.error("❌ Error fetching my posts:", err);
      set({
        error: err.response?.data?.detail || "Failed to fetch your posts",
        loading: false,
      });
    }
  },

  // ✅ --- Optional: Reset my posts (for profile refresh) ---
  resetMyPosts: () => set({ myPosts: [], myNextPage: 1, myHasMore: true }),


  createPost: async (data: FormData | object) => {
    set({ loading: true, error: null });
    try {
      const token = localStorage.getItem("access");
      if (!token) throw new Error("Not authenticated");

      const headers: Record<string, string> = { Authorization: `Bearer ${token}` };
      if (data instanceof FormData) headers["Content-Type"] = "multipart/form-data";

      const res = await axios.post<Post>(`${API_URL}/posts/`, data, { headers });
      const newPost = res.data;

      // Optionally update local posts immediately
      // set((state) => ({ posts: [newPost, ...state.posts] }));

      toast.success("Post created successfully!");
    } catch (err: any) {
      console.error("Create post error:", err);
      set({ error: "Failed to create post" });
      toast.error("Failed to create post.");
    } finally {
      set({ loading: false }); // ✅ always reset loading
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
        console.log("Axios error config:", err.config);
  console.log("Axios error code:", err.code);
  console.log("Axios error request:", err.request);
  console.error("Get post error:", err.response?.data || err.message);
      return null;
    }
  },




  likePost: async (id: string) => {
    try {
      const token = localStorage.getItem("access");
      if (!token) throw new Error("Not authenticated");

      const headers = { Authorization: `Bearer ${token}` };

      // Server will update likes and broadcast via socket
      await axios.post(`${API_URL}/posts/${id}/like/`, {}, { headers });

      // Optional: update your own UI immediately
      set((state) => ({
        posts: state.posts.map((p) =>
          p.id === id ? { ...p, is_liked: true } : p
        ),
      }));
    } catch (err: any) {
      console.error("Like post error:", err);
      toast.error("Failed to like post.");
    }
  },


unlikePost: async (id: string) => {
  try {
    const token = localStorage.getItem("access");
    if (!token) throw new Error("Not authenticated");

    const headers: Record<string, string> = { Authorization: `Bearer ${token}` };

    // HTTP request to unlike post
    const res = await axios.post<Post>(`${API_URL}/posts/${id}/unlike/`, {}, { headers });
    const updatedPost = res.data;

    // Update local state immediately
    set((state) => ({
      posts: state.posts.map((p) =>
        p.id === id
          ? { ...p, likes_count: updatedPost.likes_count, is_liked: false }
          : p
      ),
    }));

    // Emit socket event for real-time updates
    const socket = get().socket;
    socket?.emit("post:unliked", { postId: id, result: updatedPost });

    // toast.success("Post unliked!");
  } catch (err: any) {
    console.error("Unlike post error:", err);
    toast.error("Failed to unlike post.");
  }
},


  // likePost: async (id) => {
  //   try {
  //     await post.like(id);
  //   } catch (err) {
  //     console.error("Like post error:", err);
  //   }
  // },

  // unlikePost: async (id) => {
  //   try {
  //     await post.unlike(id);
  //   } catch (err) {
  //     console.error("Unlike post error:", err);
  //   }
  // },

 

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
  // addComment: async (postId, content) => {
  //   try {
  //     const res = await post.addComment(postId, { content });
  //     set((state) => ({
  //       commentsByPost: {
  //         ...state.commentsByPost,
  //         [postId]: [...(state.commentsByPost[postId] || []), res.data],
  //       },
  //     }));
  //   } catch (err) {
  //     console.error("Add comment error:", err);
  //   }
  // },


  addComment: async (postId: string, content: string, imageFile?: File) => {
    const token = localStorage.getItem("access");
    if (!token) return toast.error("Not logged in");

    try {
      const formData = new FormData();
      formData.append("content", content);
      if (imageFile) formData.append("image", imageFile); // ✅ optional image

      const res = await axios.post<Comment>(
        `${API_URL}/posts/${postId}/comments`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      toast.success("Comment added!");
    } catch (err) {
      console.error("Add comment error:", err);
      toast.error("Failed to add comment.");
    }
  },






  // getComments: async (postId) => {
  //   try {
  //     const data = await post.getComments(postId);
  //     set((state) => ({
  //       commentsByPost: { ...state.commentsByPost, [postId]: data },
  //     }));
  //   } catch (err) {
  //     console.error("Get comments error:", err);
  //   }
  // },

  getComments: async (postId: string) => {
    const token = localStorage.getItem("access");
    if (!token) return set({ error: "Not logged in" });

    try {
      const res = await axios.get<Comment[]>(
        `${API_URL}/posts/${postId}/comments`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Normalize key as string
      set((state) => ({
        commentsByPost: {
          ...state.commentsByPost,
          [postId.toString()]: res.data,
        },
      }));
    } catch (err: any) {
      console.error("Get comments error:", err);
      // set({ error: "Failed to fetch comments" });
    }
  },

 addReply: async (commentId: string, content: string, imageFile?: File) => {
  const token = localStorage.getItem("access");
  if (!token) return toast.error("Not logged in");

  try {
    const formData = new FormData();
    formData.append("comment", commentId);
    formData.append("content", content);
    if (imageFile) formData.append("image", imageFile);

    const res = await axios.post<Reply>(
      `${DJANGO_URL}/api/posts/replies/`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      }
    );

    // ✅ Append to local state for instant UI update
    set((state) => ({
      repliesByComment: {
        ...state.repliesByComment,
        [commentId]: [...(state.repliesByComment[commentId] || []), res.data],
      },
    }));

    toast.success("Reply added!");
  } catch (err) {
    console.error("Add reply error:", err);
    toast.error("Failed to add reply.");
  }
},



  getReplies: async (postId: string) => {
    const token = localStorage.getItem("access");
    if (!token) return toast.error("Not logged in");

    try {
      const res = await axios.get<Reply[]>(
        `${API_URL}/posts/${postId}/replies`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Flatten repliesByComment using commentId as key
      const repliesByComment = res.data.reduce((acc, reply) => {
        const key = reply.comment.toString();
        if (!acc[key]) acc[key] = [];
        acc[key].push(reply);
        return acc;
      }, {} as Record<string, Reply[]>);

      set((state) => ({
        repliesByComment: { ...state.repliesByComment, ...repliesByComment },
      }));
    } catch (err) {
      console.error("Get replies error:", err);
      toast.error("Failed to fetch replies.");
    }
  },

  getRepliesByComment: async (commentId) => {
    const token = localStorage.getItem("access");
    if (!token) return toast.error("Not logged in");

    try {
      const res = await fetch(`${DJANGO_URL}/api/posts/comments/${commentId}/replies/`, {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch replies: ${res.statusText}`);
      }

      const data = await res.json();

      // Keep only top-level replies
      const topLevelReplies = data.filter(reply => reply.parent_reply_id === null);

      set((state) => ({
        repliesByComment: {
          ...state.repliesByComment,
          [commentId]: [
            // Merge with existing replies, avoiding duplicates
            ...topLevelReplies.filter(
              (newReply) =>
                !state.repliesByComment[commentId]?.some(
                  (existing) => existing.id === newReply.id
                )
            ),
            ...(state.repliesByComment[commentId] || []),
          ],
        },
      }));
    } catch (err) {
      console.error("Get replies by comment error:", err);
      toast.error("Failed to load replies");
    }
  },


  // getRepliesByComment: async (commentId: string) => {
  //   const token = localStorage.getItem("token");
  //   try {
  //     const res = await fetch(`${API_URL}/api/posts/comments/${commentId}/replies`, {
  //       method: "GET",
  //       credentials: "include",
  //       headers: {
  //         "Content-Type": "application/json",
  //         Authorization: `Bearer ${token}`,
  //       },
  //     });

  //     if (!res.ok) throw new Error("Failed to fetch replies");
  //     const data = await res.json();

  //     // You can store this structured data directly
  //     set((state) => ({
  //       repliesByComment: {
  //         ...state.repliesByComment,
  //         [commentId]: data,
  //       },
  //     }));
  //   } catch (error) {
  //     console.error("Error fetching replies:", error);
  //   }
  // },



  // 🌀 Nested replies

  getNestedReplies: async (parentReplyId: string) => {
    const token = localStorage.getItem("access");
    if (!token) return toast.error("Not logged in");

    try {
      const res = await axios.get<Reply[]>(
        `${DJANGO_URL}/api/posts/replies/${parentReplyId}/children/`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Organize by parentReplyId
      // ✅ Ensure it's stored under the correct parentReplyId
      set((state) => ({
        nestedReplies: {
          ...state.nestedReplies,
          [parentReplyId]: res.data, // store replies under parentReplyId
        },
    }));
    } catch (err) {
      console.error("Get nested replies error:", err);
      toast.error("Failed to fetch nested replies.");
    }
  },

  addNestedReply: async (
    parentReplyId: string,
    content: string,
    imageFile?: File
  ) => {
    const token = localStorage.getItem("access");
    if (!token) return toast.error("Not logged in");

    try {
      const formData = new FormData();
      formData.append("content", content);
      formData.append("parent_reply", parentReplyId);
      if (imageFile) formData.append("image", imageFile);

      const res = await axios.post<Reply>(
        `${DJANGO_URL}/api/posts/replies/`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      // ✅ Find which comment this parent reply belongs to
      set((state) => {
        const commentId = Object.keys(state.repliesByComment).find((cid) =>
          (state.repliesByComment[cid] || []).some(
            (r) => r.id === parentReplyId
          )
        );

        if (!commentId) {
          console.warn("Parent reply not found in state; cannot append.");
          return state;
        }

        return {
          repliesByComment: {
            ...state.repliesByComment,
            [commentId]: [
              ...(state.repliesByComment[commentId] || []),
              res.data,
            ],
          },
        };
      });

      toast.success("Nested reply added!");
    } catch (err) {
      console.error("Add nested reply error:", err);
      toast.error("Failed to add nested reply.");
    }
  },






    // usePostStore.ts
    filterBySearch: async (query, type = "posts") => {
      try {
        set({
          loadingHashtag: true,
          activeSearch: query,
          activeHashtag: null,
          error: null,
        });

        const res = await axios.get(`${DJANGO_URL}/api/search/`, {
          params: { q: query, type },
        });

        if (type === "posts") {
          set({
            filteredPosts: res.data,
            filteredProfiles: [],
            filteredHashtags: [],
          });
        } else if (type === "profiles") {
          set({
            filteredProfiles: res.data,
            filteredPosts: [],
            filteredHashtags: [],
          });
        } else if (type === "hashtags") {
          set({
            filteredHashtags: res.data,
            filteredPosts: [],
            filteredProfiles: [],
          });
        }

        set({ loadingHashtag: false });
      } catch (error: any) {
        set({ error: error.message, loadingHashtag: false });
      }
    },

    resetFilteredResults: () => {
      set({
        filteredPosts: null,
        filteredProfiles: null,
        filteredHashtags: null,
        activeHashtag: null,
        activeSearch: null,
      });
    },








  // repostPost: async (id, message) => {
  //   try {
  //     await post.repost(id, { message });
  //   } catch (err) {
  //     console.error("Repost error:", err);
  //   }
  // },


  /* -------------------------
    🔁 Repost Actions
  --------------------------*/
  repostPost: async (id: string, message?: string) => {
    try {
      const token = localStorage.getItem("access");
      if (!token) throw new Error("Not authenticated");

      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.post(`${API_URL}/posts/${id}/repost/`, { message }, { headers });
      const repostData = res.data;

      // ✅ Update local state immediately
      set((state) => ({
        posts: state.posts.map((p) =>
          p.id === id
            ? { ...p, reposts_count: (p.reposts_count || 0) + 1 }
            : p
        ),
      }));

      // ✅ Emit socket event for real-time sync
      const socket = get().socket;
      socket?.emit("post:reposted", { postId: id, repost: repostData });

      toast.success("Post reposted!");
    } catch (err: any) {
      console.error("Repost error:", err);
      toast.error("Failed to repost.");
    }
  },


  unrepostPost: async (id: string) => {
    try {
      const token = localStorage.getItem("access");
      if (!token) throw new Error("Not authenticated");

      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.post(`${API_URL}/posts/${id}/unrepost/`, {}, { headers });
      const result = res.data;

      // ✅ Update local state immediately
      set((state) => ({
        posts: state.posts.map((p) =>
          p.id === id
            ? { ...p, reposts_count: Math.max((p.reposts_count || 1) - 1, 0) }
            : p
        ),
      }));

      // ✅ Emit socket event for real-time sync
      const socket = get().socket;
      socket?.emit("post:unreposted", { postId: id, result });

      toast.success("Repost removed!");
    } catch (err: any) {
      console.error("Unrepost error:", err);
      toast.error("Failed to remove repost.");
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
    set({ filteredPosts: [], activeHashtag: null,  activeSearch: null, loadingHashtag: false }),
}));
