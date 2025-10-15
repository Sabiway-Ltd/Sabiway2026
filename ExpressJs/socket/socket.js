// socket/socket.js

let ioInstance;
const onlineUsers = new Map(); // socketId => user info

module.exports = (io) => {
  ioInstance = io;

  io.on("connection", (socket) => {
    console.log("🟢 User connected:", socket.id);

    // Listen for user login to mark them online
    socket.on("user:login", (user) => {
      onlineUsers.set(socket.id, user);
      emitOnlineUsers(); // broadcast updated list
    });


    // Google Login
    socket.on("user:google_login", (user) => {
      // console.log("🟢 Google user logged in:", user);
      // Mark them online as well
      onlineUsers.set(socket.id, user);
      // Broadcast both user-specific and general events
      ioInstance.emit("user:google_logged_in", user);
      emitOnlineUsers();
    });

    // Listen for user logout to remove them
    socket.on("user:logout", () => {
      onlineUsers.delete(socket.id);
      emitOnlineUsers();
    });

    socket.on("disconnect", () => {
      console.log("🔴 User disconnected:", socket.id);
      onlineUsers.delete(socket.id);
      emitOnlineUsers();
    });
  });
};

// Utility to emit to all clients
module.exports.emitEvent = (event, data) => {
  if (ioInstance) ioInstance.emit(event, data);
};

// Broadcast current online users
const emitOnlineUsers = () => {
  if (ioInstance) {
    ioInstance.emit("users:online", Array.from(onlineUsers.values()));
  }
};
