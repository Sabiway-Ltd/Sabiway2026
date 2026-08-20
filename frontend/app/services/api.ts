// app/services/api.ts

import axios from "axios";
import { DJANGO_URL } from "../utils/MyConstants";
import { clearBrowserSession, setAccessToken } from "@/app/auth/session";

export const api = axios.create({
  baseURL: `${DJANGO_URL}/api`,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("access");
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      !originalRequest?._retry &&
      typeof window !== "undefined"
    ) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem("refresh");

      if (!refreshToken) {
        clearBrowserSession();
        window.location.href = `/login?next=${encodeURIComponent(window.location.pathname + window.location.search)}`;
        return Promise.reject(error);
      }

      try {
        const res = await axios.post(
          `${DJANGO_URL}/api/auth/token/refresh/`,
          { refresh: refreshToken },
          { headers: { "Content-Type": "application/json" } },
        );

        const newAccessToken = res.data.access;
        if (newAccessToken) {
          setAccessToken(newAccessToken);
          api.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`;
          originalRequest.headers = originalRequest.headers ?? {};
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        console.error("Token refresh failed:", refreshError);
        clearBrowserSession();
        window.location.href = `/login?next=${encodeURIComponent(window.location.pathname + window.location.search)}`;
      }
    }

    return Promise.reject(error);
  },
);
