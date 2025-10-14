// utils/axiosClient.js

const axios = require("axios");
const { DJANGO_BASE_URL } = require("../config");

const axiosClient = axios.create({
  baseURL: DJANGO_BASE_URL ,
  headers: { "Content-Type": "application/json" },
});

// 🔐 Automatically attach JWT if provided in request
axiosClient.interceptors.request.use((config) => {
  if (config.headers && config.headers._token) {
    config.headers["Authorization"] = `Bearer ${config.headers._token}`;
    delete config.headers._token; // cleanup
  }
  return config;
});

module.exports = axiosClient;
