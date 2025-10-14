// routes/notifications.routes.js

const express = require("express");
const router = express.Router();
const controller = require("../controllers/notifications.controller");

// List notifications
router.get("/", controller.listNotifications);

// Mark notification as read
router.patch("/:id/read", controller.markNotificationRead);

module.exports = router;
