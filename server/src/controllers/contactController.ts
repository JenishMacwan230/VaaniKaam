import { Request, Response } from "express";
import nodemailer from "nodemailer";

interface ContactRequest {
  fullName: string;
  email: string;
  phone?: string;
  reason: string;
  message: string;
}

// Send email using SendGrid REST API to bypass SMTP network blocks
const sendGridEmail = async (options: {from: string, to: string, subject: string, html: string, replyTo?: string}) => {
  // Parse "Name <email@example.com>" format
  const emailRegex = /<([^>]+)>/;
  const match = options.from.match(emailRegex);
  const fromEmail = match ? match[1] : options.from;
  const fromName = match ? options.from.replace(emailRegex, "").trim() : undefined;

  const payload: any = {
    personalizations: [{ to: [{ email: options.to }] }],
    from: { email: fromEmail, name: fromName },
    subject: options.subject,
    content: [{ type: "text/html", value: options.html }],
  };

  if (options.replyTo) {
    payload.reply_to = { email: options.replyTo };
  }

  const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.SENDGRID_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`SendGrid API Error (${response.status}): ${errorData}`);
  }
};

export const sendContactMessage = async (req: Request, res: Response) => {
  try {
    const { fullName, email, phone, reason, message }: ContactRequest = req.body;

    // Validate required fields
    if (!fullName || !email || !message) {
      return res.status(400).json({ error: "Full name, email, and message are required" });
    }

    // Escape HTML to prevent XSS
    const escapeHtml = (str: string) =>
      str ? str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;") : "";

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    const senderEmail = process.env.SENDER_EMAIL || "jenishmacwan230@gmail.com";
    const supportEmail = process.env.SUPPORT_EMAIL || "jenishmacwan230@gmail.com";

    // Email to support team
    const supportMailOptions = {
      from: `VaaniKaam Form <${senderEmail}>`,
      to: supportEmail,
      subject: `New Contact Form Submission: ${reason}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #16a34a;">New Message from VaaniKaam Contact Form</h2>
          
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Full Name:</strong> ${fullName}</p>
            <p><strong>Email:</strong> ${email}</p>
            ${phone ? `<p><strong>Phone:</strong> ${phone}</p>` : ""}
            <p><strong>Reason:</strong> ${reason}</p>
            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
            <p><strong>Message:</strong></p>
            <p style="white-space: pre-wrap; line-height: 1.6;">${escapeHtml(message)}</p>
          </div>

          <p style="color: #666; font-size: 12px; margin-top: 20px;">
            This is an automated message from the VaaniKaam contact form.
          </p>
        </div>
      `,
      replyTo: email,
    };

    // Confirmation email to user
    const userMailOptions = {
      from: `VaaniKaam Support <${senderEmail}>`,
      to: email,
      subject: "We've received your message - VaaniKaam Support",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #16a34a;">Thanks for reaching out!</h2>
          
          <p>Hi ${fullName},</p>
          
          <p>We have received your message and our team will get back to you within one business day.</p>
          
          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Your Message Summary:</strong></p>
            <p><strong>Reason:</strong> ${reason}</p>
            <p style="white-space: pre-wrap; line-height: 1.6;">${escapeHtml(message)}</p>
          </div>

          <p>If your query is urgent, you can reach us at:</p>
          <ul style="color: #666;">
            <li>Email: support@vaanikaam.com</li>
            <li>Phone: +91 70228 90011 (Mon–Sat, 9–7 IST)</li>
            <li>HQ: Tower 4, Brigade Tech Gardens, Bengaluru</li>
          </ul>

          <p>Best regards,<br><strong>VaaniKaam Support Team</strong></p>
          
          <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
          <p style="color: #999; font-size: 12px;">
            © 2024 VaaniKaam. All rights reserved.
          </p>
        </div>
      `,
    };

    // Send emails
    try {
      if (!process.env.SENDGRID_API_KEY) {
        return res.status(503).json({ 
          error: "Email service not configured. Please contact support directly." 
        });
      }
      await sendGridEmail(supportMailOptions);
      await sendGridEmail(userMailOptions);
      console.log("Emails sent successfully via SendGrid REST API for contact form submission");
    } catch (emailError: any) {
      console.error("Email sending error:", emailError.message || emailError);
      return res.status(500).json({ 
        error: "Failed to send email. Please verify your SendGrid account and sender identity.",
        details: emailError.message || "Unknown error"
      });
    }

    res.status(200).json({
      success: true,
      message: "Your message has been sent successfully. We'll get back to you soon!",
    });
  } catch (error) {
    console.error("Contact form error:", error);
    res.status(500).json({
      error: "Failed to process your request",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
