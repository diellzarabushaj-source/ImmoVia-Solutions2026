import { Router, type IRouter } from "express";
import { Resend } from "resend";

const router: IRouter = Router();

router.post("/contact", async (req, res): Promise<void> => {
  const { name, email, subject, message } = req.body as {
    name?: string;
    email?: string;
    subject?: string;
    message?: string;
  };

  if (!name || !email || !subject || !message) {
    res.status(400).json({ error: "All fields are required." });
    return;
  }

  if (name.length < 2 || subject.length < 2 || message.length < 10) {
    res.status(400).json({ error: "Fields too short." });
    return;
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    res.status(400).json({ error: "Invalid email address." });
    return;
  }
  const adminEmail = process.env["ADMIN_EMAIL"];
  const apiKey = process.env["RESEND_API_KEY"];

  if (apiKey && adminEmail) {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from: "ImmoVia <onboarding@resend.dev>",
      to: adminEmail,
      replyTo: email,
      subject: `Contact Form: ${subject}`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#1a1a1a">
          <div style="background:#0f2044;padding:24px 32px;border-radius:8px 8px 0 0">
            <h1 style="color:#fff;margin:0;font-size:20px;font-weight:700">ImmoVia — New Contact Message</h1>
          </div>
          <div style="background:#f8fafc;padding:32px;border:1px solid #e2e8f0;border-radius:0 0 8px 8px">
            <table style="width:100%;border-collapse:collapse">
              <tr><td style="padding:8px 0;color:#64748b;width:120px">Name</td><td style="padding:8px 0;font-weight:600">${name}</td></tr>
              <tr><td style="padding:8px 0;color:#64748b">Email</td><td style="padding:8px 0"><a href="mailto:${email}" style="color:#1a3a6e">${email}</a></td></tr>
              <tr><td style="padding:8px 0;color:#64748b">Subject</td><td style="padding:8px 0">${subject}</td></tr>
              <tr><td style="padding:8px 0;color:#64748b;vertical-align:top">Message</td><td style="padding:8px 0;white-space:pre-wrap">${message}</td></tr>
            </table>
            <div style="margin-top:24px">
              <a href="mailto:${email}" style="background:#1a3a6e;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600;display:inline-block">
                Reply to ${name}
              </a>
            </div>
          </div>
          <p style="color:#94a3b8;font-size:12px;text-align:center;margin-top:16px">ImmoVia Platform &mdash; Contact Form</p>
        </div>
      `,
    });
    if (error) {
      req.log.error({ error }, "Failed to send contact email");
    } else {
      req.log.info({ to: adminEmail }, "Contact email sent");
    }
  } else {
    req.log.warn("Email not configured — contact form submitted but no email sent");
  }

  res.json({ ok: true });
});

export default router;
