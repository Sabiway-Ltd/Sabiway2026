// app/services/profile.ts

import { api } from "./api";

export const profile = {
  // Get all profiles
  getAll: () => api.get("/profiles/"),

  // Get current user's profile
  getMe: () => api.get("/profiles/me/"),

  // Get a profile by user_id
  getById: (userId: number) => api.get(`/profiles/${userId}/`),

  // Full update (PUT)
  update: (userId: number, data: any) => api.put(`/profiles/${userId}/`, data),

  // Partial update (PATCH)
  patch: (userId: number, data: any) => api.patch(`/profiles/${userId}/`, data),

  // Delete profile
  delete: (userId: number) => api.delete(`/profiles/${userId}/`),

  // Follow / Unfollow
  follow: (userId: number) => api.post(`/profiles/${userId}/follow/`),
  unfollow: (userId: number) => api.post(`/profiles/${userId}/unfollow/`),

  // Followers / Following
  getFollowers: (userId: number) => api.get(`/profiles/${userId}/followers/`),
  getFollowing: (userId: number) => api.get(`/profiles/${userId}/following/`),

  // Top contributors
  getTopContributors: () => api.get("/profiles/contributors/top/"),
};
