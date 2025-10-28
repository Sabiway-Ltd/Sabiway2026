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
      subject: "Welcome to SabiWay — Confirm Your Account",
      html: `
      <div style="font-family: Arial, sans-serif; background-color: #f4f4f7; padding: 40px 0; text-align: center;">
        <div style="background-color: #ffffff; width: 90%; max-width: 520px; margin: auto; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
          
          <!-- Header with Logo -->
          <div style="background-color: #008753; padding: 25px 0;">
            <img
              src="https://res.cloudinary.com/devqbjptr/image/upload/v1759082923/Group_3_2_ks6g5d.png"
              alt="SabiWay Logo"
              width="140"
              height="auto"
              style="display:block; margin:auto; border:0; outline:none; text-decoration:none;"
            >
          </div>

          <!-- Main Content -->
          <div style="padding: 30px;">
            <h2 style="color: #333333; margin-top: 10px;">Welcome, ${full_name} 👋</h2>
            <p style="font-size: 16px; color: #555555; line-height: 1.6;">
              Thanks for joining <strong>SabiWay</strong> — where connection and community thrive.
              Please confirm your email address to activate your account.
            </p>

            <!-- Confirm Button -->
            <a href="${confirmUrl}" 
              style="display: inline-block; margin-top: 20px; background-color: #008753; color: #ffffff; 
                      text-decoration: none; padding: 12px 28px; border-radius: 6px; font-weight: bold; 
                      font-size: 16px; letter-spacing: 0.5px;">
              Confirm My Email
            </a>

            <!-- Code Section -->
            <p style="margin-top: 25px; color: #777777; font-size: 14px;">Or use this code:</p>
            <div style="font-size: 26px; font-weight: bold; color: #008753; letter-spacing: 4px; margin-top: 8px;">
              ${code}
            </div>

            <p style="font-size: 13px; color: #999999; margin-top: 20px;">
              This confirmation link and code will expire in <strong>1 hour</strong>.
            </p>

            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">

            <!-- Footer -->
            <p style="font-size: 14px; color: #888888; line-height: 1.5;">
              Cheers,<br>
              <strong style="color: #008753;">The SabiWay Team</strong>
            </p>

            <p style="font-size: 12px; color: #bbbbbb; margin-top: 10px;">
              If you didn’t sign up for SabiWay, you can safely ignore this email.
            </p>
          </div>
        </div>
      </div>
      `,

      text: `
    Welcome, ${full_name} 👋

    Thanks for joining SabiWay — where connection and community thrive.
    Please confirm your email address to activate your account.

    Confirm your email:
    ${confirmUrl}

    Or enter this 4-digit code: ${code}

    This confirmation link and code will expire in 1 hour.

    Cheers,
    The SabiWay Team
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
    res.status(400).json({ error: "Something went wrong. Please check your details and try again." });
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
