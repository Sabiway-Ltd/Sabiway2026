// controllers/search.controller.js

const djangoSearch = require("../services/djangoSearch.service");

exports.search = async (req, res) => {
  try {
    const token = req.headers._token; // automatically set by authForward middleware
    const query = req.query.q?.trim() || "";
    const type = req.query.type || "posts";

    // Prevent empty query spam
    if (!query) {
      return res.status(400).json({ error: "Search query (q) is required." });
    }

    // 🔍 Use Django Search Service
    const results = await djangoSearch.search(token, query, type);

    res.status(200).json({
      success: true,
      query,
      type,
      count: Array.isArray(results) ? results.length : 0,
      results,
    });
  } catch (err) {
    console.error("❌ Search Controller Error:", err.message);
    res
      .status(err.response?.status || 500)
      .json(err.response?.data || { error: err.message });
  }
};
