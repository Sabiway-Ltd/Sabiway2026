// app/store/useProfileStore.ts

"use client";

import { create } from "zustand";
import { profile } from "../services/profile";

type Profile = {
  user_id: number;
  username: string;
  full_name: string;
  email: string;
  followers_count: number;
  following_count: number;
  posts_count: number;
  whatsapp_number?: string;
};

type ProfileState = {
  profile: Profile | null;
  profiles: Profile[];
  loading: boolean;
  error: string | null;
  topContributors: Profile[];

  getMyProfile: () => Promise<void>;
  updateProfile: (userId: number, data: Partial<Profile>) => Promise<void>;
  getAllProfiles: () => Promise<void>;
  getTopContributors: () => Promise<void>; 
};

export const useProfileStore = create<ProfileState>((set) => ({
  profile: null,
  profiles: [],
  loading: false,
  error: null,
  topContributors: [],

  // ✅ Get current user's profile
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

  // ✅ Update user profile
  updateProfile: async (userId, data) => {
    set({ loading: true, error: null });
    try {
      const res = await profile.patch(userId, data);
      set({ profile: res.data, loading: false });
    } catch (err: any) {
      console.error("Profile update error:", err.response?.data || err.message);
      set({
        error: err.response?.data?.detail || "Failed to update profile",
        loading: false,
      });
    }
  },

  // ✅ Get all profiles
  getAllProfiles: async () => {
    set({ loading: true, error: null });
    try {
      const res = await profile.getAll();
      set({ profiles: res.data, loading: false });
    } catch (err: any) {
      console.error("Get all profiles error:", err.response?.data || err.message);
      set({
        error: err.response?.data?.detail || "Failed to load profiles",
        loading: false,
      });
    }
  },


  // Top Contributor
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
}));
