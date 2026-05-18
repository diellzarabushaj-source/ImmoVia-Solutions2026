import { Resend } from "resend";
import { logger } from "./logger";

let resend: Resend | null = null;

function getResend(): Resend | null {
  const apiKey = process.env["RESEND_API_KEY"];
  if (!apiKey) return null;
  if (!resend) resend = new Resend(apiKey);
  return resend;
}

function adminEmail(): string {
  return process.env["ADMIN_EMAIL"] ?? "";
}

function appUrl(): string {
  const domains = process.env["REPLIT_DOMAINS"];
  if (domains) return `https://${domains.split(",")[0]}`;
  return "https://immo-via-solutions--immoviard.replit.app";
}

const NAV_STYLE = `background:#0f2044;padding:24px 32px;border-radius:8px 8px 0 0`;
const BODY_STYLE = `background:#f8fafc;padding:32px;border:1px solid #e2e8f0;border-radius:0 0 8px 8px`;
const BTN_STYLE = `background:#1a3a6e;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600;display:inline-block`;
const FOOTER_STYLE = `color:#94a3b8;font-size:12px;text-align:center;margin-top:16px`;
const WRAP_STYLE = `font-family:sans-serif;max-width:600px;margin:0 auto;color:#1a1a1a`;

export async function sendNewProjectNotification(project: {
  fullName: string;
  email: string;
  phone: string;
  projectType: string;
  description: string;
  city: string;
  budget?: string | null;
  timeline?: string | null;
}): Promise<void> {
  const client = getResend();
  const to = adminEmail();
  if (!client || !to) {
    logger.warn("Email not configured — skipping project notification (set RESEND_API_KEY and ADMIN_EMAIL)");
    return;
  }

  const { error } = await client.emails.send({
    from: "ImmoVia <onboarding@resend.dev>",
    to,
    subject: `New Project Request — ${project.projectType} in ${project.city}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#1a1a1a">
        <div style="background:#0f2044;padding:24px 32px;border-radius:8px 8px 0 0">
          <h1 style="color:#fff;margin:0;font-size:20px;font-weight:700">ImmoVia — New Project Request</h1>
        </div>
        <div style="background:#f8fafc;padding:32px;border:1px solid #e2e8f0;border-radius:0 0 8px 8px">
          <table style="width:100%;border-collapse:collapse">
            <tr><td style="padding:8px 0;color:#64748b;width:140px">Client</td><td style="padding:8px 0;font-weight:600">${project.fullName}</td></tr>
            <tr><td style="padding:8px 0;color:#64748b">Email</td><td style="padding:8px 0">${project.email}</td></tr>
            <tr><td style="padding:8px 0;color:#64748b">Phone</td><td style="padding:8px 0">${project.phone}</td></tr>
            <tr><td style="padding:8px 0;color:#64748b">Project Type</td><td style="padding:8px 0;text-transform:capitalize">${project.projectType}</td></tr>
            <tr><td style="padding:8px 0;color:#64748b">City</td><td style="padding:8px 0">${project.city}</td></tr>
            ${project.budget ? `<tr><td style="padding:8px 0;color:#64748b">Budget</td><td style="padding:8px 0">${project.budget}</td></tr>` : ""}
            ${project.timeline ? `<tr><td style="padding:8px 0;color:#64748b">Timeline</td><td style="padding:8px 0">${project.timeline}</td></tr>` : ""}
            <tr><td style="padding:8px 0;color:#64748b;vertical-align:top">Description</td><td style="padding:8px 0">${project.description}</td></tr>
          </table>
          <div style="margin-top:24px">
            <a href="https://immo-via-solutions--immoviard.replit.app/admin" style="background:#1a3a6e;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600;display:inline-block">
              Review in Admin Panel
            </a>
          </div>
        </div>
        <p style="color:#94a3b8;font-size:12px;text-align:center;margin-top:16px">ImmoVia Platform &mdash; Automated Notification</p>
      </div>
    `,
  });

  if (error) {
    logger.error({ error }, "Failed to send project notification email");
  } else {
    logger.info({ to, type: "project" }, "Project notification email sent");
  }
}

