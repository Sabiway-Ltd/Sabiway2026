// app/services/socket.ts
import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

// ✅ Connect to the Socket.IO server
export function connectSocket() {
  if (typeof window === "undefined") return null;

  const token = localStorage.getItem("access");
  if (!token) {
    console.warn("⚠️ No access token found. Skipping socket connection.");
    return null;
  }

  // Avoid duplicate connections
  if (socket && socket.connected) {
    console.log("⚙️ Socket already connected:", socket.id);
    return socket;
  }

  socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3002", {
    auth: { token }, // ✅ sends JWT to Node server for validation
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 2000,
    transports: ["websocket"], // force WebSocket for better stability
  });

  // ✅ Log connection info
  socket.on("connect", () => {
    console.log("✅ Connected to Socket.IO:", socket.id);
  });

  socket.on("disconnect", (reason) => {
    console.warn("⚠️ Socket disconnected:", reason);
  });

  socket.on("connect_error", (err) => {
    console.error("❌ Socket connection error:", err.message);
  });

  return socket;
}

// ✅ Get current socket instance
export function getSocket() {
  return socket;
}

// ✅ Cleanly disconnect socket
export function disconnectSocket() {
  if (!socket) return;
  socket.disconnect();
  socket = null;
  console.log("🧹 Socket disconnected and cleared.");
}

// ✅ Optional: helper for sending events
export function emitEvent(event: string, data: any) {
  if (!socket || !socket.connected) {
    console.warn("⚠️ Cannot emit event — socket not connected.");
    return;
  }
  socket.emit(event, data);
}
