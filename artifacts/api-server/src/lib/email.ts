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

type Lang = "sq" | "en" | "de" | "fr";

function normLang(lang: string | null | undefined): Lang {
  if (lang === "sq" || lang === "de" || lang === "fr") return lang;
  return "en";
}

// ── Rate limiting for message notifications ───────────────────────────────────
// key: `recipientUserId:offerId`  value: timestamp of last email sent
const messageEmailCooldown = new Map<string, number>();
const MESSAGE_COOLDOWN_MS = 60 * 60 * 1000; // 1 hour

function canSendMessageEmail(recipientUserId: number, offerId: number): boolean {
  const key = `${recipientUserId}:${offerId}`;
  const lastSent = messageEmailCooldown.get(key);
  if (lastSent && Date.now() - lastSent < MESSAGE_COOLDOWN_MS) return false;
  messageEmailCooldown.set(key, Date.now());
  return true;
}

// ── i18n strings ──────────────────────────────────────────────────────────────

const i18n = {
  newOffer: {
    subject: {
      sq: (sender: string) => `Ofertë e re — ${sender}`,
      en: (sender: string) => `New offer on your project — ${sender}`,
      de: (sender: string) => `Neues Angebot für Ihr Projekt — ${sender}`,
      fr: (sender: string) => `Nouvelle offre sur votre projet — ${sender}`,
    },
    heading: {
      sq: "ImmoVia365 — Ofertë e Re",
      en: "ImmoVia365 — New Offer Received",
      de: "ImmoVia365 — Neues Angebot",
      fr: "ImmoVia365 — Nouvelle Offre",
    },
    hi: {
      sq: (name: string) => `Përshëndetje ${name},`,
      en: (name: string) => `Hi ${name},`,
      de: (name: string) => `Hallo ${name},`,
      fr: (name: string) => `Bonjour ${name},`,
    },
    intro: {
      sq: (type: string, city: string) => `Një ofertë e re ka mbërritur për projektin tuaj <strong>${type}</strong> në <strong>${city}</strong>.`,
      en: (type: string, city: string) => `A new offer has been submitted for your <strong>${type}</strong> project in <strong>${city}</strong>.`,
      de: (type: string, city: string) => `Ein neues Angebot wurde für Ihr <strong>${type}</strong>-Projekt in <strong>${city}</strong> eingereicht.`,
      fr: (type: string, city: string) => `Une nouvelle offre a été soumise pour votre projet <strong>${type}</strong> à <strong>${city}</strong>.`,
    },
    labelFrom: { sq: "Nga", en: "From", de: "Von", fr: "De" },
    labelEstimate: { sq: "Vlerësimi", en: "Estimate", de: "Schätzung", fr: "Estimation" },
    labelMessage: { sq: "Mesazhi", en: "Message", de: "Nachricht", fr: "Message" },
    cta: { sq: "Shiko Ofertën", en: "View Offer", de: "Angebot ansehen", fr: "Voir l'offre" },
  },
  offerAccepted: {
    subject: {
      sq: (type: string, city: string) => `Oferta juaj u pranua — ${type} në ${city}`,
      en: (type: string, city: string) => `Your offer was accepted — ${type} in ${city}`,
      de: (type: string, city: string) => `Ihr Angebot wurde angenommen — ${type} in ${city}`,
      fr: (type: string, city: string) => `Votre offre a été acceptée — ${type} à ${city}`,
    },
    heading: {
      sq: "ImmoVia365 — Ofertë e Pranuar",
      en: "ImmoVia365 — Offer Accepted",
      de: "ImmoVia365 — Angebot angenommen",
      fr: "ImmoVia365 — Offre acceptée",
    },
    hi: {
      sq: (name: string) => `Përshëndetje ${name},`,
      en: (name: string) => `Hi ${name},`,
      de: (name: string) => `Hallo ${name},`,
      fr: (name: string) => `Bonjour ${name},`,
    },
    body: {
      sq: (client: string, type: string, city: string) => `Lajm i mirë! <strong>${client}</strong> ka pranuar ofertën tuaj për projektin <strong>${type}</strong> në <strong>${city}</strong>.`,
      en: (client: string, type: string, city: string) => `Great news! <strong>${client}</strong> has accepted your offer for the <strong>${type}</strong> project in <strong>${city}</strong>.`,
      de: (client: string, type: string, city: string) => `Gute Neuigkeiten! <strong>${client}</strong> hat Ihr Angebot für das Projekt <strong>${type}</strong> in <strong>${city}</strong> angenommen.`,
      fr: (client: string, type: string, city: string) => `Bonne nouvelle ! <strong>${client}</strong> a accepté votre offre pour le projet <strong>${type}</strong> à <strong>${city}</strong>.`,
    },
    next: {
      sq: "Tani mund të dërgoni mesazhe drejtpërdrejt te klienti nëpërmjet platformës.",
      en: "You can now message the client directly through the platform to coordinate next steps.",
      de: "Sie können den Kunden jetzt direkt über die Plattform kontaktieren, um die nächsten Schritte zu koordinieren.",
      fr: "Vous pouvez maintenant contacter le client directement via la plateforme pour coordonner les prochaines étapes.",
    },
    cta: { sq: "Hap Panelin", en: "Open Dashboard", de: "Dashboard öffnen", fr: "Ouvrir le tableau de bord" },
  },
  newMessage: {
    subject: {
      sq: (sender: string) => `Mesazh i ri nga ${sender}`,
      en: (sender: string) => `New message from ${sender}`,
      de: (sender: string) => `Neue Nachricht von ${sender}`,
      fr: (sender: string) => `Nouveau message de ${sender}`,
    },
    heading: {
      sq: "ImmoVia365 — Mesazh i Ri",
      en: "ImmoVia365 — New Message",
      de: "ImmoVia365 — Neue Nachricht",
      fr: "ImmoVia365 — Nouveau Message",
    },
    hi: {
      sq: (name: string) => `Përshëndetje ${name},`,
      en: (name: string) => `Hi ${name},`,
      de: (name: string) => `Hallo ${name},`,
      fr: (name: string) => `Bonjour ${name},`,
    },
    sent: {
      sq: (sender: string) => `<strong>${sender}</strong> ju ka dërguar një mesazh:`,
      en: (sender: string) => `<strong>${sender}</strong> sent you a message:`,
      de: (sender: string) => `<strong>${sender}</strong> hat Ihnen eine Nachricht gesendet:`,
      fr: (sender: string) => `<strong>${sender}</strong> vous a envoyé un message :`,
    },
    cta: { sq: "Përgjigju", en: "Reply", de: "Antworten", fr: "Répondre" },
    dashPath: { sq: "/dashboard", en: "/dashboard", de: "/dashboard", fr: "/dashboard" },
    providerPath: { sq: "/provider", en: "/provider", de: "/provider", fr: "/provider" },
  },
};

