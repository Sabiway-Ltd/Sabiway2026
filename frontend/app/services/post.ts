// app/services/post.ts

import { api } from "./api";

export const post = {
  // 🧩 POSTS CRUD
  getAll: (page: number = 1) => api.get(`/posts/?page=${page}`),
  getById: (id: string) => api.get(`/posts/${id}/`),
  getByMe: () => api.get(`/posts/me/`),
  create: (data: FormData | object) => api.post("/posts/", data, {
    headers: data instanceof FormData ? { "Content-Type": "multipart/form-data" } : undefined,
  }),
  update: (id: string, data: FormData | object) =>
    api.put(`/posts/${id}/`, data, {
      headers: data instanceof FormData
        ? { "Content-Type": "multipart/form-data" }
        : undefined,
    }),

  patch: (id: string, data: Partial<any>) => api.patch(`/posts/${id}/`, data),
  delete: (id: string) => api.delete(`/posts/${id}/`),

  // ❤️ LIKES
  like: (id: string) => api.post(`/posts/${id}/like/`),
  unlike: (id: string) => api.post(`/posts/${id}/unlike/`),
  createLike: (data: { post: string }) => api.post(`/posts/likes/`, data),

  
 // 🔖 BOOKMARKS
  bookmark: (id: string) => api.post(`/posts/${id}/bookmark/`),
  unbookmark: (id: string) => api.delete(`/posts/${id}/unbookmark/`),
  getMyBookmarks: () => api.get(`/posts/me/bookmarks/`),


  // 🔁 REPOSTS
  repost: (id: string, data?: { message?: string }) => api.post(`/posts/${id}/repost/`, data),
  removeRepost: (id: string, repostId: string) => api.delete(`/posts/${id}/repost/${repostId}/`),
  getMyReposts: () => api.get(`/posts/me/reposts/`),

  // 🏷️ HASHTAGS
  getTrendingHashtags: () => api.get(`/posts/hashtags/trending/`),
  getAllHashtags: () => api.get(`/posts/hashtags/`),
  getHashtagById: (id: number) => api.get(`/posts/hashtags/${id}/`),

  // 💬 COMMENTS
  getComments: async (postId: string) => {
    const response = await api.get(`/posts/${postId}/comments/`);
    return response.data; // ✅ returns array directly
  },
  addComment: (postId: string, data: { content: string }) =>
    api.post(`/posts/${postId}/comments/`, data),

  // 💭 REPLIES
  getReplies: (postId: string) => api.get(`/posts/${postId}/replies/`),
  addReply: (data: { comment: string; content: string }) =>
    api.post(`/posts/replies/`, data),

  // 💬 COMMENT LIKES
  likeComment: (commentId: string) => api.post(`/posts/comments/${commentId}/like/`),
  unlikeComment: (commentId: string) => api.post(`/posts/comments/${commentId}/unlike/`),

  // 💭 REPLY LIKES
  likeReply: (replyId: string) => api.post(`/posts/replies/${replyId}/like/`),
  unlikeReply: (replyId: string) => api.post(`/posts/replies/${replyId}/unlike/`),

  // 💭 Fetch replies for a specific comment
  getRepliesByComment: (commentId: string) =>
    api.get(`/posts/comments/${commentId}/replies/`),

   // 🔍 SEARCH
  search: (q: string, type: "posts" | "profiles" | "hashtags" = "posts") =>
    api.get(`/search/?q=${encodeURIComponent(q)}&type=${type}`),
};