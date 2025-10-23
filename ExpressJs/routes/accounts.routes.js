// routes/accounts.routes.js

const express = require("express");
const router = express.Router();
const controller = require("../controllers/accounts.controller");


router.post("/signup", controller.signup);
router.post("/confirm-signup", controller.confirmSignup);
router.post("/verify-signup-code", controller.verifySignupCode);
router.post("/login", controller.login);
router.post("/google-login", controller.googleLogin);
router.post("/forgot-password", controller.forgotPassword);
router.post("/confirm-code", controller.confirmCode);
router.post("/reset-password/:token", controller.resetPassword);
router.post("/logout", controller.logout);
router.get("/generate-google-url", controller.generateGoogleUrl);



module.exports = router;