function footer(lang: Lang): string {
  const text = {
    sq: "Platforma ImmoVia365 &mdash; Njoftim Automatik",
    en: "ImmoVia365 Platform &mdash; Automated Notification",
    de: "ImmoVia365 Plattform &mdash; Automatische Benachrichtigung",
    fr: "Plateforme ImmoVia365 &mdash; Notification automatique",
  };
  return `<p style="${FOOTER_STYLE}">${text[lang]}</p>`;
}

// ── sendNewProjectNotification ────────────────────────────────────────────────
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
    from: "ImmoVia365 <onboarding@resend.dev>",
    to,
    subject: `New Project Request — ${project.projectType} in ${project.city}`,
    html: `
      <div style="${WRAP_STYLE}">
        <div style="${NAV_STYLE}">
          <h1 style="color:#fff;margin:0;font-size:20px;font-weight:700">ImmoVia365 — New Project Request</h1>
        </div>
        <div style="${BODY_STYLE}">
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
            <a href="${appUrl()}/admin" style="${BTN_STYLE}">Review in Admin Panel</a>
          </div>
        </div>
        ${footer("en")}
      </div>
    `,
  });

  if (error) {
    logger.error({ error }, "Failed to send project notification email");
  } else {
    logger.info({ to, type: "project" }, "Project notification email sent");
  }
}

