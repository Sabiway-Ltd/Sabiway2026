// app/services/auth.ts

import { api } from "./api";

export const auth = {
  signup: (data: { full_name: string; email: string; password: string; role?: "client" | "professional" }) =>
    api.post("/auth/signup/", data),

  login: (data: { email: string; password: string }) =>
    api.post("/auth/login/", data),

  googleLogin: (data: { token: string }) =>
    api.post("/auth/google-login/", data),

  generateGoogleUrl: () => api.get("/auth/generate-google-url/"),

  forgotPassword: (data: { email: string }) =>
    api.post("/auth/forgot-password/", data),

  confirmCode: (data: { email: string; code: string }) =>
    api.post("/auth/confirm-code/", data),

  resetPassword: (token: string, data: { new_password: string; confirm_password: string }) =>
    api.post(`/auth/reset-password/${token}/`, data),

  logout: (data: { refresh: string }) => api.post("/auth/logout/", data),
};