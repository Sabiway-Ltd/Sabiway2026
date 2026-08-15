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
  phone_number?: string;
  profile_picture?: string;
  bio?: string;
  role?: string;
  job?: string;
  country?: string;
  state?: string;
  area?: string;
  street?: string;
  is_following?: boolean;
};

type ProfileState = {
  profile: Profile | null;
  profiles: Profile[];
  loading: boolean;
  otherProfile: Profile | null;
  error: string | null;
  topContributors: Profile[];
  notFollowedProfiles: Profile[];

  followingStatus: Record<number, boolean>;
  setFollowingStatus: (userId: number, status: boolean) => void;
  toggleFollow: (userId: number) => Promise<void>;

  myFollowers: Profile[];
  myFollowing: Profile[];
  fetchMyFollowers: () => Promise<void>;
  fetchMyFollowing: () => Promise<void>;

  getMyProfile: () => Promise<void>;
  getProfileById: (userId: number) => Promise<void>;
  getProfileByUsername: (username: string) => Promise<void>;
  getNotFollowedProfiles: () => Promise<void>;
  updateProfile: (userId: number, data: Partial<Profile> | FormData) => Promise<Profile>; // ✅ fixed
  getAllProfiles: () => Promise<void>;
  getTopContributors: () => Promise<void>;
};



export const useProfileStore = create<ProfileState>((set, get) => ({
  profile: null,
  profiles: [],
  loading: false,
  otherProfile: null,
  error: null,
  topContributors: [],
  notFollowedProfiles: [],
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
      const profiles = get().profiles || [];

      const userToAdd = profiles.find((p) => p.user_id === userId);

      const updatedFollowing = isFollowing
        ? get().myFollowing.filter((p) => p.user_id !== userId)
        : userToAdd
        ? [...get().myFollowing, userToAdd]
        : get().myFollowing; // no match, keep as is

      set({ myFollowing: updatedFollowing });
      
    } catch (err: any) {
      console.error("Follow toggle error:", err);
      console.error("Follow error:", err.response?.data || err.message);
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

  // ✅ Get profile by user ID
  getProfileById: async (userId: number) => {
    set({ loading: true, error: null });
    try {
      const res = await profile.getById(userId);
      set({ otherProfile: res.data, loading: false });
    } catch (err: any) {
      console.error("Profile by ID fetch error:", err.response?.data || err.message);
      set({
        error: err.response?.data?.detail || "Failed to fetch profile by ID",
        loading: false,
      });
    }
  },

  // ✅ Get profile by username (e.g., "adesina_olagunju")
 getProfileByUsername: async (username: string) => {
  set({ loading: true, error: null });
  try {
    const res = await profile.getByUsername(username);

    set((state) => ({
      otherProfile: res.data,
      loading: false,
      followingStatus: {
        ...state.followingStatus,
        [res.data.user_id]: res.data.is_following,
      },
    }));
  } catch (err: any) {
    console.error("Profile by username fetch error:", err.response?.data || err.message);
    set({
      error: err.response?.data?.detail || "Failed to fetch profile by username",
      loading: false,
    });
  }
},


  // ✅ Get all profiles the user hasn’t followed
  getNotFollowedProfiles: async () => {
    set({ loading: true, error: null });
    try {
      const res = await profile.getNotFollowed();
      const allProfiles = res.data || [];

      // Shuffle and pick 2 random profiles
      const shuffled = allProfiles.sort(() => 0.5 - Math.random());
      const randomTwo = shuffled.slice(0, 20);

      set({ notFollowedProfiles: randomTwo, loading: false });
    } catch (err: any) {
      console.error("Not followed profiles fetch error:", err.response?.data || err.message);
      set({
        error: err.response?.data?.detail || "Failed to fetch not-followed profiles",
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