// ── sendProjectConfirmationToClient ──────────────────────────────────────────
export async function sendProjectConfirmationToClient(project: {
  fullName: string;
  email: string;
  projectType: string;
  city: string;
  budget?: string | null;
  timeline?: string | null;
}): Promise<void> {
  const client = getResend();
  if (!client || !project.email) {
    logger.warn("Email not configured — skipping client project confirmation");
    return;
  }

  const { error } = await client.emails.send({
    from: "ImmoVia365 <onboarding@resend.dev>",
    to: project.email,
    subject: `Ihre Anfrage wurde erfolgreich eingereicht — ImmoVia365`,
    html: `
      <div style="${WRAP_STYLE}">
        <div style="${NAV_STYLE}">
          <h1 style="color:#fff;margin:0;font-size:20px;font-weight:700">ImmoVia365 — Anfrage bestätigt</h1>
        </div>
        <div style="${BODY_STYLE}">
          <p style="margin:0 0 12px">Guten Tag <strong>${project.fullName}</strong>,</p>
          <p style="margin:0 0 20px">Ihre Anfrage für <strong>${project.projectType}</strong> in <strong>${project.city}</strong> wurde erfolgreich eingereicht. Unser Team ist bereits informiert.</p>

          <div style="background:#e8f0fd;border-left:4px solid #1a3a6e;border-radius:6px;padding:20px;margin:0 0 24px">
            <p style="margin:0 0 14px;font-weight:600;color:#0f2044;font-size:14px">Was passiert als nächstes?</p>
            <table style="width:100%;border-collapse:collapse">
              <tr><td style="padding:5px 0;vertical-align:top;width:28px;color:#1a3a6e;font-weight:700;font-size:14px">1.</td><td style="padding:5px 0;font-size:14px">Unser Team prüft Ihre Anfrage innerhalb von 24 Stunden.</td></tr>
              <tr><td style="padding:5px 0;vertical-align:top;color:#1a3a6e;font-weight:700;font-size:14px">2.</td><td style="padding:5px 0;font-size:14px">Passende Fachbetriebe werden benachrichtigt und können Angebote einreichen.</td></tr>
              <tr><td style="padding:5px 0;vertical-align:top;color:#1a3a6e;font-weight:700;font-size:14px">3.</td><td style="padding:5px 0;font-size:14px">Sie erhalten Angebote direkt per E-Mail und können vergleichen.</td></tr>
            </table>
          </div>

          ${project.budget ? `<p style="font-size:13px;color:#64748b;margin:0 0 6px">Budget: <strong>${project.budget}</strong></p>` : ""}
          ${project.timeline ? `<p style="font-size:13px;color:#64748b;margin:0 0 20px">Zeitrahmen: <strong>${project.timeline}</strong></p>` : ""}

          <p style="margin:0 0 20px;font-size:13px;color:#64748b">Sie können auch direkt Firmen in unserem Verzeichnis durchsuchen und Kontakt aufnehmen.</p>

          <div style="margin-top:8px">
            <a href="${appUrl()}/companies" style="${BTN_STYLE}">Firmen entdecken</a>
          </div>
        </div>
        ${footer("de")}
      </div>
    `,
  });

  if (error) {
    logger.error({ error }, "Failed to send project confirmation to client");
  } else {
    logger.info({ to: project.email, type: "project_confirmation" }, "Project confirmation sent to client");
  }
}

// ── sendNewCompanyNotification ────────────────────────────────────────────────
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
    from: "ImmoVia365 <onboarding@resend.dev>",
    to,
    subject: `New Company Registration — ${company.companyName}`,
    html: `
      <div style="${WRAP_STYLE}">
        <div style="${NAV_STYLE}">
          <h1 style="color:#fff;margin:0;font-size:20px;font-weight:700">ImmoVia365 — New Company Registration</h1>
        </div>
        <div style="${BODY_STYLE}">
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
            <a href="${appUrl()}/admin" style="${BTN_STYLE}">Review in Admin Panel</a>
          </div>
        </div>
        ${footer("en")}
      </div>
    `,
  });

  if (error) {
    logger.error({ error }, "Failed to send company notification email");
  } else {
    logger.info({ to, type: "company" }, "Company notification email sent");
  }
}

