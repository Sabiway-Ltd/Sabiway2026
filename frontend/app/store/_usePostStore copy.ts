// usePostStore.ts
// app/store/usePostStore.ts
import { create } from "zustand";
import { io } from "socket.io-client";
import toast from "react-hot-toast";
import { EXPRESS_LOCAL_URL } from "@/app/utils/MyConstants"; // adjust if needed

const API_URL = `${EXPRESS_LOCAL_URL}/api/posts`;
const SOCKET_URL = EXPRESS_LOCAL_URL;

let socket: any = null;

/* --------------------------
   🔹 authFetch helper
---------------------------*/
const authFetch = async (url: string, options: RequestInit = {}) => {
  const access = localStorage.getItem("access");
  const headers: HeadersInit = {
    ...(options.headers || {}),
    ...(access ? { Authorization: `Bearer ${access}` } : {}),
  };

  // When sending FormData, do not set Content-Type
  const isFormData = options.body instanceof FormData;
  if (!isFormData) {
    headers["Content-Type"] = "application/json";
  }

  return fetch(url, {
    ...options,
    headers,
    credentials: "include",
  });
};

/* --------------------------
   🔹 Types
---------------------------*/
export interface Profile {
  user_id: number;
  username: string;
  full_name: string;
  profile_picture?: string | null;
}

export interface Hashtag {
  id?: number;
  tag: string;
  use_count: number;
}

export interface Post {
  id: string;
  author: Profile;
  content: string;
  image?: string | null;
  hashtags?: Hashtag[];
  likes_count: number;
  comments_count: number;
  impressions_count?: number;
  reposts_count?: number;
  created_at: string;
  updated_at?: string;
  // Optional client-only flags (not returned by API but useful)
  liked_by_me?: boolean;
  bookmarked_by_me?: boolean;
  reposted_by_me?: boolean;
}

export interface Comment {
  id: string;
  user: Profile;
  post: string;
  content: string;
  likes_count: number;
  created_at: string;
}

export interface Reply {
  id: string;
  user: Profile;
  comment: string;
  content: string;
  likes_count: number;
  created_at: string;
}

interface PostState {
  // Data
  posts: Post[];
  myPosts: Post[];
  page: number;
  hasMore: boolean;
  loading: boolean;
  postLoadingId?: string | null;

  // Comments & Replies caches
  commentsByPost: Record<string, Comment[]>;
  repliesByPost: Record<string, Reply[]>;

  // Hashtags
  trendingHashtags: Hashtag[];
  hashtags: Hashtag[];

  // API actions
  fetchPosts: (page?: number, reset?: boolean) => Promise<void>;
  fetchMyPosts: () => Promise<void>;
  fetchPostById: (id: string) => Promise<Post | null>;
  createPost: (payload: { content: string; image?: File | null }) => Promise<Post | null>;
  updatePost: (id: string, payload: { content?: string; image?: File | null | null }) => Promise<Post | null>;
  deletePost: (id: string) => Promise<boolean>;

  // Likes
  likePost: (id: string) => Promise<void>;
  unlikePost: (id: string) => Promise<void>;

  // Bookmarks
  bookmarkPost: (id: string) => Promise<void>;
  unbookmarkPost: (id: string) => Promise<void>;
  fetchMyBookmarks: () => Promise<void>;

  // Reposts
  repost: (id: string, message?: string) => Promise<void>;
  unrepost: (id: string, repostId: string) => Promise<void>;
  fetchMyReposts: () => Promise<void>;

  // Comments
  fetchComments: (postId: string) => Promise<void>;
  createComment: (postId: string, content: string) => Promise<Comment | null>;
  likeComment: (commentId: string) => Promise<void>;
  unlikeComment: (commentId: string) => Promise<void>;

  // Replies
  fetchReplies: (postId: string) => Promise<void>;
  createReply: (commentId: string, content: string) => Promise<Reply | null>;
  likeReply: (replyId: string) => Promise<void>;
  unlikeReply: (replyId: string) => Promise<void>;

