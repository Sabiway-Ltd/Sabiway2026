import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { name, email, subject, message, type } = await request.json();

    const payload = {
      sender: { name: "SabiWay", email: "noreply@brevo.com" }, // FIX HERE
      to: [{ email: "info@sabiway.com" }],
      subject: `New Contact Form Message — ${type}`,
      htmlContent: `
        <h2>New Contact Message</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Type:</strong> ${type}</p>
        <p><strong>Message:</strong></p>
        <p>${message}</p>
      `
    };

    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": process.env.BREVO_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    console.log("BREVO RESPONSE:", data);

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to send email", brevoError: data },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("SERVER ERROR:", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}
