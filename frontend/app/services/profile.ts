// app/services/profile.ts

import { api } from "./api";

function sanitiseProfileUpdate(data: any) {
  if (typeof FormData !== "undefined" && data instanceof FormData) {
    data.delete("role");
    return data;
  }

  if (data && typeof data === "object" && !Array.isArray(data)) {
    const { role: _ignoredRole, ...safeData } = data;
    return safeData;
  }

  return data;
}

export const profile = {
  // Get all profiles
  getAll: () => api.get("/profiles/"),

  // Get current user's profile
  getMe: () => api.get("/profiles/me/"),

  // Get a profile by user_id
  getById: (userId: number) => api.get(`/profiles/${userId}/`),
  getByUsername: (username: string) => api.get(`/profiles/${username}/`),
  getNotFollowed: () => api.get("/profiles/not_followed/"),

  // Full update (PUT). Account role is never a profile-editable field.
  update: (userId: number, data: any) => api.put(`/profiles/${userId}/`, sanitiseProfileUpdate(data)),

  // Partial update (PATCH) with optional config.
  patch: (userId: number, data: any, config?: object) => {
    return api.patch(`/profiles/${userId}/`, sanitiseProfileUpdate(data), config);
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