export async function sendNewCompanyNotification(company: {
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  serviceTypes: string[];
  city: string;
  description?: string | null;
  website?: string | null;
  licenseNumber?: string | null;
  yearsExperience?: number | null;
}): Promise<void> {
  const client = getResend();
  const to = adminEmail();
  if (!client || !to) {
    logger.warn("Email not configured — skipping company notification (set RESEND_API_KEY and ADMIN_EMAIL)");
    return;
  }

  const { error } = await client.emails.send({
    from: "ImmoVia <onboarding@resend.dev>",
    to,
    subject: `New Company Registration — ${company.companyName}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#1a1a1a">
        <div style="background:#0f2044;padding:24px 32px;border-radius:8px 8px 0 0">
          <h1 style="color:#fff;margin:0;font-size:20px;font-weight:700">ImmoVia — New Company Registration</h1>
        </div>
        <div style="background:#f8fafc;padding:32px;border:1px solid #e2e8f0;border-radius:0 0 8px 8px">
          <table style="width:100%;border-collapse:collapse">
            <tr><td style="padding:8px 0;color:#64748b;width:160px">Company</td><td style="padding:8px 0;font-weight:600">${company.companyName}</td></tr>
            <tr><td style="padding:8px 0;color:#64748b">Contact</td><td style="padding:8px 0">${company.contactName}</td></tr>
            <tr><td style="padding:8px 0;color:#64748b">Email</td><td style="padding:8px 0">${company.email}</td></tr>
            <tr><td style="padding:8px 0;color:#64748b">Phone</td><td style="padding:8px 0">${company.phone}</td></tr>
            <tr><td style="padding:8px 0;color:#64748b">City</td><td style="padding:8px 0">${company.city}</td></tr>
            <tr><td style="padding:8px 0;color:#64748b">Services</td><td style="padding:8px 0">${company.serviceTypes.join(", ")}</td></tr>
            ${company.yearsExperience ? `<tr><td style="padding:8px 0;color:#64748b">Experience</td><td style="padding:8px 0">${company.yearsExperience} years</td></tr>` : ""}
            ${company.licenseNumber ? `<tr><td style="padding:8px 0;color:#64748b">License</td><td style="padding:8px 0">${company.licenseNumber}</td></tr>` : ""}
            ${company.website ? `<tr><td style="padding:8px 0;color:#64748b">Website</td><td style="padding:8px 0"><a href="${company.website}" style="color:#1a3a6e">${company.website}</a></td></tr>` : ""}
            ${company.description ? `<tr><td style="padding:8px 0;color:#64748b;vertical-align:top">Description</td><td style="padding:8px 0">${company.description}</td></tr>` : ""}
          </table>
          <div style="margin-top:24px">
            <a href="https://immo-via-solutions--immoviard.replit.app/admin" style="background:#1a3a6e;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600;display:inline-block">
              Review in Admin Panel
            </a>
          </div>
        </div>
        <p style="color:#94a3b8;font-size:12px;text-align:center;margin-top:16px">ImmoVia Platform &mdash; Automated Notification</p>
      </div>
    `,
  });

  if (error) {
    logger.error({ error }, "Failed to send company notification email");
  } else {
    logger.info({ to, type: "company" }, "Company notification email sent");
  }
}

export async function sendNewOfferNotification(data: {
  clientEmail: string;
  clientName: string;
  providerName: string;
  providerCompany: string | null;
  projectType: string;
  city: string;
  message: string;
  priceEstimate: string | null;
  projectId: number;
}): Promise<void> {
  const client = getResend();
  if (!client || !data.clientEmail) {
    logger.warn("Email not configured — skipping new offer notification");
    return;
  }
  const senderLabel = data.providerCompany ?? data.providerName;
  const { error } = await client.emails.send({
    from: "ImmoVia <onboarding@resend.dev>",
    to: data.clientEmail,
    subject: `New offer on your project — ${senderLabel}`,
    html: `
      <div style="${WRAP_STYLE}">
        <div style="${NAV_STYLE}">
          <h1 style="color:#fff;margin:0;font-size:20px;font-weight:700">ImmoVia — New Offer Received</h1>
        </div>
        <div style="${BODY_STYLE}">
          <p style="margin:0 0 16px">Hi ${data.clientName},</p>
          <p style="margin:0 0 20px">A new offer has been submitted for your <strong>${data.projectType}</strong> project in <strong>${data.city}</strong>.</p>
          <table style="width:100%;border-collapse:collapse">
            <tr><td style="padding:8px 0;color:#64748b;width:140px">From</td><td style="padding:8px 0;font-weight:600">${senderLabel}</td></tr>
            ${data.priceEstimate ? `<tr><td style="padding:8px 0;color:#64748b">Estimate</td><td style="padding:8px 0">${data.priceEstimate}</td></tr>` : ""}
            <tr><td style="padding:8px 0;color:#64748b;vertical-align:top">Message</td><td style="padding:8px 0">${data.message}</td></tr>
          </table>
          <div style="margin-top:24px">
            <a href="${appUrl()}/dashboard" style="${BTN_STYLE}">View Offer</a>
          </div>
        </div>
        <p style="${FOOTER_STYLE}">ImmoVia Platform &mdash; Automated Notification</p>
      </div>
    `,
  });
  if (error) logger.error({ error }, "Failed to send new offer notification");
  else logger.info({ to: data.clientEmail, type: "new_offer" }, "New offer notification sent");
}

