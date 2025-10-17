const jwt = require("jsonwebtoken");

let ioInstance;
const onlineUsers = new Map(); // socketId => decoded user info

/**
 * 🔹 Initialize main socket handlers
 */
function initSocket(io) {
  ioInstance = io;

  // 🔐 Middleware — authenticate via JWT (optional)
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.userId = decoded.id;
        onlineUsers.set(socket.id, decoded);
        console.log(`🔐 Authenticated ${decoded.full_name || decoded.username || decoded.id}`);
      } catch (err) {
        console.log("⚠️ Invalid or expired token");
      }
    }
    next();
  });

  // 🧠 Handle new connections
  io.on("connection", (socket) => {
    console.log("🟢 Connected:", socket.id);

    if (socket.userId) emitOnlineUsers();

    // ✅ Manual login
    socket.on("user:login", (user) => {
      if (!user?.id) return;
      socket.userId = user.id;
      onlineUsers.set(socket.id, user);
      console.log(`✅ Manual login: ${user.full_name || user.username} (${socket.id})`);
      emitOnlineUsers();
    });

    // ✅ Google login
    socket.on("user:google_login", (user) => {
      if (!user?.id) return;
      socket.userId = user.id;
      onlineUsers.set(socket.id, user);
      ioInstance.emit("user:google_logged_in", user);
      console.log(`✅ Google login: ${user.full_name || user.username} (${socket.id})`);
      emitOnlineUsers();
    });

    // 📩 Send notifications
    socket.on("send:notification", (data) => {
      if (!data?.target_user_id) return;

      const targetSocket = [...io.sockets.sockets.values()].find(
        (s) => s.userId === data.target_user_id
      );

      if (targetSocket) {
        targetSocket.emit("notification:new", data);
        console.log(`📨 Sent notification to user ${data.target_user_id}`);
      } else {
        console.log(`⚠️ User ${data.target_user_id} not online`);
      }
      emitOnlineUsers();
    });

    // 🚪 Manual logout
    socket.on("user:logout", () => {
      onlineUsers.delete(socket.id);
      console.log(`🚪 Logged out: ${socket.id}`);
      emitOnlineUsers();
    });

    // 🔴 Disconnect
    socket.on("disconnect", () => {
      console.log(`🔴 Disconnected: ${socket.id}`);
      onlineUsers.delete(socket.id);
      emitOnlineUsers();
    });
  });
}

/**
 * 🧭 Add user to online list manually (e.g., from HTTP route)
 */
function addOnlineUser(user) {
  if (!user?.id) return;

  const isAlreadyOnline = Array.from(onlineUsers.values()).some(
    (u) => u.id === user.id
  );

  if (!isAlreadyOnline) {
    const fakeSocketId = `http_${user.id}_${Date.now()}`;
    onlineUsers.set(fakeSocketId, user);
    console.log(`🧭 Added ${user.full_name || user.username} to online users (HTTP route)`);
    emitOnlineUsers();
  }
}

/**
 * 🌐 Emit list of online users to everyone
 */
function emitOnlineUsers() {
  if (ioInstance) {
    const users = Array.from(onlineUsers.values());
    ioInstance.emit("users:online", users);
    console.log("📡 Online users:", users.map((u) => u.full_name || u.username || u.id));
  }
}

/**
 * 📢 Emit custom events globally
 */
function emitEvent(event, data) {
  if (ioInstance) ioInstance.emit(event, data);
}

module.exports = {
  initSocket,
  emitOnlineUsers,
  addOnlineUser,
  emitEvent,
};
