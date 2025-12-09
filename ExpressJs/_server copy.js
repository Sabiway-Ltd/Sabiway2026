import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*", // Or your Next.js domain
  }
});

// When user connects
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

// Endpoint for Django to broadcast events
app.post("/broadcast", (req, res) => {
  const data = req.body; // { action: "create"|"update"|"delete", post, post_id? }

  // Emit the action to all connected clients
  io.emit("new-post", data);

  console.log("Broadcasted:", data.action, data.post?.id || data.post_id);

  res.json({ status: "sent" });
});

server.listen(5000, () => {
  console.log("Socket.io server running on port 5000");
});
