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
