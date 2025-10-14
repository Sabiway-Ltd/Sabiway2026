import { create } from "zustand";
import axios from "axios";

const API_URL = "http://localhost:5000/api"; // <-- Add your API base URL here

export const useAuthStore = create((set, get) => ({
  user: null,
  token: localStorage.getItem("token") || null,
  message: "",

  // --- Setters ---
  setUser: (user) => set({ user }),
  setToken: (token) => {
    localStorage.setItem("token", token);
    set({ token });
  },
  setMessage: (message) => set({ message }),

  // --- Actions ---
  signup: async (fullName, email, password) => {
    try {
      await axios.post(`${API_URL}/auth/signup`, { fullName, email, password });
      set({ message: "Signup successful! Please login." });
    } catch (err) {
      set({ message: err.response?.data?.error || "Signup failed" });
    }
  },

  login: async (email, password) => {
    try {
        const res = await axios.post(`${API_URL}/auth/login`, { email, password });
        const { access, user } = res.data;  // <-- use 'access' instead of 'token'
        set({ token: access, user, message: "Login successful!" });
        localStorage.setItem("token", access);
    } catch (err) {
        set({ message: err.response?.data?.error || "Login failed" });
    }
    },

  logout: () => {
    localStorage.removeItem("token");
    set({ user: null, token: null, message: "" });
  },

  // --- Profile fetch/update ---
  fetchProfile: async () => {
    const token = get().token;
    if (!token) return;

    try {
      const res = await axios.get(`${API_URL}/profiles/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      set({ user: res.data });
    } catch (err) {
      set({ message: err.response?.data?.error || "Failed to fetch profile" });
    }
  },

  updateProfile: async (fullName) => {
    const token = get().token;
    if (!token) return;

    try {
      const res = await axios.put(`${API_URL}/profiles/me`, { fullName }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      set({ user: res.data, message: "Profile updated successfully!" });
    } catch (err) {
      set({ message: err.response?.data?.error || "Failed to update profile" });
    }
  }
}));
