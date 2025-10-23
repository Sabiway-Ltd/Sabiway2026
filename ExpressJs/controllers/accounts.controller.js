// controllers/accounts.controller.js

const djangoAuth = require("../services/djangoAuth.service");
const { emitEvent } = require("../socket/socket");
const jwt = require("jsonwebtoken");
const { sendEmail } = require("../utils/email"); // you'll create this
const { Resend } = require("resend");
const { CONFIRMATION_SECRET, CONFIRMATION_EXPIRY, FRONTEND_URL, RESEND_API_KEY, DEFAULT_FROM_EMAIL } = require("../config");




// Temporary in-memory store for codes (for dev/testing)
// In production, use Redis or a database
const signupCodes = new Map();
const resend = new Resend(RESEND_API_KEY);

/**
 * Signup
 */
exports.signup = async (req, res) => {
  try {
    const { full_name, email, password } = req.body;

    // 1️⃣ Generate 4-digit verification code
    const code = Math.floor(1000 + Math.random() * 9000).toString();

    // 2️⃣ Create JWT token
    const token = jwt.sign(
      { full_name, email, password },
      CONFIRMATION_SECRET,
      { expiresIn: CONFIRMATION_EXPIRY }
    );

    // 3️⃣ Store verification code temporarily
    signupCodes.set(email, { full_name, password, code, createdAt: Date.now() });

    // 4️⃣ Confirmation link
    const confirmUrl = `${FRONTEND_URL}/confirm-signup?token=${encodeURIComponent(token)}`;

    // 5️⃣ Send confirmation email via Resend
    const emailResponse = await resend.emails.send({
      from: DEFAULT_FROM_EMAIL,
      to: email,
      subject: "Confirm Your SabiWay Account",
      html: `
        <p>Hello ${full_name},</p>
        <p>Thanks for signing up for SabiWay!</p>
        <p>Confirm your email in one of two ways:</p>
        <ol>
          <li><b>Web:</b> <a href="${confirmUrl}">Confirm Email</a></li>
          <li><b>Mobile:</b> Enter this 4-digit code: <b>${code}</b></li>
        </ol>
        <p>This link and code will expire in 1 hour.</p>
        <p>— The SabiWay Team</p>
      `,
      text: `
      Hello ${full_name},

      Thanks for signing up for SabiWay!

      Confirm your email in one of two ways:
      1. Web: Open ${confirmUrl}
      2. Mobile: Enter this 4-digit code: ${code}

      This link and code will expire in 1 hour.
      — The SabiWay Team
      `,
    });

    console.log("📧 Confirmation email sent:", emailResponse);

    // 6️⃣ Send response
    res.json({
      message: "Confirmation email sent. Check your inbox!",
      detail: { full_name, email, password },
      emailResponse,
    });
  } catch (err) {
    console.error("❌ Signup error:", err);
    res.status(500).json({ error: "Failed to send confirmation email." });
  }
};

/**
 * Confirm signup (via link)
 */
exports.confirmSignup = async (req, res) => {
  try {
    const { token } = req.body;
    const decoded = jwt.verify(token, CONFIRMATION_SECRET);

    // Send decoded data to Django signup
    const response = await djangoAuth.signup({
      full_name: decoded.full_name,
      email: decoded.email,
      password: decoded.password,
    });

    // 🔔 Broadcast event
    emitEvent("user:signup", { user: response.data.user, timestamp: new Date() });

    res.json({ message: "Signup successful", user: response.data.user });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: "Invalid or expired token" });
  }
};


/**
 * Verify signup via 4-digit code
 */
exports.verifySignupCode = async (req, res) => {
  try {
    const { email, code } = req.body;
    const record = signupCodes.get(email);

    if (!record) return res.status(400).json({ error: "No signup attempt found for this email" });
    if (record.code !== code) return res.status(400).json({ error: "Invalid code" });

    // Check expiry (1 hour)
    if (Date.now() - record.createdAt > 3600000) {
      signupCodes.delete(email);
      return res.status(400).json({ error: "Code expired" });
    }

    // Continue to Django signup
    const response = await djangoAuth.signup({
      full_name: record.full_name,
      email,
      password: record.password,
    });

    // 🔔 Broadcast event
    emitEvent("user:signup", { user: response.data.user, timestamp: new Date() });

    // Cleanup
    signupCodes.delete(email);

    res.json({ message: "Signup successful", user: response.data.user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Signup verification failed" });
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
