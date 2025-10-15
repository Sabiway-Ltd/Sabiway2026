// services/djangoPost.service.js
const axiosClient = require("../utils/axiosClient");
const FormData = require("form-data");
const fs = require("fs");

const base = "/posts";

const djangoPostService = {
  // list posts (optional query params: page, q, author, etc.)
  async listPosts(token, params = {}) {
    const res = await axiosClient.get(`${base}/`, {
      params,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    return res.data;
  },

  // async createPost(token, data, files) {
  //   // If you handle files, you may send form-data from frontend; here we assume JSON body
  //   const res = await axiosClient.post(`${base}/`, data, {
  //     headers: token ? { Authorization: `Bearer ${token}` } : {},
  //   });
  //   return res.data;
  // },

   async createPost(token, data, file) {
    const FormData = require("form-data");
    
    const form = new FormData();
    form.append("content", data.content);

    if (file) {
      // multer memory storage
      form.append("image", file.buffer, { filename: file.originalname });
    }

    const res = await axiosClient.post(`/posts/`, form, {
      headers: {
        ...form.getHeaders(),
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });

    return res.data;
  },

  async getPostById(token, id) {
    const res = await axiosClient.get(`${base}/${id}/`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    return res.data;
  },

  async updatePost(token, id, data) {
    const res = await axiosClient.put(`${base}/${id}/`, data, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    return res.data;
  },

  async deletePost(token, id) {
    const res = await axiosClient.delete(`${base}/${id}/`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    return res.data;
  },

  async likePost(token, id) {
    const res = await axiosClient.post(`${base}/${id}/like/`, {}, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    return res.data;
  },

  async unlikePost(token, id) {
    const res = await axiosClient.post(`${base}/${id}/unlike/`, {}, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    return res.data;
  },

  async getCommentsForPost(token, id) {
    const res = await axiosClient.get(`${base}/${id}/comments/`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    return res.data;
  },

  async createCommentForPost(token, id, data) {
    // Django expects "post" id in payload; your controller already passes by param mapping
    // We'll send { content: "...", post: id } if needed — but Django's view accepts post param.
    const res = await axiosClient.post(`${base}/${id}/comments/`, data, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    return res.data;
  },

  async listRepliesForPost(token, id) {
    const res = await axiosClient.get(`${base}/${id}/replies/`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    return res.data;
  },

  // Comment like/unlike (comment id)
  async likeComment(token, commentId) {
    const res = await axiosClient.post(`${base}/comments/${commentId}/like/`, {}, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    return res.data;
  },

  async unlikeComment(token, commentId) {
    const res = await axiosClient.post(`${base}/comments/${commentId}/unlike/`, {}, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    return res.data;
  },

  // Reply like/unlike
  async likeReply(token, replyId) {
    const res = await axiosClient.post(`${base}/replies/${replyId}/like/`, {}, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    return res.data;
  },

  async unlikeReply(token, replyId) {
    const res = await axiosClient.post(`${base}/replies/${replyId}/unlike/`, {}, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    return res.data;
  },

  // Bookmarks
  async bookmarkPost(token, id) {
    const res = await axiosClient.post(`${base}/${id}/bookmark/`, {}, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    return res.data;
  },

  async unbookmarkPost(token, id) {
    const res = await axiosClient.post(`${base}/${id}/unbookmark/`, {}, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    return res.data;
  },

  async myBookmarks(token) {
    const res = await axiosClient.get(`${base}/me/bookmarks/`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    return res.data;
  },

  // Reposts
  async repost(token, id, data = {}) {
    const res = await axiosClient.post(`${base}/${id}/repost/`, data, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    return res.data;
  },

  async unrepost(token, id, repost_id) {
    const res = await axiosClient.delete(`${base}/${id}/repost/${repost_id}/`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    return res.data;
  },

  async myReposts(token) {
    const res = await axiosClient.get(`${base}/me/reposts/`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    return res.data;
  },

  async trendingHashtags(token) {
    const res = await axiosClient.get(`${base}/hashtags/trending/`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    return res.data;
  },

  async listHashtags(token) {
    const res = await axiosClient.get(`${base}/hashtags/`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    return res.data;
  },

  async myPosts(token) {
    const res = await axiosClient.get(`${base}/me/`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    return res.data;
  },
};

module.exports = djangoPostService;
