// app/store/usePostStore.ts

"use client";

import { create } from "zustand";
import axios from "axios";
import toast from "react-hot-toast";
import { DJANGO_URL } from "../utils/MyConstants";
import { post } from "../services/post";
import { DEFAULT_PROFILE_PICTURE } from "../helper";


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

export type PostState = {
  posts: Post[];
  currentPost: Post | null;
  commentsByPost: Record<string, Comment[]>;
  repliesByComment: Record<string, Reply[]>;
  nestedReplies: Record<string, Reply[]>;
  loading: boolean;
  loadingHashtag: boolean;
  error: string | null;
  trendingHashtags: Hashtag[];
  filteredPosts: Post[] | null;
  filteredProfiles: Author[] | null;
  filteredHashtags: Hashtag[] | null;
  activeHashtag: string | null;
  activeSearch: string | null;

  nextPage: number | null;
  hasMore: boolean;
  userPosts: Post[];
  userNextPage: number | null;
  userHasMore: boolean;
  myPosts: Post[];
  loadingMyPosts: boolean;
  myPostsError: string | null;
  nextMyPostsPage: number | null;
  hasMoreMyPosts: boolean;
  myReposts: Post[];

  bookmarks: Post[];
  loadingBookmarks: boolean;
  bookmarksError: string | null;
  nextBookmarksPage: number | null;
  hasMoreBookmarks: boolean;
  refreshFeed: boolean;
  refreshBookmarks: boolean;

  set: (partial: Partial<PostState>) => void;
  triggerRefresh: () => void;
  consumeRefresh: () => void;
  triggerBookmarksRefresh: () => void;
  consumeBookmarksRefresh: () => void;
  getAllPosts: (page?: number) => Promise<unknown>;
  getPostsByUsername: (username: string, page?: number) => Promise<unknown>;
  resetUserPosts: () => void;
  getMyPosts: (page?: number) => Promise<unknown>;
  resetMyPosts: () => void;
  getBookmarks: (page?: number) => Promise<unknown>;
  createPost: (data: FormData | object) => Promise<unknown>;
  getPostById: (id: string) => Promise<Post | null>;
  likePost: (id: string) => Promise<unknown>;
  unlikePost: (id: string) => Promise<unknown>;
  bookmarkPost: (id: string) => Promise<unknown>;
  unbookmarkPost: (id: string) => Promise<unknown>;
  addComment: (postId: string, content: string, imageFile?: File) => Promise<unknown>;
  getComments: (postId: string) => Promise<unknown>;
  addReply: (commentId: string, content: string, imageFile?: File) => Promise<unknown>;
  getReplies: (postId: string) => Promise<unknown>;
  getRepliesByComment: (commentId: string) => Promise<unknown>;
  getNestedReplies: (parentReplyId: string) => Promise<unknown>;
  addNestedReply: (parentReplyId: string, content: string, imageFile?: File) => Promise<unknown>;
  filterBySearch: (query: string, type?: "posts" | "profiles" | "hashtags") => Promise<unknown>;
  resetFilteredResults: () => void;
  updateComment: (commentId: string, content: string, postId: string, imageFile?: File) => Promise<unknown>;
  deleteComment: (commentId: string, postId: string) => Promise<unknown>;
  updateReply: (replyId: string, content: string, imageFile?: File) => Promise<unknown>;
  deleteReply: (replyId: string, commentId: string) => Promise<unknown>;
  repostPost: (id: string) => Promise<unknown>;
  unrepostPost: (id: string) => Promise<unknown>;
  getMyReposts: () => Promise<Post[]>;
  likeComment: (commentId: string) => Promise<unknown>;
  unlikeComment: (commentId: string) => Promise<unknown>;
  likeReply: (replyId: string) => Promise<unknown>;
  unlikeReply: (replyId: string) => Promise<unknown>;
  getTrendingHashtags: () => Promise<unknown>;
  filterPostsByHashtag: (tag: string) => Promise<unknown>;
  resetFilteredPosts: () => void;
};

// ---------- API ----------
const API_URL = `${DJANGO_URL}/api`;



