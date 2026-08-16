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

app.use(cors({ origin: corsOrigins, credentials: true }));
app.use(express.json({ limit: "1mb" }));

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: corsOrigins,
    credentials: true,
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

  if (header.alg !== "HS256" || payload.token_type !== "access" || !payload.user_id) {
    return null;
  }

  if (payload.exp && Math.floor(Date.now() / 1000) >= payload.exp) {
    return null;
  }

  const expectedSignature = crypto
    .createHmac("sha256", jwtSigningKey)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest("base64url");

  const received = Buffer.from(encodedSignature);
  const expected = Buffer.from(expectedSignature);
  if (received.length !== expected.length || !crypto.timingSafeEqual(received, expected)) {
    return null;
  }

  return payload;
}

function requireInternalToken(req, res, next) {
  if (!internalBroadcastToken) {
    return res.status(503).json({ error: "Realtime broadcast authentication is not configured" });
  }

  const supplied = req.get("x-sabiway-internal-token") ?? "";
  const received = Buffer.from(supplied);
  const expected = Buffer.from(internalBroadcastToken);

  if (received.length !== expected.length || !crypto.timingSafeEqual(received, expected)) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  return next();
}

io.use((socket, next) => {
  const rawToken = socket.handshake.auth?.token;
  const token = typeof rawToken === "string" ? rawToken.replace(/^Bearer\s+/i, "") : "";
  const payload = verifyAccessToken(token);

  if (!payload) {
    return next(new Error("unauthorized"));
  }

  socket.data.userId = String(payload.user_id);
  return next();
});

io.on("connection", (socket) => {
  const userId = socket.data.userId;
  const sockets = userSockets.get(userId) ?? new Set();
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

app.get("/health", (_req, res) => {
  res.json({ status: "ok", authenticatedRealtime: true });
});

app.post("/broadcast", requireInternalToken, (req, res) => {
  const data = req.body;
  if (!data?.action) {
    return res.status(400).json({ error: "Missing action" });
  }

  io.emit("new-post", data);
  return res.json({ status: "sent" });
});

app.post("/broadcast-notification", requireInternalToken, (req, res) => {
  const { notification, userId } = req.body;
  if (!notification || !userId) {
    return res.status(400).json({ error: "Missing notification or userId" });
  }

  io.to(`user:${String(userId)}`).emit("new-notification", notification);
  return res.json({ status: "sent" });
});

server.listen(port, () => {
  console.log(`Socket.io server running on port ${port}`);
});