export async function sendOfferAcceptedNotification(data: {
  providerEmail: string;
  providerName: string;
  clientName: string;
  projectType: string;
  city: string;
  offerId: number;
}): Promise<void> {
  const client = getResend();
  if (!client || !data.providerEmail) {
    logger.warn("Email not configured — skipping offer accepted notification");
    return;
  }
  const { error } = await client.emails.send({
    from: "ImmoVia <onboarding@resend.dev>",
    to: data.providerEmail,
    subject: `Your offer was accepted — ${data.projectType} in ${data.city}`,
    html: `
      <div style="${WRAP_STYLE}">
        <div style="${NAV_STYLE}">
          <h1 style="color:#fff;margin:0;font-size:20px;font-weight:700">ImmoVia — Offer Accepted</h1>
        </div>
        <div style="${BODY_STYLE}">
          <p style="margin:0 0 16px">Hi ${data.providerName},</p>
          <p style="margin:0 0 20px">Great news! <strong>${data.clientName}</strong> has accepted your offer for the <strong>${data.projectType}</strong> project in <strong>${data.city}</strong>.</p>
          <p style="margin:0 0 20px">You can now message the client directly through the platform to coordinate next steps.</p>
          <div style="margin-top:24px">
            <a href="${appUrl()}/provider" style="${BTN_STYLE}">Open Dashboard</a>
          </div>
        </div>
        <p style="${FOOTER_STYLE}">ImmoVia Platform &mdash; Automated Notification</p>
      </div>
    `,
  });
  if (error) logger.error({ error }, "Failed to send offer accepted notification");
  else logger.info({ to: data.providerEmail, type: "offer_accepted" }, "Offer accepted notification sent");
}

export async function sendNewMessageNotification(data: {
  recipientEmail: string;
  recipientName: string;
  senderName: string;
  preview: string;
  offerId: number;
}): Promise<void> {
  const client = getResend();
  if (!client || !data.recipientEmail) {
    logger.warn("Email not configured — skipping message notification");
    return;
  }
  const safePreview = data.preview.length > 120 ? data.preview.slice(0, 120) + "…" : data.preview;
  const { error } = await client.emails.send({
    from: "ImmoVia <onboarding@resend.dev>",
    to: data.recipientEmail,
    subject: `New message from ${data.senderName}`,
    html: `
      <div style="${WRAP_STYLE}">
        <div style="${NAV_STYLE}">
          <h1 style="color:#fff;margin:0;font-size:20px;font-weight:700">ImmoVia — New Message</h1>
        </div>
        <div style="${BODY_STYLE}">
          <p style="margin:0 0 16px">Hi ${data.recipientName},</p>
          <p style="margin:0 0 8px"><strong>${data.senderName}</strong> sent you a message:</p>
          <blockquote style="margin:0 0 20px;padding:12px 16px;background:#e8f0fd;border-left:4px solid #1a3a6e;border-radius:4px;font-style:italic;color:#334155">${safePreview}</blockquote>
          <div style="margin-top:24px">
            <a href="${appUrl()}/dashboard" style="${BTN_STYLE}">Reply</a>
          </div>
        </div>
        <p style="${FOOTER_STYLE}">ImmoVia Platform &mdash; Automated Notification</p>
      </div>
    `,
  });
  if (error) logger.error({ error }, "Failed to send message notification");
  else logger.info({ to: data.recipientEmail, type: "new_message" }, "Message notification sent");
}
