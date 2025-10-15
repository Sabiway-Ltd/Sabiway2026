import { create } from "zustand";
import { io } from "socket.io-client";
import toast from "react-hot-toast";
import { EXPRESS_LOCAL_URL } from "@/app/utils/MyConstants";

const API_URL = `${EXPRESS_LOCAL_URL}/api/profiles`;
const SOCKET_URL = EXPRESS_LOCAL_URL;

let socket: any = null;

// 🔹 Helper to attach token automatically
const authFetch = async (url: string, options: RequestInit = {}) => {
  const access = localStorage.getItem("access");
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
    ...(access ? { Authorization: `Bearer ${access}` } : {}),
  };

  return fetch(url, {
    ...options,
    headers,
    credentials: "include", // keep cookies too, if backend needs refresh
  });
};

export interface Profile {
  user_id: number;
  username: string;
  full_name: string;
  email: string;
  followers_count: number;
  following_count: number;
  posts_count: number;
  whatsapp_number?: string;
  profile_picture?: string;
}

interface ProfileState {
  profiles: Profile[];
  myProfile: Profile | null;
  topContributors: Profile[];
  loading: boolean;

  // API Actions
  fetchProfiles: () => Promise<void>;
  fetchMyProfile: () => Promise<void>;
  fetchProfileById: (userId: number) => Promise<Profile | null>;
  updateMyProfile: (form: Partial<Profile>) => Promise<boolean>;
  deleteMyProfile: () => Promise<boolean>;

  followUser: (userId: number) => Promise<void>;
  unfollowUser: (userId: number) => Promise<void>;
  fetchFollowers: (userId: number) => Promise<Profile[]>;
  fetchFollowing: (userId: number) => Promise<Profile[]>;
  fetchTopContributors: () => Promise<void>;

  // Socket
  connectProfileSocket: () => void;
}

export const useProfileStore = create<ProfileState>((set, get) => ({
  profiles: [],
  myProfile: null,
  topContributors: [],
  loading: false,

  /* ------------------------------
     🔹 Fetch all profiles
  ------------------------------- */
  fetchProfiles: async () => {
    try {
      set({ loading: true });
      const res = await authFetch(`${API_URL}/`);
      const data = await res.json();
      set({ profiles: data });
    } catch {
      toast.error("Failed to load profiles");
    } finally {
      set({ loading: false });
    }
  },

  /* ------------------------------
     🔹 Fetch my profile
  ------------------------------- */
  fetchMyProfile: async () => {
    try {
      set({ loading: true });
      const res = await authFetch(`${API_URL}/me`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch profile");
      set({ myProfile: data });
    } catch (error: any) {
      toast.error(error.message || "Error loading profile");
    } finally {
      set({ loading: false });
    }
  },

  /* ------------------------------
     🔹 Fetch profile by ID
  ------------------------------- */
  fetchProfileById: async (userId) => {
    try {
      const res = await authFetch(`${API_URL}/${userId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch profile");
      return data;
    } catch (error: any) {
      toast.error(error.message || "Error fetching profile");
      return null;
    }
  },

  /* ------------------------------
     🔹 Update my profile
  ------------------------------- */
  updateMyProfile: async (form) => {
    try {
      set({ loading: true });
      const res = await authFetch(`${API_URL}/me`, {
        method: "PATCH",
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Update failed");

      set({ myProfile: data });
      toast.success("Profile updated!");
      return true;
    } catch (error: any) {
      toast.error(error.message || "Error updating profile");
      return false;
    } finally {
      set({ loading: false });
    }
  },

  /* ------------------------------
     🔹 Delete my profile
  ------------------------------- */
  deleteMyProfile: async () => {
    try {
      const res = await authFetch(`${API_URL}/me`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");

      toast.success("Profile deleted!");
      set({ myProfile: null });
      return true;
    } catch (error: any) {
      toast.error(error.message || "Error deleting profile");
      return false;
    }
  },

  /* ------------------------------
     🔹 Follow / Unfollow
  ------------------------------- */
  followUser: async (userId) => {
    try {
      const res = await authFetch(`${API_URL}/${userId}/follow`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Follow failed");
      toast.success("Followed successfully!");
    } catch (error: any) {
      toast.error(error.message || "Error following user");
    }
  },

  unfollowUser: async (userId) => {
    try {
      const res = await authFetch(`${API_URL}/${userId}/unfollow`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Unfollow failed");
      toast("Unfollowed");
    } catch (error: any) {
      toast.error(error.message || "Error unfollowing user");
    }
  },

  /* ------------------------------
     🔹 Followers / Following
  ------------------------------- */
  fetchFollowers: async (userId) => {
    try {
      const res = await authFetch(`${API_URL}/${userId}/followers`);
      const data = await res.json();
      return data;
    } catch {
      toast.error("Failed to load followers");
      return [];
    }
  },

  fetchFollowing: async (userId) => {
    try {
      const res = await authFetch(`${API_URL}/${userId}/following`);
      const data = await res.json();
      return data;
    } catch {
      toast.error("Failed to load following");
      return [];
    }
  },

  /* ------------------------------
     🔹 Top Contributors
  ------------------------------- */
  fetchTopContributors: async () => {
    try {
      const res = await authFetch(`${API_URL}/contributors/top`);
      const data = await res.json();
      set({ topContributors: data });
    } catch {
      toast.error("Failed to load top contributors");
    }
  },

  /* ------------------------------
     🔹 Socket Integration
  ------------------------------- */
  connectProfileSocket: () => {
    if (!socket) {
      socket = io(SOCKET_URL, {
        transports: ["websocket"],
        withCredentials: true,
      });

      socket.on("connect", () => {
        console.log("✅ Profile socket connected:", socket.id);
      });

      socket.on("profile:updated", (profile: Profile) => {
        // set({ myProfile: profile });
        // toast.success("Your profile was updated");
      });

      socket.on("profile:updatedById", (data: { userId: number; profile: Profile }) => {
        set((state) => ({
          profiles: state.profiles.map((p) =>
            p.user_id === data.userId ? data.profile : p
          ),
        }));
        // toast("A profile was updated by admin");
      });

      socket.on("profile:deleted", () => {
        set({ myProfile: null });
        // toast.error("Your profile has been deleted");
      });

      socket.on("profile:deletedById", (data: { userId: number }) => {
        set((state) => ({
          profiles: state.profiles.filter((p) => p.user_id !== data.userId),
        }));
        // toast("A profile was deleted by admin");
      });

      socket.on("profile:follow", (data: any) => {
        // toast.success(`${data.follower.full_name} followed ${data.followed.full_name}`);
      });

      socket.on("profile:unfollow", (data: any) => {
        // toast(`${data.follower.full_name} unfollowed ${data.followed.full_name}`);
      });

      socket.on("profile:topContributors", (list: Profile[]) => {
        set({ topContributors: list });
        // toast("Top contributors updated");
      });
    }
  },
}));