// ── sendNewOfferNotification ──────────────────────────────────────────────────
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
  language?: string | null;
}): Promise<void> {
  const client = getResend();
  if (!client || !data.clientEmail) {
    logger.warn("Email not configured — skipping new offer notification");
    return;
  }
  const lang = normLang(data.language);
  const t = i18n.newOffer;
  const senderLabel = data.providerCompany ?? data.providerName;

  const { error } = await client.emails.send({
    from: "ImmoVia365 <onboarding@resend.dev>",
    to: data.clientEmail,
    subject: t.subject[lang](senderLabel),
    html: `
      <div style="${WRAP_STYLE}">
        <div style="${NAV_STYLE}">
          <h1 style="color:#fff;margin:0;font-size:20px;font-weight:700">${t.heading[lang]}</h1>
        </div>
        <div style="${BODY_STYLE}">
          <p style="margin:0 0 16px">${t.hi[lang](data.clientName)}</p>
          <p style="margin:0 0 20px">${t.intro[lang](data.projectType, data.city)}</p>
          <table style="width:100%;border-collapse:collapse">
            <tr><td style="padding:8px 0;color:#64748b;width:140px">${t.labelFrom[lang]}</td><td style="padding:8px 0;font-weight:600">${senderLabel}</td></tr>
            ${data.priceEstimate ? `<tr><td style="padding:8px 0;color:#64748b">${t.labelEstimate[lang]}</td><td style="padding:8px 0">${data.priceEstimate}</td></tr>` : ""}
            <tr><td style="padding:8px 0;color:#64748b;vertical-align:top">${t.labelMessage[lang]}</td><td style="padding:8px 0">${data.message}</td></tr>
          </table>
          <div style="margin-top:24px">
            <a href="${appUrl()}/dashboard" style="${BTN_STYLE}">${t.cta[lang]}</a>
          </div>
        </div>
        ${footer(lang)}
      </div>
    `,
  });
  if (error) logger.error({ error }, "Failed to send new offer notification");
  else logger.info({ to: data.clientEmail, type: "new_offer", lang }, "New offer notification sent");
}

// ── sendOfferAcceptedNotification ─────────────────────────────────────────────
export async function sendOfferAcceptedNotification(data: {
  providerEmail: string;
  providerName: string;
  clientName: string;
  projectType: string;
  city: string;
  offerId: number;
  language?: string | null;
}): Promise<void> {
  const client = getResend();
  if (!client || !data.providerEmail) {
    logger.warn("Email not configured — skipping offer accepted notification");
    return;
  }
  const lang = normLang(data.language);
  const t = i18n.offerAccepted;

  const { error } = await client.emails.send({
    from: "ImmoVia365 <onboarding@resend.dev>",
    to: data.providerEmail,
    subject: t.subject[lang](data.projectType, data.city),
    html: `
      <div style="${WRAP_STYLE}">
        <div style="${NAV_STYLE}">
          <h1 style="color:#fff;margin:0;font-size:20px;font-weight:700">${t.heading[lang]}</h1>
        </div>
        <div style="${BODY_STYLE}">
          <p style="margin:0 0 16px">${t.hi[lang](data.providerName)}</p>
          <p style="margin:0 0 20px">${t.body[lang](data.clientName, data.projectType, data.city)}</p>
          <p style="margin:0 0 20px">${t.next[lang]}</p>
          <div style="margin-top:24px">
            <a href="${appUrl()}/provider" style="${BTN_STYLE}">${t.cta[lang]}</a>
          </div>
        </div>
        ${footer(lang)}
      </div>
    `,
  });
  if (error) logger.error({ error }, "Failed to send offer accepted notification");
  else logger.info({ to: data.providerEmail, type: "offer_accepted", lang }, "Offer accepted notification sent");
}