// ---------- Store ----------
export const usePostStore = create<PostState>((set, get) => ({
  posts: [],
  currentPost: null,
  commentsByPost: {},
  repliesByComment: {},
  nestedReplies: {},
  loading: false,
  loadingHashtag: false,
  error: null,
  trendingHashtags: [],
  filteredPosts: [],
  filteredProfiles: [],
  filteredHashtags: [],
  activeHashtag: null,
  activeSearch: null,
  nextPage: 1,
  hasMore: true,
  userPosts: [],
  userNextPage: 1,
  userHasMore: true,
  myPosts: [],
  loadingMyPosts: false,
  myPostsError: null,
  nextMyPostsPage: 1,
  hasMoreMyPosts: true,
  myReposts: [],

  bookmarks: [],
  loadingBookmarks: false,
  bookmarksError: null,
  nextBookmarksPage: 1,
  hasMoreBookmarks: true,
    

  refreshFeed: false,
  refreshBookmarks: false,
  triggerRefresh: () => set({ refreshFeed: true }),
  consumeRefresh: () => set({ refreshFeed: false }),
  triggerBookmarksRefresh: () => set({ refreshBookmarks: true }),
  consumeBookmarksRefresh: () => set({ refreshBookmarks: false }),

  set: (partial) => set((state) => ({ ...state, ...partial })),


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
      console.log(res.data)

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
    const { loadingMyPosts, nextMyPostsPage } = get();

    // Prevent double fetch
    if (loadingMyPosts || (page !== nextMyPostsPage && page !== 1)) return;

    set({ loadingMyPosts: true, myPostsError: null });

    const token = localStorage.getItem("access");
    if (!token) return set({ myPostsError: "Not logged in", loadingMyPosts: false });

    try {
      const res = await axios.get(`${DJANGO_URL}/api/posts/me/?page=${page}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("My Posts:", res.data);

      const newPosts = res.data.results || res.data;

      set((state) => ({
        myPosts: page === 1 ? newPosts : [...state.myPosts, ...newPosts],
        nextMyPostsPage: res.data.next ? page + 1 : null,
        hasMoreMyPosts: !!res.data.next,
        loadingMyPosts: false,
      }));
    } catch (err) {
      console.error("Get my posts error:", err);
      set({ myPostsError: "Failed to fetch my posts", loadingMyPosts: false });
    }
  },


  getBookmarks: async (page = 1) => {
    const { loadingBookmarks, nextBookmarksPage } = get();

    // Prevent duplicate loads
    if (loadingBookmarks || (page !== nextBookmarksPage && page !== 1)) return;

    set({ loadingBookmarks: true, bookmarksError: null });

    const token = localStorage.getItem("access");
    if (!token) return set({ bookmarksError: "Not logged in", loadingBookmarks: false });

    try {
      const res = await axios.get(`${DJANGO_URL}/api/posts/me/bookmarks/?page=${page}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("Bookmarks:", res.data);

      const newBookmarks = res.data.results || res.data;

      set((state) => ({
        bookmarks: page === 1 ? newBookmarks : [...state.bookmarks, ...newBookmarks],
        nextBookmarksPage: res.data.next ? page + 1 : null,
        hasMoreBookmarks: !!res.data.next,
        loadingBookmarks: false,
      }));
    } catch (err) {
      console.error("Get bookmarks error:", err);
      set({ bookmarksError: "Failed to fetch bookmarks", loadingBookmarks: false });
    }
  },




  // ✅ --- Optional: Reset my posts (for profile refresh) ---
  resetMyPosts: () => set({ myPosts: [], nextMyPostsPage: 1, hasMoreMyPosts: true }),


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
            DEFAULT_PROFILE_PICTURE,
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
        `${API_URL}/posts/${postId}/comments/`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      // toast.success("Comment added!");
    } catch (err) {
      console.error("Add comment error:", err);
      toast.error("Failed to add comment.");
    }
  },




  getComments: async (postId: string) => {
    const token = localStorage.getItem("access");
    if (!token) return set({ error: "Not logged in" });

    try {
      const res = await axios.get<Comment[]>(
        `${API_URL}/posts/${postId}/comments/`,
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

    // toast.success("Reply added!");
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
        `${API_URL}/posts/${postId}/replies/`,
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

      if (!res.ok) throw new Error(`Failed to fetch replies: ${res.statusText}`);
      const data = await res.json();

      const topLevelReplies = data.filter((reply) => reply.parent_reply_id === null);

      // ✅ Replace instead of merge
      set((state) => ({
        repliesByComment: {
          ...state.repliesByComment,
          [commentId]: topLevelReplies,
        },
      }));
    } catch (err) {
      console.error("Get replies by comment error:", err);
      toast.error("Failed to load replies");
    }
  },



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

  addNestedReply: async (parentReplyId, content, imageFile) => {
  const token = localStorage.getItem("access");
  if (!token) return toast.error("Not logged in");

  try {
    const formData = new FormData();
    formData.append("content", content);
    formData.append("parent_reply", parentReplyId);
    if (imageFile) formData.append("image", imageFile);

    const res = await axios.post(`${DJANGO_URL}/api/posts/replies/`, formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "multipart/form-data",
      },
    });

    // ✅ Place nested reply below its parent
    set((state) => {
      const commentId = Object.keys(state.repliesByComment).find((cid) =>
        (state.repliesByComment[cid] || []).some(
          (r) => r.id === parentReplyId
        )
      );

      if (!commentId) return state;

      const updatedReplies = (state.repliesByComment[commentId] || []).flatMap(
        (r) => (r.id === parentReplyId ? [r, res.data] : [r])
      );

      return {
        repliesByComment: {
          ...state.repliesByComment,
          [commentId]: updatedReplies,
        },
      };
    });

    // toast.success("Reply added!");
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


    // UPDATE AND DELETE COMMENTS, REPLIES AND NESTED REPLIES
    // ✏️ Update a comment
    updateComment: async (commentId: string, content: string, postId: string, imageFile?: File) => {
      const token = localStorage.getItem("access");
      if (!token) return toast.error("Not logged in");

      try {
        let dataToSend: any;
        let contentType: string;

        if (imageFile) {
          const formData = new FormData();
          formData.append("content", content);
          formData.append("post", postId);
          formData.append("image", imageFile);
          dataToSend = formData;
          contentType = "multipart/form-data";
        } else {
          dataToSend = { content, post: postId };
          contentType = "application/json";
        }

        const res = await axios.put(
          `${DJANGO_URL}/api/posts/comments/${commentId}/`,
          dataToSend,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": contentType,
            },
          }
        );

        // ✅ Update local state
        set((state) => ({
          commentsByPost: Object.fromEntries(
            Object.entries(state.commentsByPost).map(([pid, comments]) => [
              pid,
              comments.map((c) => (c.id === commentId ? res.data : c)),
            ])
          ),
        }));

        // toast.success("Comment updated!");
      } catch (err) {
        console.error("Update comment error:", err);
        toast.error("Failed to update comment.");
      }
    },


    // 🗑️ Delete a comment
    deleteComment: async (commentId: string) => {
      const token = localStorage.getItem("access");
      if (!token) return toast.error("Not logged in");

      try {
        await axios.delete(`${DJANGO_URL}/api/posts/comments/${commentId}/`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        set((state) => ({
          commentsByPost: Object.fromEntries(
            Object.entries(state.commentsByPost).map(([postId, comments]) => [
              postId,
              comments.filter((c) => c.id !== commentId),
            ])
          ),
        }));

        // toast.success("Comment deleted!");
      } catch (err) {
        console.error("Delete comment error:", err);
        toast.error("Failed to delete comment.");
      }
    },



    // ✏️ Update a reply
    updateReply: async (replyId: string, content: string, commentId: string, imageFile?: File) => {
      const token = localStorage.getItem("access");
      if (!token) return toast.error("Not logged in");

      try {
        let dataToSend: any;
        let contentType: string;

        if (imageFile) {
          const formData = new FormData();
          formData.append("content", content);
          formData.append("comment", commentId);
          formData.append("image", imageFile);
          dataToSend = formData;
          contentType = "multipart/form-data";
        } else {
          dataToSend = { content, comment: commentId };
          contentType = "application/json";
        }


        const res = await axios.put(
          `${DJANGO_URL}/api/posts/replies/${replyId}/`,
          dataToSend,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": contentType,
            },
          }
        );

        set((state) => ({
          repliesByComment: Object.fromEntries(
            Object.entries(state.repliesByComment).map(([cId, replies]) => [
              cId,
              replies.map((r) => (r.id === replyId ? res.data : r)),
            ])
          ),
        }));

        // toast.success("Reply updated!");
      } catch (err) {
        console.error("Update reply error:", err);
        toast.error("Failed to update reply.");
      }
    },

    // 🗑️ Delete a reply
    deleteReply: async (replyId: string) => {
      const token = localStorage.getItem("access");
      if (!token) return toast.error("Not logged in");

      try {
        await axios.delete(`${DJANGO_URL}/api/posts/replies/${replyId}/`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        set((state) => ({
          repliesByComment: Object.fromEntries(
            Object.entries(state.repliesByComment).map(([commentId, replies]) => [
              commentId,
              replies.filter((r) => r.id !== replyId),
            ])
          ),
        }));

        // toast.success("Reply deleted!");
      } catch (err) {
        console.error("Delete reply error:", err);
        toast.error("Failed to delete reply.");
      }
    },







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

      // ✅ Update local state immediately for responsiveness
      set((state) => ({
        posts: state.posts.map((p) =>
          p.id === id
            ? { ...p, reposts_count: (p.reposts_count || 0) + 1 }
            : p
        ),
      }));

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

      const res = await axios.delete(`${DJANGO_URL}/api/posts/${id}/unrepost/`, {
        headers,
      });

      const result = res.data;

      // Update repost count locally for instant UI feedback
      set((state) => ({
        posts: state.posts.map((p) =>
          p.id === id
            ? { ...p, reposts_count: Math.max((p.reposts_count || 1) - 1, 0) }
            : p
        ),
      }));

      toast.success("Repost removed!");

    } catch (err: any) {
      console.error("Unrepost error:", err);
      toast.error("Failed to remove repost.");
    }
  },

  getMyReposts: async () => {
    try {
      const token = localStorage.getItem("access");
      if (!token) return [];

      const res = await axios.get(`${API_URL}/posts/me/reposts/`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Flatten to original posts if needed
      const formattedReposts = res.data.map((r: any) => r.original_post ?? r);

      // Store in the global state
      set({ myReposts: formattedReposts });

      return formattedReposts; // ✅ return for immediate use if needed
    } catch (err) {
      console.error("Failed to fetch my reposts:", err);
      return [];
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



