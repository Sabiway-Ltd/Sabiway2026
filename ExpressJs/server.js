import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";

const app = express();
const port = Number(process.env.PORT ?? 5000);
const corsOrigins = (process.env.CORS_ORIGINS ?? "http://localhost:3000")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors({ origin: corsOrigins }));
app.use(express.json());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: corsOrigins
  },
});

// Map to store connected users: userId -> Set of socketIds
const userSockets = {};

// ---------------------------
// Socket.io connection
// ---------------------------
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // User can join their "room" for personal notifications
  socket.on("join", (userId) => {
    if (!userSockets[userId]) userSockets[userId] = new Set();
    userSockets[userId].add(socket.id);
    console.log(`User ${userId} joined with socket ${socket.id}`);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
    // Remove socket from all user sets
    for (const userId in userSockets) {
      userSockets[userId].delete(socket.id);
      if (userSockets[userId].size === 0) delete userSockets[userId];
    }
  });
});

// ---------------------------
// Broadcast new posts
// ---------------------------
app.post("/broadcast", (req, res) => {
  const data = req.body; // { action: "create"|"update"|"delete", post, post_id? }

  io.emit("new-post", data); // Broadcast to all connected clients
  console.log("Broadcasted post:", data.action, data.post?.id || data.post_id);

  res.json({ status: "sent" });
});

// ---------------------------
// Broadcast notifications
// ---------------------------
app.post("/broadcast-notification", (req, res) => {
  const { notification, userId } = req.body;
  // notification should match NotificationItem shape

  if (!notification || !userId) {
    return res.status(400).json({ error: "Missing notification or userId" });
  }

  // Send notification to the specific user if they are connected
  const sockets = userSockets[userId];
  if (sockets) {
    sockets.forEach((socketId) => {
      io.to(socketId).emit("new-notification", notification);
    });
  }

  console.log(`Notification sent to user ${userId}:`, notification.id);
  res.json({ status: "sent" });
});

server.listen(port, () => {
  console.log(`Socket.io server running on port ${port}`);
});
