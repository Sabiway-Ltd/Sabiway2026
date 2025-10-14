// services/djangoSearch.service.js
const axiosClient = require("../utils/axiosClient");

const API_BASE = "/search/";

/**
 * Perform a search
 * @param {string} token - JWT
 * @param {string} query - search query string
 * @param {string} type - one of "posts", "profiles", "hashtags"
 */
exports.search = async (token, query, type = "posts") => {
  const res = await axiosClient.get(API_BASE, {
    headers: { _token: token },
    params: { q: query, type },
  });
  return res.data;
};
