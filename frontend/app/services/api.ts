// app/services/api.ts

import axios from "axios";

export const api = axios.create({
  baseURL: "https://sabiway-9wq4.onrender.com/api",
  headers: { "Content-Type": "application/json" },
});

// ✅ Attach access token automatically
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("access");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// ✅ Handle token refresh on 401 errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Check if token expired and not already retried
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      typeof window !== "undefined"
    ) {
      originalRequest._retry = true;

      const refreshToken = localStorage.getItem("refresh");
      if (!refreshToken) {
        console.warn("No refresh token found. Redirecting to login...");
        window.location.href = "/login";
        return Promise.reject(error);
      }

      try {
        // Call your refresh endpoint
        const res = await axios.post(
          "https://sabiway-9wq4.onrender.com/api/auth/refresh/",
          { refresh: refreshToken },
          { headers: { "Content-Type": "application/json" } }
        );

        const newAccessToken = res.data.access;
        if (newAccessToken) {
          // Save new access token
          localStorage.setItem("access", newAccessToken);

          // Update headers
          api.defaults.headers.Authorization = `Bearer ${newAccessToken}`;
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

          // Retry original request
          return api(originalRequest);
        }
      } catch (refreshError) {
        console.error("Token refresh failed:", refreshError);
        // Clear storage and redirect
        localStorage.removeItem("access");
        localStorage.removeItem("refresh");
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);
