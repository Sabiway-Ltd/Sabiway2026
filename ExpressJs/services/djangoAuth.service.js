// services/djangoAuth.service.js
const axiosClient = require("../utils/axiosClient");

module.exports = {
  signup: async (data) => axiosClient.post("/auth/signup/", data),
  login: async (data) => axiosClient.post("/auth/login/", data),
  googleLogin: async (data) => axiosClient.post("/auth/google-login/", data),
  forgotPassword: async (data) => axiosClient.post("/auth/forgot-password/", data),
  confirmCode: async (data) => axiosClient.post("/auth/confirm-code/", data),
  resetPassword: async (token, data) => axiosClient.post(`/reset-password/${token}/`, data),
  logout: async (data) => axiosClient.post("/auth/logout/", data),
  generateGoogleUrl: async () => axiosClient.get("/auth/generate-google-url/"),
  refreshToken: async (data) => axiosClient.post("/auth/token/refresh/", data),
};
