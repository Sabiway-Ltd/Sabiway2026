const express = require("express");
const router = express.Router();
const { Resend } = require("resend");
const { RESEND_API_KEY, DEFAULT_FROM_EMAIL } = require("../config");

const resend = new Resend(RESEND_API_KEY);

router.get("/", async (req, res) => {
  try {
    const emailResponse = await resend.emails.send({
      from: DEFAULT_FROM_EMAIL, // use Resend’s verified sender for testing
      to: "abdullahadesinadhikrullah@gmail.com",
      subject: "Test Email from Express 🚀",
      html: "<p>This is a test email from SabiWay backend using Resend.</p>",
    });

    console.log("📧 Test email response:", emailResponse);
    res.json({ message: "Test email sent!", emailResponse });
  } catch (error) {
    console.error("❌ Error sending test email:", error);
    res.status(500).json({ message: "Email send failed", error: error.message });
  }
});

module.exports = router;