// ── sendProjectPublishedNotification ─────────────────────────────────────────
export async function sendProjectPublishedNotification(data: {
  clientEmail: string;
  clientName: string;
  projectType: string;
  city: string;
  projectId: number;
}): Promise<void> {
  const client = getResend();
  if (!client || !data.clientEmail) return;
  const url = appUrl();
  const { error } = await client.emails.send({
    from: "ImmoVia365 <onboarding@resend.dev>",
    to: data.clientEmail,
    subject: `Ihr Projekt wurde veröffentlicht — ImmoVia365`,
    html: `
      <div style="${WRAP_STYLE}">
        <div style="${NAV_STYLE}"><h1 style="color:#fff;margin:0;font-size:20px;font-weight:700">ImmoVia365 — Projekt veröffentlicht</h1></div>
        <div style="${BODY_STYLE}">
          <p style="margin:0 0 12px">Guten Tag <strong>${data.clientName}</strong>,</p>
          <p style="margin:0 0 20px">Ihr Projekt <strong>${data.projectType}</strong> in <strong>${data.city}</strong> wurde geprüft und ist jetzt auf der Plattform veröffentlicht. Fachbetriebe können Ihr Projekt nun einsehen und Angebote einreichen.</p>
          <div style="margin-top:24px"><a href="${url}/dashboard" style="${BTN_STYLE}">Mein Dashboard</a></div>
        </div>
        ${footer("de")}
      </div>
    `,
  });
  if (error) logger.error({ error }, "Failed to send project published notification");
  else logger.info({ to: data.clientEmail, type: "project_published" }, "Project published notification sent");
}

// ── sendProjectRejectedNotification ──────────────────────────────────────────
export async function sendProjectRejectedNotification(data: {
  clientEmail: string;
  clientName: string;
  projectType: string;
  city: string;
  reason?: string | null;
}): Promise<void> {
  const client = getResend();
  if (!client || !data.clientEmail) return;
  const url = appUrl();
  const { error } = await client.emails.send({
    from: "ImmoVia365 <onboarding@resend.dev>",
    to: data.clientEmail,
    subject: `Ihr Projekt konnte nicht veröffentlicht werden — ImmoVia365`,
    html: `
      <div style="${WRAP_STYLE}">
        <div style="${NAV_STYLE}"><h1 style="color:#fff;margin:0;font-size:20px;font-weight:700">ImmoVia365 — Projektstatus</h1></div>
        <div style="${BODY_STYLE}">
          <p style="margin:0 0 12px">Guten Tag <strong>${data.clientName}</strong>,</p>
          <p style="margin:0 0 20px">Ihr Projekt <strong>${data.projectType}</strong> in <strong>${data.city}</strong> konnte leider nicht veröffentlicht werden.${data.reason ? ` <strong>Grund:</strong> ${data.reason}` : ""}</p>
          <p style="margin:0 0 20px;font-size:13px;color:#64748b">Sie können eine neue Anfrage einreichen oder unser Team kontaktieren.</p>
          <div style="margin-top:24px"><a href="${url}/dashboard" style="${BTN_STYLE}">Mein Dashboard</a></div>
        </div>
        ${footer("de")}
      </div>
    `,
  });
  if (error) logger.error({ error }, "Failed to send project rejected notification");
  else logger.info({ to: data.clientEmail, type: "project_rejected" }, "Project rejected notification sent");
}

// ── sendProviderApprovedNotification ─────────────────────────────────────────
export async function sendProviderApprovedNotification(data: {
  providerEmail: string;
  providerName: string;
  companyName: string;
}): Promise<void> {
  const client = getResend();
  if (!client || !data.providerEmail) return;
  const url = appUrl();
  const { error } = await client.emails.send({
    from: "ImmoVia365 <onboarding@resend.dev>",
    to: data.providerEmail,
    subject: `Ihr Profil wurde freigegeben — ImmoVia365`,
    html: `
      <div style="${WRAP_STYLE}">
        <div style="${NAV_STYLE}"><h1 style="color:#fff;margin:0;font-size:20px;font-weight:700">ImmoVia365 — Profil freigegeben</h1></div>
        <div style="${BODY_STYLE}">
          <p style="margin:0 0 12px">Guten Tag <strong>${data.providerName}</strong>,</p>
          <p style="margin:0 0 20px">Ihr Unternehmensprofil <strong>${data.companyName}</strong> wurde geprüft und ist jetzt aktiv. Sie können nun Projekte einsehen und Angebote einreichen.</p>
          <div style="margin-top:24px"><a href="${url}/provider" style="${BTN_STYLE}">Zum Dashboard</a></div>
        </div>
        ${footer("de")}
      </div>
    `,
  });
  if (error) logger.error({ error }, "Failed to send provider approved notification");
  else logger.info({ to: data.providerEmail, type: "provider_approved" }, "Provider approved notification sent");
}

