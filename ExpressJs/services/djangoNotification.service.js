// services/djangoNotification.service.js
const axiosClient = require("../utils/axiosClient");

/* -------------------------
   List notifications
--------------------------*/
exports.listNotifications = async (token) => {
  const res = await axiosClient.get("/notifications/", {
    headers: { _token: token }, // axiosClient interceptor will convert this to Authorization
  });
  return res.data;
};

/* -------------------------
   Mark a notification as read
--------------------------*/
exports.markAsRead = async (token, id) => {
  const res = await axiosClient.patch(
    `/notifications/${id}/read/`,
    null,
    {
      headers: { _token: token },
    }
  );
  return res.data;
};
