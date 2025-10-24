// config/index.js

module.exports = {
  DJANGO_BASE_URL: "https://sabiway-9wq4.onrender.com/api",
  RESEND_API_KEY: "re_cV9BwHsi_GDtS6kPGHrTnJGpwD5Vf6HNQ",
  DEFAULT_FROM_EMAIL: "SabiWay <info@sabiway.com>",
  DEFAULT_TO_EMAIL: "chiadetech@gmail.com",

  CONFIRMATION_SECRET: "supersecret", // Keep secret in env
  CONFIRMATION_EXPIRY: "1h", // token valid for 1 hour
  // FRONTEND_URL: "http://localhost:3000"
  FRONTEND_URL: "https://sabiway2025.vercel.app"
};