// ── sendProviderSuspendedNotification ─────────────────────────────────────────
export async function sendProviderSuspendedNotification(data: {
  providerEmail: string;
  providerName: string;
  companyName: string;
}): Promise<void> {
  const client = getResend();
  if (!client || !data.providerEmail) return;
  const { error } = await client.emails.send({
    from: "ImmoVia365 <onboarding@resend.dev>",
    to: data.providerEmail,
    subject: `Ihr Profil wurde deaktiviert — ImmoVia365`,
    html: `
      <div style="${WRAP_STYLE}">
        <div style="${NAV_STYLE}"><h1 style="color:#fff;margin:0;font-size:20px;font-weight:700">ImmoVia365 — Profilestatus</h1></div>
        <div style="${BODY_STYLE}">
          <p style="margin:0 0 12px">Guten Tag <strong>${data.providerName}</strong>,</p>
          <p style="margin:0 0 20px">Ihr Profil <strong>${data.companyName}</strong> wurde vorübergehend deaktiviert. Bitte kontaktieren Sie unser Team für weitere Informationen.</p>
        </div>
        ${footer("de")}
      </div>
    `,
  });
  if (error) logger.error({ error }, "Failed to send provider suspended notification");
  else logger.info({ to: data.providerEmail, type: "provider_suspended" }, "Provider suspended notification sent");
}

// ── sendNewMessageNotification ────────────────────────────────────────────────
export async function sendNewMessageNotification(data: {
  recipientEmail: string;
  recipientName: string;
  recipientUserId: number;
  senderName: string;
  preview: string;
  offerId: number;
  isProvider?: boolean;
  language?: string | null;
}): Promise<void> {
  const client = getResend();
  if (!client || !data.recipientEmail) {
    logger.warn("Email not configured — skipping message notification");
    return;
  }

  if (!canSendMessageEmail(data.recipientUserId, data.offerId)) {
    logger.info(
      { recipientUserId: data.recipientUserId, offerId: data.offerId },
      "Message notification throttled (1 email/hour per thread per recipient)"
    );
    return;
  }

  const lang = normLang(data.language);
  const t = i18n.newMessage;
  const safePreview = data.preview.length > 120 ? data.preview.slice(0, 120) + "…" : data.preview;
  const dashUrl = data.isProvider ? `${appUrl()}/provider` : `${appUrl()}/dashboard`;

  const { error } = await client.emails.send({
    from: "ImmoVia365 <onboarding@resend.dev>",
    to: data.recipientEmail,
    subject: t.subject[lang](data.senderName),
    html: `
      <div style="${WRAP_STYLE}">
        <div style="${NAV_STYLE}">
          <h1 style="color:#fff;margin:0;font-size:20px;font-weight:700">${t.heading[lang]}</h1>
        </div>
        <div style="${BODY_STYLE}">
          <p style="margin:0 0 16px">${t.hi[lang](data.recipientName)}</p>
          <p style="margin:0 0 8px">${t.sent[lang](data.senderName)}</p>
          <blockquote style="margin:0 0 20px;padding:12px 16px;background:#e8f0fd;border-left:4px solid #1a3a6e;border-radius:4px;font-style:italic;color:#334155">${safePreview}</blockquote>
          <div style="margin-top:24px">
            <a href="${dashUrl}" style="${BTN_STYLE}">${t.cta[lang]}</a>
          </div>
        </div>
        ${footer(lang)}
      </div>
    `,
  });
  if (error) logger.error({ error }, "Failed to send message notification");
  else logger.info({ to: data.recipientEmail, type: "new_message", lang }, "Message notification sent");
}

