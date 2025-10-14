// services/djangoProfile.service.js
const axiosClient = require("../utils/axiosClient");

const djangoProfileService = {
  /* ================================================
     🧑‍🤝‍🧑 Profiles
     ================================================= */
  async getAllProfiles(token) {
    const res = await axiosClient.get("/profiles/", {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  },

  async getTopContributors(token) {
    const res = await axiosClient.get("/profiles/contributors/top/", {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  },

  /* ================================================
     👤 Current User
     ================================================= */
  async getMyProfile(token) {
    const res = await axiosClient.get("/profiles/me/", {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  },

  async updateProfile(token, data) {
    const res = await axiosClient.put("/profiles/me/", data, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  },

  async partialUpdateProfile(token, data) {
    const res = await axiosClient.patch("/profiles/me/", data, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  },

  async deleteMyProfile(token) {
    const res = await axiosClient.delete("/profiles/me/", {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  },

  async getMyFollowers(token) {
    const res = await axiosClient.get("/profiles/me/followers/", {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  },

  async getMyFollowing(token) {
    const res = await axiosClient.get("/profiles/me/following/", {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  },

  /* ================================================
     👥 Profile by User ID
     ================================================= */
  async getProfileById(token, userId) {
    const res = await axiosClient.get(`/profiles/${userId}/`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  },

  async updateProfileById(token, userId, data) {
    const res = await axiosClient.put(`/profiles/${userId}/`, data, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  },

  async partialUpdateProfileById(token, userId, data) {
    const res = await axiosClient.patch(`/profiles/${userId}/`, data, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  },

  async deleteProfileById(token, userId) {
    const res = await axiosClient.delete(`/profiles/${userId}/`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  },

  /* ================================================
     🤝 Follow / Unfollow
     ================================================= */
  async followUser(token, userId) {
    const res = await axiosClient.post(
      `/profiles/${userId}/follow/`,
      {},
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return res.data;
  },

  async unfollowUser(token, userId) {
    const res = await axiosClient.post(
      `/profiles/${userId}/unfollow/`,
      {},
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return res.data;
  },

  /* ================================================
     📊 Followers / Following
     ================================================= */
  async getFollowers(token, userId) {
    const res = await axiosClient.get(`/profiles/${userId}/followers/`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  },

  async getFollowing(token, userId) {
    const res = await axiosClient.get(`/profiles/${userId}/following/`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  },
};

module.exports = djangoProfileService;
