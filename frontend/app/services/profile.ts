// app/services/profile.ts

import { api } from "./api";

export const profile = {
  // Get all profiles
  getAll: () => api.get("/profiles/"),

  // Get current user's profile
  getMe: () => api.get("/profiles/me/"),

  // Get a profile by user_id
  getById: (userId: number) => api.get(`/profiles/${userId}/`),
  getByUsername: (username: string) => api.get(`/profiles/${username}/`),
  getNotFollowed: () => api.get("/profiles/not_followed/"),

  // Full update (PUT)
  update: (userId: number, data: any) => api.put(`/profiles/${userId}/`, data),

  // Partial update (PATCH) with optional config
  patch: (userId: number, data: any, config?: object) => {
    return api.patch(`/profiles/${userId}/`, data, config);
  },

  // Delete profile
  delete: (userId: number) => api.delete(`/profiles/${userId}/`),

  // Follow / Unfollow
  follow: (userId: number) => api.post(`/profiles/${userId}/follow/`),
  unfollow: (userId: number) => api.post(`/profiles/${userId}/unfollow/`),

  // Followers / Following
  getFollowers: (userId: number) => api.get(`/profiles/${userId}/followers/`),
  getFollowing: (userId: number) => api.get(`/profiles/${userId}/following/`),
  getMyFollowing: () => api.get("/profiles/me/following/"),
  
  // Current user's followers
  getMyFollowers: () => api.get("/profiles/me/followers/"),

  // Top contributors
  getTopContributors: () => api.get("/profiles/contributors/top/"),
};