// ── sendPremiumProjectNotification ────────────────────────────────────────────
export async function sendPremiumProjectNotification(data: {
  recipientEmail: string;
  recipientName: string;
  projectType: string;
  city: string;
  projectId: number;
}): Promise<void> {
  const client = getResend();
  if (!client || !data.recipientEmail) {
    logger.warn("Email not configured — skipping premium project notification");
    return;
  }

  const subjects: Record<string, string> = {
    sq: `Projekt i ri: ${data.projectType} në ${data.city}`,
    en: `New project alert: ${data.projectType} in ${data.city}`,
    de: `Neues Projekt: ${data.projectType} in ${data.city}`,
    fr: `Nouveau projet: ${data.projectType} à ${data.city}`,
  };
  const headings: Record<string, string> = {
    sq: "ImmoVia365 — Projekt i Ri",
    en: "ImmoVia365 — New Project Alert",
    de: "ImmoVia365 — Neues Projekt",
    fr: "ImmoVia365 — Nouveau Projet",
  };
  const intros: Record<string, (type: string, city: string) => string> = {
    sq: (t, c) => `Një projekt i ri <strong>${t}</strong> sapo u postua në <strong>${c}</strong>. Si anëtar Premium, jeni ndër të parët që e shohë.`,
    en: (t, c) => `A new <strong>${t}</strong> project was just posted in <strong>${c}</strong>. As a Premium member, you're among the first to see it.`,
    de: (t, c) => `Ein neues <strong>${t}</strong>-Projekt wurde soeben in <strong>${c}</strong> veröffentlicht. Als Premium-Mitglied sehen Sie es als Erstes.`,
    fr: (t, c) => `Un nouveau projet <strong>${t}</strong> vient d'être publié à <strong>${c}</strong>. En tant que membre Premium, vous êtes parmi les premiers à le voir.`,
  };
  const ctas: Record<string, string> = {
    sq: "Shiko Projektin",
    en: "View Project",
    de: "Projekt ansehen",
    fr: "Voir le projet",
  };
  const footerTexts: Record<string, string> = {
    sq: "Ju po merrni këtë njoftim si anëtar Premium i ImmoVia365.",
    en: "You are receiving this notification as a Premium member of ImmoVia365.",
    de: "Sie erhalten diese Benachrichtigung als Premium-Mitglied von ImmoVia365.",
    fr: "Vous recevez cette notification en tant que membre Premium d'ImmoVia365.",
  };

  const lang = "de";
  const projectUrl = `${appUrl()}/projects/${data.projectId}`;

  const { error } = await client.emails.send({
    from: "ImmoVia365 <onboarding@resend.dev>",
    to: data.recipientEmail,
    subject: subjects[lang],
    html: `
      <div style="${WRAP_STYLE}">
        <div style="${NAV_STYLE}">
          <h1 style="color:#fff;margin:0;font-size:20px;font-weight:700">${headings[lang]}</h1>
        </div>
        <div style="${BODY_STYLE}">
          <p style="margin:0 0 4px;font-size:14px;color:#64748b">Hallo ${data.recipientName},</p>
          <p style="margin:12px 0 16px">${intros[lang](data.projectType, data.city)}</p>
          <div style="background:#f1f5f9;border-radius:8px;padding:16px;margin:0 0 20px">
            <p style="margin:0 0 4px;font-size:13px;font-weight:600;color:#0f2044">${data.projectType}</p>
            <p style="margin:0;font-size:13px;color:#475569">${data.city}</p>
          </div>
          <div style="background:#fef3c7;border:1px solid #f59e0b;border-radius:6px;padding:10px 14px;margin:0 0 20px">
            <p style="margin:0;font-size:12px;font-weight:600;color:#92400e">Premium Priority Notification</p>
          </div>
          <div>
            <a href="${projectUrl}" style="${BTN_STYLE}">${ctas[lang]}</a>
          </div>
          <p style="${FOOTER_STYLE};margin-top:24px">${footerTexts[lang]}</p>
        </div>
      </div>
    `,
  });
  if (error) logger.error({ error }, "Failed to send premium project notification");
  else logger.info({ to: data.recipientEmail, projectId: data.projectId }, "Premium project notification sent");
}
