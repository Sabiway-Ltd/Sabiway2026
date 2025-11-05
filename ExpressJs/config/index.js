// config/index.js

module.exports = {
  // FOR DOCKER
  // DJANGO_BASE_URL: "http://web:8000/api",

  // FOR LOCAL TESTING
  // DJANGO_BASE_URL: "http://localhost:8000/api",
  // FRONTEND_URL: "http://localhost:3000",


  DJANGO_BASE_URL: "https://sabiway-9wq4.onrender.com/api",
  FRONTEND_URL: "https://sabiway2025.vercel.app",

  PORT: 5000,
  RESEND_API_KEY: "re_cV9BwHsi_GDtS6kPGHrTnJGpwD5Vf6HNQ",
  DEFAULT_FROM_EMAIL: "SabiWay <info@sabiway.com>",
  DEFAULT_TO_EMAIL: "chiadetech@gmail.com",

  CONFIRMATION_SECRET: "supersecret", // Keep secret in env
  CONFIRMATION_EXPIRY: "1h", // token valid for 1 hour
  
};
