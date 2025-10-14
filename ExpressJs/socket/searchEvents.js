// socket/searchEvents.js

const djangoSearch = require("../services/djangoSearch.service");
let ioInstance;

module.exports = (io) => {
  ioInstance = io;

  io.on("connection", (socket) => {
    console.log("🟢 User connected to Search Socket:", socket.id);

    // Listen for search query from client
    socket.on("search:query", async ({ query, type, token }) => {
      if (!query) return;

      try {
        const results = await djangoSearch.search(token, query, type);
        // Emit back to the same socket only
        socket.emit("search:results", { query, type, results });
      } catch (err) {
        console.error("Search Error:", err.message);
        socket.emit("search:error", { query, type, error: err.message });
      }
    });

    socket.on("disconnect", () => {
      console.log("🔴 User disconnected from Search Socket:", socket.id);
    });
  });
};
