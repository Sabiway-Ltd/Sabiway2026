// routes/report.js
const express = require("express");
const router = express.Router();
const { Resend } = require("resend");
const {DEFAULT_TO_EMAIL, DEFAULT_FROM_EMAIL, RESEND_API_KEY} = require("../config");

const resend = new Resend(RESEND_API_KEY);

router.post("/", async (req, res) => {
  const { post_id, reason, post_url } = req.body;

  if (!reason || !post_id || !post_url) {
    return res.status(400).json({ message: "Missing required fields." });
  }

  try {
    const emailResponse = await resend.emails.send({
      from: DEFAULT_FROM_EMAIL, // use your verified domain or Resend address
      to: DEFAULT_TO_EMAIL,
      subject: `🚨 Report for Post ${post_id}`,
      html: `
        <h2>🚨 A Post Has Been Reported</h2>
        <p><strong>Post URL:</strong> <a href="${post_url}" target="_blank">${post_url}</a></p>
        <p><strong>Reason:</strong></p>
        <p>${reason}</p>
      `,
    });

    console.log("Report email sent:", emailResponse.id);
    res.status(200).json({ message: "Report sent successfully." });
  } catch (error) {
    console.error("Resend email error:", error);
    res.status(500).json({ message: "Failed to send report." });
  }
});

module.exports = router;
