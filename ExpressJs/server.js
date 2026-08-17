import crypto from "crypto";
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
const internalBroadcastToken = process.env.INTERNAL_BROADCAST_TOKEN ?? "";
const jwtSigningKey = process.env.JWT_SIGNING_KEY ?? "";
const maxSocketsPerUser = Math.max(1, Number(process.env.MAX_SOCKETS_PER_USER ?? 5));

app.disable("x-powered-by");
app.use(cors({ origin: corsOrigins, credentials: true }));
app.use(express.json({ limit: "512kb", strict: true }));
app.use((_req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("Cache-Control", "no-store");
  next();
});

const server = http.createServer(app);
server.requestTimeout = 10_000;
server.headersTimeout = 12_000;
server.keepAliveTimeout = 5_000;

const io = new Server(server, {
  cors: { origin: corsOrigins, credentials: true },
  maxHttpBufferSize: 256 * 1024,
  pingInterval: 25_000,
  pingTimeout: 20_000,
  connectionStateRecovery: {
    maxDisconnectionDuration: 2 * 60 * 1000,
    skipMiddlewares: false,
  },
});
const userSockets = new Map();

function base64UrlDecode(value) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  return Buffer.from(padded, "base64");
}

function verifyAccessToken(token) {
  if (!jwtSigningKey || !token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [encodedHeader, encodedPayload, encodedSignature] = parts;
  let header;
  let payload;
  try {
    header = JSON.parse(base64UrlDecode(encodedHeader).toString("utf8"));
    payload = JSON.parse(base64UrlDecode(encodedPayload).toString("utf8"));
  } catch {
    return null;
  }
  if (header.alg !== "HS256" || payload.token_type !== "access" || !payload.user_id) return null;
  if (!payload.exp || Math.floor(Date.now() / 1000) >= payload.exp) return null;
  const expectedSignature = crypto.createHmac("sha256", jwtSigningKey).update(`${encodedHeader}.${encodedPayload}`).digest("base64url");
  const received = Buffer.from(encodedSignature);
  const expected = Buffer.from(expectedSignature);
  if (received.length !== expected.length || !crypto.timingSafeEqual(received, expected)) return null;
  return payload;
}

function requireInternalToken(req, res, next) {
  if (!internalBroadcastToken) return res.status(503).json({ error: "Realtime broadcast authentication is not configured" });
  const supplied = req.get("x-sabiway-internal-token") ?? "";
  const received = Buffer.from(supplied);
  const expected = Buffer.from(internalBroadcastToken);
  if (received.length !== expected.length || !crypto.timingSafeEqual(received, expected)) return res.status(401).json({ error: "Unauthorized" });
  return next();
}

io.use((socket, next) => {
  const rawToken = socket.handshake.auth?.token;
  const token = typeof rawToken === "string" ? rawToken.replace(/^Bearer\s+/i, "") : "";
  const payload = verifyAccessToken(token);
  if (!payload) return next(new Error("unauthorized"));
  socket.data.userId = String(payload.user_id);
  return next();
});

io.on("connection", (socket) => {
  const userId = socket.data.userId;
  const sockets = userSockets.get(userId) ?? new Set();
  if (sockets.size >= maxSocketsPerUser) {
    socket.emit("session-limit", { message: "Too many active realtime sessions." });
    socket.disconnect(true);
    return;
  }
  sockets.add(socket.id);
  userSockets.set(userId, sockets);
  socket.join(`user:${userId}`);
  socket.on("disconnect", () => {
    const currentSockets = userSockets.get(userId);
    if (!currentSockets) return;
    currentSockets.delete(socket.id);
    if (currentSockets.size === 0) userSockets.delete(userId);
  });
});

app.get("/health", (_req, res) => res.json({ status: "ok", authenticatedRealtime: true }));

app.post("/broadcast", requireInternalToken, (req, res) => {
  const data = req.body;
  if (!data?.action || typeof data.action !== "string" || data.action.length > 80) return res.status(400).json({ error: "Invalid action" });
  io.emit("new-post", data);
  return res.json({ status: "sent" });
});

app.post("/broadcast-notification", requireInternalToken, (req, res) => {
  const { notification, userId } = req.body;
  if (!notification || !userId) return res.status(400).json({ error: "Missing notification or userId" });
  io.to(`user:${String(userId)}`).emit("new-notification", notification);
  return res.json({ status: "sent" });
});

app.post("/broadcast-marketplace", requireInternalToken, (req, res) => {
  const { userIds, event, payload } = req.body;
  if (!Array.isArray(userIds) || userIds.length === 0 || userIds.length > 100 || typeof event !== "string" || !payload) {
    return res.status(400).json({ error: "Invalid recipients, event or payload" });
  }
  const allowedEvents = new Set(["new-message", "booking-updated", "schedule-updated"]);
  if (!allowedEvents.has(event)) return res.status(400).json({ error: "Unsupported marketplace event" });
  const recipients = [...new Set(userIds.map((userId) => String(userId)))];
  for (const userId of recipients) io.to(`user:${userId}`).emit(event, payload);
  return res.json({ status: "sent", recipients: recipients.length });
});

server.on("clientError", (_err, socket) => {
  if (socket.writable) socket.end("HTTP/1.1 400 Bad Request\r\n\r\n");
});

server.listen(port, () => console.log(`Socket.io server running on port ${port}`));
