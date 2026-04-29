import { Request, Response } from "express";
import nodemailer from "nodemailer";

interface ContactRequest {
  fullName: string;
  email: string;
  phone?: string;
  reason: string;
  message: string;
}

// Configure nodemailer transporter
const getTransporter = () => nodemailer.createTransport({
  host: "smtp.sendgrid.net",
  port: 587,
  auth: {
    user: "apikey",
    pass: process.env.SENDGRID_API_KEY,
  },
});

export const sendContactMessage = async (req: Request, res: Response) => {
  try {
    const transporter = getTransporter();
    const { fullName, email, phone, reason, message }: ContactRequest = req.body;

    // Validate required fields
    if (!fullName || !email || !message) {
      return res.status(400).json({ error: "Full name, email, and message are required" });
    }

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
            <p style="white-space: pre-wrap; line-height: 1.6;">${message}</p>
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
            <p style="white-space: pre-wrap; line-height: 1.6;">${message}</p>
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
      if (process.env.SENDGRID_API_KEY) {
        await transporter.sendMail(supportMailOptions);
        await transporter.sendMail(userMailOptions);
        console.log("Emails sent successfully via SendGrid for contact form submission");
      } else {
        console.log("SendGrid credentials not configured - skipping email sending");
        console.log("Contact form data:", { fullName, email, phone, reason, message });
      }
    } catch (emailError: any) {
      console.error("Email sending error:", emailError);
      if (emailError.response) {
         console.error(emailError.response.body);
      }
      // Don't fail the request even if email fails - just log it
      console.log("Contact form was accepted despite email error");
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