  // Hashtags
  fetchTrendingHashtags: () => Promise<void>;
  fetchAllHashtags: () => Promise<void>;

  // Socket
  connectPostSocket: () => void;
  disconnectPostSocket: () => void;
}

/* --------------------------
   🔹 Utility helpers
---------------------------*/
const updatePostInList = (posts: Post[], updated: Post) =>
  posts.map((p) => (p.id === updated.id ? { ...p, ...updated } : p));

/* --------------------------
   🔹 Zustand store
---------------------------*/
export const usePostStore = create<PostState>((set, get) => ({
  posts: [],
  myPosts: [],
  page: 1,
  hasMore: true,
  loading: false,
  postLoadingId: null,
  commentsByPost: {},
  repliesByPost: {},
  trendingHashtags: [],
  hashtags: [],

  /* ------------------------------
     🔹 Fetch paginated posts
     fetchPosts(page?, reset?)
     - When reset=true -> replace list and set page
     - When !reset -> append results
  ------------------------------- */
  fetchPosts: async (page = 1, reset = false) => {
    try {
      const current = get();
      if (current.loading) return;
      set({ loading: true });

      const res = await authFetch(`${API_URL}/?page=${page}`);
      const data = await res.json();

      if (!res.ok) throw new Error(data.detail || "Failed to load posts");

      set((state) => ({
        posts: reset ? data : [...state.posts, ...data],
        page,
        hasMore: Array.isArray(data) ? data.length > 0 : false,
      }));
    } catch (err: any) {
      toast.error(err.message || "Error fetching posts");
    } finally {
      set({ loading: false });
    }
  },

  /* ------------------------------
     🔹 My posts
  ------------------------------- */
  fetchMyPosts: async () => {
    try {
      set({ loading: true });
      const res = await authFetch(`${API_URL}/me`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to load your posts");
      set({ myPosts: data });
    } catch (err: any) {
      toast.error(err.message || "Error loading your posts");
    } finally {
      set({ loading: false });
    }
  },

  /* ------------------------------
     🔹 Single post
  ------------------------------- */
  fetchPostById: async (id) => {
    try {
      set({ loading: true });
      const res = await authFetch(`${API_URL}/${id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to fetch post");
      return data as Post;
    } catch (err: any) {
      toast.error(err.message || "Error fetching post");
      return null;
    } finally {
      set({ loading: false });
    }
  },

  /* ------------------------------
     🔹 Create post (supports image via FormData)
  ------------------------------- */
  createPost: async (payload) => {
    try {
      set({ loading: true });

      let res;
      if (payload.image) {
        const form = new FormData();
        form.append("content", payload.content);
        if (payload.image) form.append("image", payload.image);
        res = await authFetch(`${API_URL}/`, {
          method: "POST",
          body: form,
        });
      } else {
        res = await authFetch(`${API_URL}/`, {
          method: "POST",
          body: JSON.stringify({ content: payload.content }),
        });
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Create post failed");

      // Prepend to feed immediately
      set((state) => ({ posts: [data, ...state.posts] }));
      toast.success("Post created");
      return data as Post;
    } catch (err: any) {
      toast.error(err.message || "Error creating post");
      return null;
    } finally {
      set({ loading: false });
    }
  },

  /* ------------------------------
     🔹 Update / Delete
  ------------------------------- */
  updatePost: async (id, payload) => {
    try {
      set({ loading: true });

      let res;
      if (payload.image !== undefined) {
        // to allow setting image to null, use FormData with explicit null handling:
        const form = new FormData();
        if (payload.content !== undefined) form.append("content", payload.content);
        // If image is null we send an explicit flag; backend must support it.
        if (payload.image instanceof File) {
          form.append("image", payload.image);
        } else if (payload.image === null) {
          form.append("image", ""); // backend might interpret empty as remove — adjust if your API expects something else
        }
        res = await authFetch(`${API_URL}/${id}`, {
          method: "PUT",
          body: form,
        });
      } else {
        res = await authFetch(`${API_URL}/${id}`, {
          method: "PATCH",
          body: JSON.stringify({ content: payload.content }),
        });
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Update failed");

      set((state) => ({ posts: updatePostInList(state.posts, data) }));
      toast.success("Post updated");
      return data as Post;
    } catch (err: any) {
      toast.error(err.message || "Error updating post");
      return null;
    } finally {
      set({ loading: false });
    }
  },

  deletePost: async (id) => {
    try {
      set({ loading: true });
      const res = await authFetch(`${API_URL}/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || "Delete failed");
      }
      // Remove from lists
      set((state) => ({
        posts: state.posts.filter((p) => p.id !== id),
        myPosts: state.myPosts.filter((p) => p.id !== id),
      }));
      toast.success("Post deleted");
      return true;
    } catch (err: any) {
      toast.error(err.message || "Error deleting post");
      return false;
    } finally {
      set({ loading: false });
    }
  },

  /* ------------------------------
     🔹 Like / Unlike (optimistic)
  ------------------------------- */
  likePost: async (id) => {
    try {
      // optimistic update: increment
      set((state) => ({
        posts: state.posts.map((p) =>
          p.id === id ? { ...p, likes_count: (p.likes_count || 0) + 1, liked_by_me: true } : p
        ),
      }));

      const res = await authFetch(`${API_URL}/${id}/like`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        // revert
        set((state) => ({
          posts: state.posts.map((p) =>
            p.id === id ? { ...p, likes_count: Math.max(0, (p.likes_count || 1) - 1), liked_by_me: false } : p
          ),
        }));
        throw new Error(data.detail || data.error || "Like failed");
      }
      toast.success(data.detail || "Liked");
    } catch (err: any) {
      toast.error(err.message || "Error liking post");
    }
  },

  unlikePost: async (id) => {
    try {
      // optimistic update: decrement
      set((state) => ({
        posts: state.posts.map((p) =>
          p.id === id ? { ...p, likes_count: Math.max(0, (p.likes_count || 1) - 1), liked_by_me: false } : p
        ),
      }));

      const res = await authFetch(`${API_URL}/${id}/unlike`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        // revert (increment)
        set((state) => ({
          posts: state.posts.map((p) =>
            p.id === id ? { ...p, likes_count: (p.likes_count || 0) + 1, liked_by_me: true } : p
          ),
        }));
        throw new Error(data.detail || data.error || "Unlike failed");
      }
      toast.success(data.detail || "Unliked");
    } catch (err: any) {
      toast.error(err.message || "Error unliking post");
    }
  },

  /* ------------------------------
     🔹 Bookmark / Unbookmark
  ------------------------------- */
  bookmarkPost: async (id) => {
    try {
      // optimistic flag
      set((state) => ({
        posts: state.posts.map((p) => (p.id === id ? { ...p, bookmarked_by_me: true } : p)),
      }));

      const res = await authFetch(`${API_URL}/${id}/bookmark`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        set((state) => ({
          posts: state.posts.map((p) => (p.id === id ? { ...p, bookmarked_by_me: false } : p)),
        }));
        throw new Error(data.detail || "Bookmark failed");
      }
      toast.success("Bookmarked");
    } catch (err: any) {
      toast.error(err.message || "Error bookmarking");
    }
  },

  unbookmarkPost: async (id) => {
    try {
      set((state) => ({
        posts: state.posts.map((p) => (p.id === id ? { ...p, bookmarked_by_me: false } : p)),
      }));

      const res = await authFetch(`${API_URL}/${id}/unbookmark`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        set((state) => ({
          posts: state.posts.map((p) => (p.id === id ? { ...p, bookmarked_by_me: true } : p)),
        }));
        throw new Error(data.detail || "Unbookmark failed");
      }
      toast.success("Removed bookmark");
    } catch (err: any) {
      toast.error(err.message || "Error removing bookmark");
    }
  },

  fetchMyBookmarks: async () => {
    try {
      set({ loading: true });
      const res = await authFetch(`${API_URL}/me/bookmarks`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to load bookmarks");
      // Map bookmarks to posts for easier UI use
      const posts = data.map((b: any) => b.post) as Post[];
      set({ posts });
    } catch (err: any) {
      toast.error(err.message || "Error fetching bookmarks");
    } finally {
      set({ loading: false });
    }
  },

  /* ------------------------------
     🔹 Repost / Unrepost / My reposts
  ------------------------------- */
  repost: async (id, message) => {
    try {
      const res = await authFetch(`${API_URL}/${id}/repost`, {
        method: "POST",
        body: JSON.stringify(message ? { message } : {}),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.detail || "Repost failed");
      toast.success("Reposted");
      // Optionally update reposts_count optimistically:
      set((state) => ({
        posts: state.posts.map((p) => (p.id === id ? { ...p, reposts_count: (p.reposts_count || 0) + 1, reposted_by_me: true } : p)),
      }));
    } catch (err: any) {
      toast.error(err.message || "Error reposting");
    }
  },

  unrepost: async (id, repostId) => {
    try {
      const res = await authFetch(`${API_URL}/${id}/repost/${repostId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || "Unrepost failed");
      }
      toast.success("Repost removed");
      set((state) => ({
        posts: state.posts.map((p) => (p.id === id ? { ...p, reposts_count: Math.max(0, (p.reposts_count || 1) - 1), reposted_by_me: false } : p)),
      }));
    } catch (err: any) {
      toast.error(err.message || "Error removing repost");
    }
  },

  fetchMyReposts: async () => {
    try {
      set({ loading: true });
      const res = await authFetch(`${API_URL}/me/reposts`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to load reposts");
      // data is array of { post: {...}, message, created_at }
      const posts = data.map((r: any) => r.post) as Post[];
      set({ posts });
    } catch (err: any) {
      toast.error(err.message || "Error fetching reposts");
    } finally {
      set({ loading: false });
    }
  },

  /* ------------------------------
     🔹 Comments
  ------------------------------- */
  fetchComments: async (postId) => {
    try {
      set({ loading: true });
      const res = await authFetch(`${API_URL}/${postId}/comments`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to load comments");
      set((state) => ({ commentsByPost: { ...state.commentsByPost, [postId]: data } }));
    } catch (err: any) {
      toast.error(err.message || "Error fetching comments");
    } finally {
      set({ loading: false });
    }
  },

  createComment: async (postId, content) => {
    try {
      set({ postLoadingId: postId });
      const res = await authFetch(`${API_URL}/${postId}/comments`, {
        method: "POST",
        body: JSON.stringify({ content }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to post comment");

      // append to cache
      set((state) => {
        const prev = state.commentsByPost[postId] || [];
        return {
          commentsByPost: { ...state.commentsByPost, [postId]: [...prev, data] },
          posts: state.posts.map((p) => (p.id === postId ? { ...p, comments_count: (p.comments_count || 0) + 1 } : p)),
        };
      });

      toast.success("Comment added");
      return data as Comment;
    } catch (err: any) {
      toast.error(err.message || "Error adding comment");
      return null;
    } finally {
      set({ postLoadingId: null });
    }
  },

  likeComment: async (commentId) => {
    try {
      const res = await authFetch(`${API_URL}/comments/${commentId}/like`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.detail || "Like failed");
      toast.success(data.detail || "Comment liked");
    } catch (err: any) {
      toast.error(err.message || "Error liking comment");
    }
  },

  unlikeComment: async (commentId) => {
    try {
      const res = await authFetch(`${API_URL}/comments/${commentId}/unlike`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.detail || "Unlike failed");
      toast.success(data.detail || "Comment unliked");
    } catch (err: any) {
      toast.error(err.message || "Error unliking comment");
    }
  },

  /* ------------------------------
     🔹 Replies
  ------------------------------- */
  fetchReplies: async (postId) => {
    try {
      set({ loading: true });
      const res = await authFetch(`${API_URL}/${postId}/replies`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to load replies");
      set((state) => ({ repliesByPost: { ...state.repliesByPost, [postId]: data } }));
    } catch (err: any) {
      toast.error(err.message || "Error fetching replies");
    } finally {
      set({ loading: false });
    }
  },

  createReply: async (commentId, content) => {
    try {
      set({ postLoadingId: commentId });
      const res = await authFetch(`${API_URL}/replies`, {
        method: "POST",
        body: JSON.stringify({ comment: commentId, content }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to create reply");

      // We don't always know which post this comment belongs to; append to replies caches where comment exists
      set((state) => {
        // append to every repliesByPost where the comment exists (best-effort)
        const newReplies = { ...state.repliesByPost };
        Object.keys(newReplies).forEach((postId) => {
          newReplies[postId] = newReplies[postId] || [];
          // If comment exists in commentsByPost[postId], add reply there
          const comments = state.commentsByPost[postId] || [];
          if (comments.find((c) => c.id === commentId)) {
            newReplies[postId] = [...newReplies[postId], data];
          }
        });
        return { repliesByPost: newReplies };
      });

      toast.success("Reply added");
      return data as Reply;
    } catch (err: any) {
      toast.error(err.message || "Error creating reply");
      return null;
    } finally {
      set({ postLoadingId: null });
    }
  },

  likeReply: async (replyId) => {
    try {
      const res = await authFetch(`${API_URL}/replies/${replyId}/like`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.detail || "Like failed");
      toast.success(data.detail || "Reply liked");
    } catch (err: any) {
      toast.error(err.message || "Error liking reply");
    }
  },

  unlikeReply: async (replyId) => {
    try {
      const res = await authFetch(`${API_URL}/replies/${replyId}/unlike`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.detail || "Unlike failed");
      toast.success(data.detail || "Reply unliked");
    } catch (err: any) {
      toast.error(err.message || "Error unliking reply");
    }
  },

  /* ------------------------------
     🔹 Hashtags
  ------------------------------- */
  fetchTrendingHashtags: async () => {
    try {
      const res = await authFetch(`${API_URL}/hashtags/trending`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed");
      set({ trendingHashtags: data });
    } catch {
      toast.error("Failed to load trending hashtags");
    }
  },

  fetchAllHashtags: async () => {
    try {
      const res = await authFetch(`${API_URL}/hashtags`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed");
      set({ hashtags: data });
    } catch {
      toast.error("Failed to load hashtags");
    }
  },

  /* ------------------------------
     🔹 Socket integration (silent UI updates)
  ------------------------------- */
  connectPostSocket: () => {
    if (!socket) {
      socket = io(SOCKET_URL, {
        transports: ["websocket"],
        withCredentials: true,
      });

      socket.on("connect", () => {
        console.log("✅ Post socket connected:", socket.id);
      });

      // New post created -> prepend
      socket.on("post:created", (post: Post) => {
        set((state) => ({ posts: [post, ...state.posts] }));
      });

      // Post updated -> replace in lists
      socket.on("post:updated", (post: Post) => {
        set((state) => ({
          posts: updatePostInList(state.posts, post),
          myPosts: updatePostInList(state.myPosts, post),
        }));
      });

      // Post deleted -> remove
      socket.on("post:deleted", (data: { id: string }) => {
        set((state) => ({
          posts: state.posts.filter((p) => p.id !== data.id),
          myPosts: state.myPosts.filter((p) => p.id !== data.id),
        }));
      });

      // Likes/unlikes: update counts (silent)
      socket.on("post:liked", (data: { postId: string; likes_count: number }) => {
        set((state) => ({
          posts: state.posts.map((p) =>
            p.id === data.postId ? { ...p, likes_count: data.likes_count } : p
          ),
        }));
      });

      socket.on("post:unliked", (data: { postId: string; likes_count: number }) => {
        set((state) => ({
          posts: state.posts.map((p) =>
            p.id === data.postId ? { ...p, likes_count: data.likes_count } : p
          ),
        }));
      });

      // Bookmark/unbookmark
      socket.on("post:bookmarked", (data: { postId: string }) => {
        set((state) => ({
          posts: state.posts.map((p) => (p.id === data.postId ? { ...p, bookmarked_by_me: true } : p)),
        }));
      });

      socket.on("post:unbookmarked", (data: { postId: string }) => {
        set((state) => ({
          posts: state.posts.map((p) => (p.id === data.postId ? { ...p, bookmarked_by_me: false } : p)),
        }));
      });

      // Repost events (update reposts_count)
      socket.on("post:reposted", (data: { postId: string; reposts_count: number }) => {
        set((state) => ({
          posts: state.posts.map((p) => (p.id === data.postId ? { ...p, reposts_count: data.reposts_count } : p)),
        }));
      });

      socket.on("post:unreposted", (data: { postId: string; reposts_count: number }) => {
        set((state) => ({
          posts: state.posts.map((p) => (p.id === data.postId ? { ...p, reposts_count: data.reposts_count } : p)),
        }));
      });

      // Comments -> update comments_count and append to cache if present
      socket.on("comment:created", (data: { postId: string; comment: Comment }) => {
        set((state) => {
          const prev = state.commentsByPost[data.postId] || [];
          return {
            commentsByPost: { ...state.commentsByPost, [data.postId]: [...prev, data.comment] },
            posts: state.posts.map((p) => (p.id === data.postId ? { ...p, comments_count: (p.comments_count || 0) + 1 } : p)),
          };
        });
      });

      // Comment like/unlike -> (silent) ideally backend sends new likes_count for the comment
      socket.on("comment:liked", (data: { postId: string; commentId: string; likes_count: number }) => {
        set((state) => {
          const comments = (state.commentsByPost[data.postId] || []).map((c) =>
            c.id === data.commentId ? { ...c, likes_count: data.likes_count } : c
          );
          return { commentsByPost: { ...state.commentsByPost, [data.postId]: comments } };
        });
      });

      socket.on("comment:unliked", (data: { postId: string; commentId: string; likes_count: number }) => {
        set((state) => {
          const comments = (state.commentsByPost[data.postId] || []).map((c) =>
            c.id === data.commentId ? { ...c, likes_count: data.likes_count } : c
          );
          return { commentsByPost: { ...state.commentsByPost, [data.postId]: comments } };
        });
      });

      // Reply like/unlike -> update replies cache if present
      socket.on("reply:liked", (data: { postId: string; replyId: string; likes_count: number }) => {
        set((state) => {
          const replies = (state.repliesByPost[data.postId] || []).map((r) =>
            r.id === data.replyId ? { ...r, likes_count: data.likes_count } : r
          );
          return { repliesByPost: { ...state.repliesByPost, [data.postId]: replies } };
        });
      });

      socket.on("reply:unliked", (data: { postId: string; replyId: string; likes_count: number }) => {
        set((state) => {
          const replies = (state.repliesByPost[data.postId] || []).map((r) =>
            r.id === data.replyId ? { ...r, likes_count: data.likes_count } : r
          );
          return { repliesByPost: { ...state.repliesByPost, [data.postId]: replies } };
        });
      });
    }
  },

  disconnectPostSocket: () => {
    if (socket) {
      socket.disconnect();
      socket = null;
      console.log("🔌 Post socket disconnected");
    }
  },
}));
