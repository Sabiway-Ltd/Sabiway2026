// controllers/accounts.controller.js

const djangoAuth = require("../services/djangoAuth.service");
const { emitEvent } = require("../socket/socket");

/**
 * Signup
 */
exports.signup = async (req, res) => {
  try {
    const response = await djangoAuth.signup(req.body);

    // 🔔 Broadcast signup event (public notification, safe info only)
    emitEvent("user:signup", {
      user: response.data.user || null,
      timestamp: new Date(),
    });

    res.json(response.data);
  } catch (error) {
    res
      .status(error.response?.status || 500)
      .json(error.response?.data || { error: "Signup failed" });
  }
};

/**
 * Login
 */
exports.login = async (req, res) => {
  try {
    const response = await djangoAuth.login(req.body);
    const user = response.data.user;

    // 🔔 Broadcast login event
    emitEvent("user:login", { user, timestamp: new Date() });

    // 🔑 Tell socket to mark user online
    if (user) emitEvent("socket:user-login", user);

    res.json(response.data);
  } catch (error) {
    res
      .status(error.response?.status || 500)
      .json(error.response?.data || { error: "Login failed" });
  }
};

/**
 * Google Login
 */
exports.googleLogin = async (req, res) => {
  try {
    const response = await djangoAuth.googleLogin(req.body);
    const user = response.data.user;

    // 🔔 Broadcast Google login event
    emitEvent("user:google-login", {
      user,
      is_new_user: response.data.is_new_user || false,
      timestamp: new Date(),
    });

    // 🔑 Mark user online
    if (user) emitEvent("socket:user-login", user);

    res.json(response.data);
  } catch (error) {
    res
      .status(error.response?.status || 500)
      .json(error.response?.data || { error: "Google login failed" });
  }
};

/**
 * Forgot Password
 */
exports.forgotPassword = async (req, res) => {
  try {
    const response = await djangoAuth.forgotPassword(req.body);

    // 🔔 Broadcast event (avoid sensitive info)
    emitEvent("user:forgot-password", { timestamp: new Date() });

    res.json(response.data);
  } catch (error) {
    res
      .status(error.response?.status || 500)
      .json(error.response?.data || { error: "Failed to send reset email" });
  }
};

/**
 * Confirm Code
 */
exports.confirmCode = async (req, res) => {
  try {
    const response = await djangoAuth.confirmCode(req.body);
    res.json(response.data);
  } catch (error) {
    res
      .status(error.response?.status || 500)
      .json(error.response?.data || { error: "Invalid code" });
  }
};

/**
 * Reset Password
 */
exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const response = await djangoAuth.resetPassword(token, req.body);

    // 🔔 Broadcast password reset event
    emitEvent("user:reset-password", { timestamp: new Date() });

    res.json(response.data);
  } catch (error) {
    res
      .status(error.response?.status || 500)
      .json(error.response?.data || { error: "Reset failed" });
  }
};

/**
 * Logout
 */
exports.logout = async (req, res) => {
  try {
    const response = await djangoAuth.logout(req.body);
    const user = req.body?.user || null;

    // 🔔 Broadcast logout event
    emitEvent("user:logout", { user, timestamp: new Date() });

    // 🔑 Mark user offline
    if (user) emitEvent("socket:user-logout", user);

    res.json(response.data);
  } catch (error) {
    res
      .status(error.response?.status || 500)
      .json(error.response?.data || { error: "Logout failed" });
  }
};

/**
 * Generate Google Auth URL
 */
exports.generateGoogleUrl = async (req, res) => {
  try {
    const response = await djangoAuth.generateGoogleUrl();
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: "Failed to generate Google auth URL" });
  }
};
