// socket/socket.js

let ioInstance;
const onlineUsers = new Map(); // socketId => user info

module.exports = (io) => {
  ioInstance = io;

  io.on("connection", (socket) => {
    console.log("🟢 User connected:", socket.id);

    /**
     * 🔹 Handle normal login
     */
    socket.on("user:login", (user) => {
      if (!user?.id) return;

      socket.userId = user.id; // store userId in the socket
      onlineUsers.set(socket.id, user);

      console.log(`✅ User ${user.full_name} logged in (${socket.id})`);
      emitOnlineUsers();
    });

    /**
     * 🔹 Handle Google login (same logic as normal login)
     */
    socket.on("user:google_login", (user) => {
      if (!user?.id) return;

      socket.userId = user.id;
      onlineUsers.set(socket.id, user);

      ioInstance.emit("user:google_logged_in", user);
      console.log(`✅ Google user ${user.full_name} logged in (${socket.id})`);
      emitOnlineUsers();
    });

    /**
     * 🔹 Handle notifications
     * Send a notification to a specific target user
     */
    socket.on("send:notification", (notificationData) => {
      if (!notificationData?.target_user_id) return;

      // find socket where userId matches target user
      const targetSocket = [...io.sockets.sockets.values()].find(
        (s) => s.userId === notificationData.target_user_id
      );

      if (targetSocket) {
        targetSocket.emit("notification:new", notificationData);
        console.log(`📨 Notification sent to user ${notificationData.target_user_id}`);
      } else {
        console.log(`⚠️ Target user ${notificationData.target_user_id} not online`);
      }
    });

    /**
     * 🔹 Handle logout or disconnect
     */
    socket.on("user:logout", () => {
      onlineUsers.delete(socket.id);
      console.log(`🚪 User logged out: ${socket.id}`);
      emitOnlineUsers();
    });

    socket.on("disconnect", () => {
      console.log(`🔴 User disconnected: ${socket.id}`);
      onlineUsers.delete(socket.id);
      emitOnlineUsers();
    });
  });
};

/**
 * 🔹 Utility to emit a general event to all clients
 */
module.exports.emitEvent = (event, data) => {
  if (ioInstance) ioInstance.emit(event, data);
};

/**
 * 🔹 Broadcast the list of currently online users
 */
const emitOnlineUsers = () => {
  if (ioInstance) {
    ioInstance.emit("users:online", Array.from(onlineUsers.values()));
  }
};
