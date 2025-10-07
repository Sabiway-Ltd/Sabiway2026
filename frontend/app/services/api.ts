// app/services/api.ts

import axios from "axios";

export const api = axios.create({
  baseURL: "https://sabiway-9wq4.onrender.com/api",
  headers: { "Content-Type": "application/json" },
});

// Optional: Add token to requests automatically
api.interceptors.request.use((config) => {
  const token = typeof window !== "undefined" ? localStorage.getItem("access") : null;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
