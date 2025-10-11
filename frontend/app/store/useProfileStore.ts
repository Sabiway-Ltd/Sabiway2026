// app/store/useProfileStore.ts
"use client";

import { create } from "zustand";
import { profile } from "../services/profile";

export type Profile = {
  user_id: number;
  username: string;
  full_name: string;
  email: string;
  followers_count: number;
  following_count: number;
  posts_count: number;
  whatsapp_number?: string;
  profile_picture?: string; 
};

type ProfileState = {
  profile: Profile | null;
  profiles: Profile[];
  loading: boolean;
  error: string | null;
  topContributors: Profile[];

  followingStatus: Record<number, boolean>;
  setFollowingStatus: (userId: number, status: boolean) => void;
  toggleFollow: (userId: number) => Promise<void>;

  myFollowers: Profile[];
  myFollowing: Profile[];
  fetchMyFollowers: () => Promise<void>;
  fetchMyFollowing: () => Promise<void>;

  getMyProfile: () => Promise<void>;
  updateProfile: (userId: number, data: Partial<Profile> | FormData) => Promise<Profile>; // ✅ fixed
  getAllProfiles: () => Promise<void>;
  getTopContributors: () => Promise<void>;
};



export const useProfileStore = create<ProfileState>((set, get) => ({
  profile: null,
  profiles: [],
  loading: false,
  error: null,
  topContributors: [],
  followingStatus: {},
  myFollowers: [],
  myFollowing: [],

  // Follow map management
  setFollowingStatus: (userId, status) =>
    set((state) => ({
      followingStatus: { ...state.followingStatus, [userId]: status },
    })),

  toggleFollow: async (userId) => {
    const isFollowing = get().followingStatus[userId] || false;
    try {
      if (isFollowing) await profile.unfollow(userId);
      else await profile.follow(userId);
      get().setFollowingStatus(userId, !isFollowing);

      // ✅ Update myFollowing list automatically
      const updatedFollowing = isFollowing
        ? get().myFollowing.filter((p) => p.user_id !== userId)
        : [...get().myFollowing, get().profiles.find((p) => p.user_id === userId)!];
      set({ myFollowing: updatedFollowing });
    } catch (err) {
      console.error("Follow toggle error:", err);
      throw err;
    }
  },

  // Fetch current user's profile
  getMyProfile: async () => {
    set({ loading: true, error: null });
    try {
      const res = await profile.getMe();
      set({ profile: res.data, loading: false });
    } catch (err: any) {
      console.error("Profile fetch error:", err.response?.data || err.message);
      set({
        error: err.response?.data?.detail || "Failed to fetch profile",
        loading: false,
      });
    }
  },

  // Fetch all profiles + initialize followingStatus
  getAllProfiles: async () => {
    set({ loading: true, error: null });
    try {
      const res = await profile.getAll();
      set({ profiles: res.data, loading: false });

      const map: Record<number, boolean> = {};
      res.data.forEach((p: any) => {
        map[p.user_id] = p.is_following || false;
      });
      set({ followingStatus: map });
    } catch (err: any) {
      console.error("Get all profiles error:", err.response?.data || err.message);
      set({
        error: err.response?.data?.detail || "Failed to load profiles",
        loading: false,
      });
    }
  },

  // Fetch top contributors
  getTopContributors: async () => {
    set({ loading: true, error: null });
    try {
      const res = await profile.getTopContributors();
      set({ topContributors: res.data, loading: false });
    } catch (err: any) {
      console.error("Get top contributors error:", err.response?.data || err.message);
      set({
        error: err.response?.data?.detail || "Failed to load top contributors",
        loading: false,
      });
    }
  },

  // ✅ Fetch current user's following
  fetchMyFollowing: async () => {
    try {
      const res = await profile.getMyFollowing();
      set({ myFollowing: res.data });

      // Update followingStatus map
      const status: Record<number, boolean> = {};
      res.data.forEach((p: any) => {
        status[p.user_id] = true;
      });
      set({ followingStatus: status });
    } catch (err) {
      console.error("Failed to fetch my following", err);
    }
  },

  // ✅ Fetch current user's followers
  fetchMyFollowers: async () => {
    try {
      const res = await profile.getMyFollowers();
      set({ myFollowers: res.data });
    } catch (err) {
      console.error("Failed to fetch my followers", err);
    }
  },

  updateProfile: async (userId, data) => {
    set({ loading: true, error: null });
    try {
      let res;
      if (data instanceof FormData) {
        res = await profile.patch(userId, data, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        res = await profile.patch(userId, data);
      }
      set({ profile: res.data, loading: false });
      return res.data;
    } catch (err: any) {
      console.error("Profile update error:", err.response?.data || err.message);
      set({
        error: err.response?.data?.detail || "Failed to update profile",
        loading: false,
      });
      throw err;
    }
  },
}));

