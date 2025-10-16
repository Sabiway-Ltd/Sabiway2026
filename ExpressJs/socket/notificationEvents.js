let io = null;
const userSockets = new Map(); // userId -> socket.id

exports.initNotificationSocket = (ioInstance) => {
  io = ioInstance;

  io.on("connection", (socket) => {
    console.log("✅ User connected to notifications:", socket.id);

    // When user joins with ID
    socket.on("user:join", (userId) => {
      console.log(`👤 User ${userId} joined room ${userId}`);
      socket.join(String(userId));
      userSockets.set(userId, socket.id);
    });

    socket.on("disconnect", () => {
      for (const [userId, sId] of userSockets.entries()) {
        if (sId === socket.id) userSockets.delete(userId);
      }
      console.log("❌ User disconnected:", socket.id);
    });
  });
};

const broadcastEvent = (event, data) => {
  if (!io) return console.warn("Socket.IO not initialized");
  io.emit(event, data);
};

const sendToUser = (userId, event, data) => {
  if (!io) return console.warn("Socket.IO not initialized");
  io.to(String(userId)).emit(event, data);
};

/* -------------------------
   Notification Events
--------------------------*/
exports.notificationCreated = (userId, notification) =>
  sendToUser(userId, "notification:created", notification);

exports.notificationRead = (userId, data) =>
  sendToUser(userId, "notification:read", data);
