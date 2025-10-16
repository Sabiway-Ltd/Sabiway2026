// controllers/notifications.controller.js

const djangoNotification = require("../services/djangoNotification.service");
const notificationEvents = require("../socket/notificationEvents");

/* Helper to forward errors */
const handleError = (res, err) => {
  res
    .status(err.response?.status || 500)
    .json(err.response?.data || { error: err.message });
};

/* -------------------------
   List all notifications for the current user
--------------------------*/
exports.listNotifications = async (req, res) => {
  try {
    const token = req.headers._token;
    const notifications = await djangoNotification.listNotifications(token);
    res.json(notifications);
  } catch (err) {
    handleError(res, err);
  }
};

/* -------------------------
   Mark a single notification as read
--------------------------*/
exports.markNotificationRead = async (req, res) => {
  try {
    const token = req.headers._token;
    const updated = await djangoNotification.markAsRead(token, req.params.id);

    // Emit real-time event ONLY to that user
    notificationEvents.notificationRead(req.user?.id, {
      notificationId: req.params.id,
    });

    res.json({ detail: "Notification marked as read", updated });
  } catch (err) {
    handleError(res, err);
  }
};