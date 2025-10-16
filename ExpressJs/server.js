const express = require("express");
const http = require("http");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const { Server } = require("socket.io");
const { initSocket } = require("./socket/postEvents");
const {initNotificationSocket} = require("./socket/notificationEvents")
const socketModule = require("./socket/socket");
require("dotenv").config();

const accountRoutes = require("./routes/accounts.routes");
const forwardAuth = require("./middleware/authForward");

const app = express();
const server = http.createServer(app);

// ✅ FIXED CORS
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

// ✅ JWT forwarding middleware
app.use(forwardAuth);

// Routes
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
require("./socket/socket")(io);

// Initialize post events
initSocket(io);

// Init Notification events
initNotificationSocket(io)

// Initialize online users socket handling
socketModule(io);

// ✅ Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () =>
  console.log(`🚀 Express server running on http://localhost:${PORT}`)
);
