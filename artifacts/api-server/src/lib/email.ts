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
    from: "ImmoVia <notifications@immovia.al>",
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
    from: "ImmoVia <notifications@immovia.al>",
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
