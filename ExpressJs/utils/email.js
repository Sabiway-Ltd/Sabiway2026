// utils/email.js
const { Resend } = require("resend");
const { RESEND_API_KEY, DEFAULT_FROM_EMAIL } = require("../config");

const resend = new Resend(RESEND_API_KEY);

exports.sendEmail = async ({ to, subject, html }) => {
  try {
    const { data, error } = await resend.emails.send({
      from: DEFAULT_FROM_EMAIL,
      to,
      subject,
      html,
    });

    if (error) {
      console.error("❌ Resend send error:", error);
      throw new Error(error.message || "Email send failed");
    }

    console.log("📧 Email sent successfully:", data?.id || data);
    return data;
  } catch (err) {
    console.error("❌ Failed to send email:", err);
    throw new Error("Email send failed");
  }
};
