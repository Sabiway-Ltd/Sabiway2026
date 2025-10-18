const express = require("express");
const http = require("http");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const { Server } = require("socket.io");
const { initSocket } = require("./socket/postEvents");
const { initNotificationSocket } = require("./socket/notificationEvents");
const { initSocket: initUserSocket } = require("./socket/socket"); // ✅ consistent export
require("dotenv").config();

const accountRoutes = require("./routes/accounts.routes");
const forwardAuth = require("./middleware/authForward");

const app = express();
const server = http.createServer(app);

// ✅ CORS
const allowedOrigins = [
  'http://localhost:3000', // local dev
  'https://sabiway2025.vercel.app', // production
];

app.use(
  cors({
    origin: function (origin, callback) {
      // allow requests with no origin (like Postman)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      } else {
        return callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true, // needed if you send cookies or auth headers
  })
);
app.use(express.json());
app.use(cookieParser());
app.use(forwardAuth);

// ✅ Routes
// Base route
app.get("/", (req, res) => {
  res.send("Welcome to SabiWay");
});

app.use("/api/auth", accountRoutes);
app.use("/api/profiles", require("./routes/profiles.routes"));
app.use("/api/posts", require("./routes/posts.routes"));
app.use("/api/notifications", require("./routes/notifications.routes"));
app.use("/api/search", require("./routes/search.routes"));

// ✅ Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST"],
  },
});

// Initialize sockets
initUserSocket(io);          // 🟢 your main socket
initSocket(io);              // post events
initNotificationSocket(io);  // notification events

// ✅ Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () =>
  console.log(`🚀 Express server running on http://localhost:${PORT}`)
);
