const { emitEvent } = require("./socket");

/* -------------------------
   Notification Events
--------------------------*/

// New notification for a user
exports.notificationCreated = (notification) =>
  emitEvent("notification:created", notification);

// Notification marked as read
exports.notificationRead = (data) =>
  emitEvent("notification:read", data);

// Optional: bulk mark read or other notification events can be added here
