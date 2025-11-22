const express = require("express");
const http = require("http");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const { Server } = require("socket.io");
const { initSocket } = require("./socket/postEvents");
const { initNotificationSocket } = require("./socket/notificationEvents");
const { initSocket: initUserSocket } = require("./socket/socket");
require("dotenv").config();

const reportRoutes = require("./routes/report");
const accountRoutes = require("./routes/accounts.routes");
const forwardAuth = require("./middleware/authForward");
const { FRONTEND_URL } = require("./config");

const app = express();
const server = http.createServer(app);

// ✅ CORS setup
const allowedOrigins = [
  FRONTEND_URL,
  "http://localhost:3000",
  "http://frontend:3000",
  "http://195.110.58.46:3000"
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      } else {
        console.warn("❌ Blocked by CORS:", origin);
        return callback(null, false);
      }
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());
app.use(forwardAuth);

// ✅ Routes
app.get("/", (req, res) => res.send("Welcome to SabiWay"));
app.get("/health", (req, res) => res.json({ status: "ok", service: "express" }));

app.use("/api/auth", accountRoutes);
app.use("/api/profiles", require("./routes/profiles.routes"));
app.use("/api/posts", require("./routes/posts.routes"));
app.use("/api/notifications", require("./routes/notifications.routes"));
app.use("/api/search", require("./routes/search.routes"));
app.use("/api/report", reportRoutes);
app.use("/api/test-email", require("./routes/testEmail"));

// ✅ Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3000", "http://frontend:3000", FRONTEND_URL, "http://195.110.58.46:3000"],
    credentials: true,
    methods: ["GET", "POST"],
  },
});

initUserSocket(io);
initSocket(io);
initNotificationSocket(io);

// ✅ Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, "0.0.0.0", () =>
  console.log(`🚀 Express server running on http://0.0.0.0:${PORT}`)
);
