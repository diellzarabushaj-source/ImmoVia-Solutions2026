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

function fromAddress(): string {
  return process.env["RESEND_FROM"] ?? "ImmoVia365 <onboarding@resend.dev>";
}

/**
 * If RESEND_TO_OVERRIDE is set (e.g. "immovia.rd@gmail.com"), ALL outgoing
 * emails are redirected there. Useful when Resend is in test mode and can
 * only deliver to the account owner's address.
 */
function resolveRecipient(to: string): string {
  return process.env["RESEND_TO_OVERRIDE"] ?? to;
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
      sq: (_sender: string) => `Aplikim i ri për projektin tuaj — ImmoVia365`,
      en: (_sender: string) => `New application for your project — ImmoVia365`,
      de: (_sender: string) => `Neue Bewerbung für Ihr Projekt — ImmoVia365`,
      fr: (_sender: string) => `Nouvelle candidature pour votre projet — ImmoVia365`,
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
    from: fromAddress(),
    to: resolveRecipient(to),
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
  language?: string | null;
}): Promise<void> {
  const client = getResend();
  if (!client || !project.email) {
    logger.warn("Email not configured — skipping client project confirmation");
    return;
  }

  const lang = normLang(project.language);

  const subjects: Record<Lang, string> = {
    sq: "Kërkesa juaj u dërgua me sukses — ImmoVia365",
    en: "Your request was submitted successfully — ImmoVia365",
    de: "Ihre Anfrage wurde erfolgreich eingereicht — ImmoVia365",
    fr: "Votre demande a été soumise avec succès — ImmoVia365",
  };
  const headings: Record<Lang, string> = {
    sq: "ImmoVia365 — Kërkesë e Konfirmuar",
    en: "ImmoVia365 — Request Confirmed",
    de: "ImmoVia365 — Anfrage bestätigt",
    fr: "ImmoVia365 — Demande confirmée",
  };
  const greetings: Record<Lang, string> = {
    sq: `Mirëdita <strong>${project.fullName}</strong>,`,
    en: `Hello <strong>${project.fullName}</strong>,`,
    de: `Guten Tag <strong>${project.fullName}</strong>,`,
    fr: `Bonjour <strong>${project.fullName}</strong>,`,
  };
  const intros: Record<Lang, string> = {
    sq: `Kërkesa juaj për <strong>${project.projectType}</strong> në <strong>${project.city}</strong> u dërgua me sukses. Ekipi ynë është njoftuar.`,
    en: `Your request for <strong>${project.projectType}</strong> in <strong>${project.city}</strong> was submitted successfully. Our team has been notified.`,
    de: `Ihre Anfrage für <strong>${project.projectType}</strong> in <strong>${project.city}</strong> wurde erfolgreich eingereicht. Unser Team ist bereits informiert.`,
    fr: `Votre demande pour <strong>${project.projectType}</strong> à <strong>${project.city}</strong> a été soumise avec succès. Notre équipe a été informée.`,
  };
  const nextHeadings: Record<Lang, string> = {
    sq: "Çfarë ndodh më pas?",
    en: "What happens next?",
    de: "Was passiert als nächstes?",
    fr: "Que se passe-t-il ensuite ?",
  };
  const steps: Record<Lang, [string, string, string]> = {
    sq: [
      "Ekipi ynë shqyrton kërkesën tuaj brenda 24 orëve.",
      "Kompanitë e përshtatshme njoftohen dhe mund të dërgojnë oferta.",
      "Ju merrni oferta direkt me email dhe mund të krahasoni.",
    ],
    en: [
      "Our team reviews your request within 24 hours.",
      "Matching companies are notified and can submit offers.",
      "You receive offers directly by email and can compare them.",
    ],
    de: [
      "Unser Team prüft Ihre Anfrage innerhalb von 24 Stunden.",
      "Passende Fachbetriebe werden benachrichtigt und können Angebote einreichen.",
      "Sie erhalten Angebote direkt per E-Mail und können vergleichen.",
    ],
    fr: [
      "Notre équipe examine votre demande dans les 24 heures.",
      "Les entreprises correspondantes sont notifiées et peuvent soumettre des offres.",
      "Vous recevez des offres directement par e-mail et pouvez les comparer.",
    ],
  };
  const budgetLabel: Record<Lang, string> = { sq: "Buxheti", en: "Budget", de: "Budget", fr: "Budget" };
  const timelineLabel: Record<Lang, string> = { sq: "Afati", en: "Timeline", de: "Zeitrahmen", fr: "Calendrier" };
  const browseText: Record<Lang, string> = {
    sq: "Mund të shfletoni edhe direkt kompanitë në direktorinë tonë.",
    en: "You can also browse companies in our directory directly.",
    de: "Sie können auch direkt Firmen in unserem Verzeichnis durchsuchen.",
    fr: "Vous pouvez également parcourir les entreprises dans notre annuaire.",
  };
  const ctas: Record<Lang, string> = {
    sq: "Zbulo Kompanitë",
    en: "Discover Companies",
    de: "Firmen entdecken",
    fr: "Découvrir les entreprises",
  };

  const s = steps[lang];
  const { error } = await client.emails.send({
    from: fromAddress(),
    to: resolveRecipient(project.email),
    subject: subjects[lang],
    html: `
      <div style="${WRAP_STYLE}">
        <div style="${NAV_STYLE}">
          <h1 style="color:#fff;margin:0;font-size:20px;font-weight:700">${headings[lang]}</h1>
        </div>
        <div style="${BODY_STYLE}">
          <p style="margin:0 0 12px">${greetings[lang]}</p>
          <p style="margin:0 0 20px">${intros[lang]}</p>
          <div style="background:#e8f0fd;border-left:4px solid #1a3a6e;border-radius:6px;padding:20px;margin:0 0 24px">
            <p style="margin:0 0 14px;font-weight:600;color:#0f2044;font-size:14px">${nextHeadings[lang]}</p>
            <table style="width:100%;border-collapse:collapse">
              <tr><td style="padding:5px 0;vertical-align:top;width:28px;color:#1a3a6e;font-weight:700;font-size:14px">1.</td><td style="padding:5px 0;font-size:14px">${s[0]}</td></tr>
              <tr><td style="padding:5px 0;vertical-align:top;color:#1a3a6e;font-weight:700;font-size:14px">2.</td><td style="padding:5px 0;font-size:14px">${s[1]}</td></tr>
              <tr><td style="padding:5px 0;vertical-align:top;color:#1a3a6e;font-weight:700;font-size:14px">3.</td><td style="padding:5px 0;font-size:14px">${s[2]}</td></tr>
            </table>
          </div>
          ${project.budget ? `<p style="font-size:13px;color:#64748b;margin:0 0 6px">${budgetLabel[lang]}: <strong>${project.budget}</strong></p>` : ""}
          ${project.timeline ? `<p style="font-size:13px;color:#64748b;margin:0 0 20px">${timelineLabel[lang]}: <strong>${project.timeline}</strong></p>` : ""}
          <p style="margin:0 0 20px;font-size:13px;color:#64748b">${browseText[lang]}</p>
          <div style="margin-top:8px">
            <a href="${appUrl()}/companies" style="${BTN_STYLE}">${ctas[lang]}</a>
          </div>
        </div>
        ${footer(lang)}
      </div>
    `,
  });

  if (error) {
    logger.error({ error }, "Failed to send project confirmation to client");
  } else {
    logger.info({ to: resolveRecipient(project.email), type: "project_confirmation", lang }, "Project confirmation sent to client");
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
    from: fromAddress(),
    to: resolveRecipient(to),
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
    from: fromAddress(),
    to: resolveRecipient(data.clientEmail),
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
  else logger.info({ to: resolveRecipient(data.clientEmail), type: "new_offer", lang }, "New offer notification sent");
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
    from: fromAddress(),
    to: resolveRecipient(data.providerEmail),
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
  else logger.info({ to: resolveRecipient(data.providerEmail), type: "offer_accepted", lang }, "Offer accepted notification sent");
}

// ── sendProjectPublishedNotification ─────────────────────────────────────────
export async function sendProjectPublishedNotification(data: {
  clientEmail: string;
  clientName: string;
  projectType: string;
  city: string;
  projectId: number;
  language?: string | null;
}): Promise<void> {
  const client = getResend();
  if (!client || !data.clientEmail) return;
  const lang = normLang(data.language);
  const url = appUrl();

  const subjects: Record<Lang, string> = {
    sq: `Projekti juaj u aktivizua — ImmoVia365`,
    en: `Your project has been activated — ImmoVia365`,
    de: `Ihr Projekt wurde freigeschaltet — ImmoVia365`,
    fr: `Votre projet a été activé — ImmoVia365`,
  };
  const headings: Record<Lang, string> = {
    sq: "ImmoVia365 — Projekt i Publikuar",
    en: "ImmoVia365 — Project Published",
    de: "ImmoVia365 — Projekt veröffentlicht",
    fr: "ImmoVia365 — Projet publié",
  };
  const greetings: Record<Lang, string> = {
    sq: `Mirëdita <strong>${data.clientName}</strong>,`,
    en: `Hello <strong>${data.clientName}</strong>,`,
    de: `Guten Tag <strong>${data.clientName}</strong>,`,
    fr: `Bonjour <strong>${data.clientName}</strong>,`,
  };
  const bodies: Record<Lang, string> = {
    sq: `Projekti juaj <strong>${data.projectType}</strong> në <strong>${data.city}</strong> u shqyrtua dhe është tani i publikuar në platformë. Kompanitë mund ta shohin dhe të dërgojnë oferta.`,
    en: `Your <strong>${data.projectType}</strong> project in <strong>${data.city}</strong> has been reviewed and is now published on the platform. Companies can now view it and submit offers.`,
    de: `Ihr Projekt <strong>${data.projectType}</strong> in <strong>${data.city}</strong> wurde geprüft und ist jetzt auf der Plattform veröffentlicht. Fachbetriebe können Ihr Projekt nun einsehen und Angebote einreichen.`,
    fr: `Votre projet <strong>${data.projectType}</strong> à <strong>${data.city}</strong> a été examiné et est maintenant publié sur la plateforme. Les entreprises peuvent le consulter et soumettre des offres.`,
  };
  const ctas: Record<Lang, string> = {
    sq: "Paneli im", en: "My Dashboard", de: "Mein Dashboard", fr: "Mon tableau de bord",
  };

  const { error } = await client.emails.send({
    from: fromAddress(),
    to: resolveRecipient(data.clientEmail),
    subject: subjects[lang],
    html: `
      <div style="${WRAP_STYLE}">
        <div style="${NAV_STYLE}"><h1 style="color:#fff;margin:0;font-size:20px;font-weight:700">${headings[lang]}</h1></div>
        <div style="${BODY_STYLE}">
          <p style="margin:0 0 12px">${greetings[lang]}</p>
          <p style="margin:0 0 20px">${bodies[lang]}</p>
          <div style="margin-top:24px"><a href="${url}/dashboard" style="${BTN_STYLE}">${ctas[lang]}</a></div>
        </div>
        ${footer(lang)}
      </div>
    `,
  });
  if (error) logger.error({ error }, "Failed to send project published notification");
  else logger.info({ to: resolveRecipient(data.clientEmail), type: "project_published", lang }, "Project published notification sent");
}

// ── sendProjectRejectedNotification ──────────────────────────────────────────
export async function sendProjectRejectedNotification(data: {
  clientEmail: string;
  clientName: string;
  projectType: string;
  city: string;
  reason?: string | null;
  language?: string | null;
}): Promise<void> {
  const client = getResend();
  if (!client || !data.clientEmail) return;
  const lang = normLang(data.language);
  const url = appUrl();

  const subjects: Record<Lang, string> = {
    sq: `Projekti juaj nuk mund të publikohet — ImmoVia365`,
    en: `Your project could not be published — ImmoVia365`,
    de: `Ihr Projekt konnte nicht veröffentlicht werden — ImmoVia365`,
    fr: `Votre projet n'a pas pu être publié — ImmoVia365`,
  };
  const headings: Record<Lang, string> = {
    sq: "ImmoVia365 — Statusi i Projektit",
    en: "ImmoVia365 — Project Status",
    de: "ImmoVia365 — Projektstatus",
    fr: "ImmoVia365 — Statut du projet",
  };
  const greetings: Record<Lang, string> = {
    sq: `Mirëdita <strong>${data.clientName}</strong>,`,
    en: `Hello <strong>${data.clientName}</strong>,`,
    de: `Guten Tag <strong>${data.clientName}</strong>,`,
    fr: `Bonjour <strong>${data.clientName}</strong>,`,
  };
  const reasonLabel: Record<Lang, string> = { sq: "Arsyeja", en: "Reason", de: "Grund", fr: "Raison" };
  const bodies: Record<Lang, string> = {
    sq: `Projekti juaj <strong>${data.projectType}</strong> në <strong>${data.city}</strong> nuk mund të publikohet fatkeqësisht.${data.reason ? ` <strong>${reasonLabel.sq}:</strong> ${data.reason}` : ""}`,
    en: `Your <strong>${data.projectType}</strong> project in <strong>${data.city}</strong> could unfortunately not be published.${data.reason ? ` <strong>${reasonLabel.en}:</strong> ${data.reason}` : ""}`,
    de: `Ihr Projekt <strong>${data.projectType}</strong> in <strong>${data.city}</strong> konnte leider nicht veröffentlicht werden.${data.reason ? ` <strong>${reasonLabel.de}:</strong> ${data.reason}` : ""}`,
    fr: `Votre projet <strong>${data.projectType}</strong> à <strong>${data.city}</strong> n'a malheureusement pas pu être publié.${data.reason ? ` <strong>${reasonLabel.fr}:</strong> ${data.reason}` : ""}`,
  };
  const hints: Record<Lang, string> = {
    sq: "Mund të dërgoni një kërkesë të re ose të kontaktoni ekipin tonë.",
    en: "You can submit a new request or contact our team.",
    de: "Sie können eine neue Anfrage einreichen oder unser Team kontaktieren.",
    fr: "Vous pouvez soumettre une nouvelle demande ou contacter notre équipe.",
  };
  const ctas: Record<Lang, string> = {
    sq: "Paneli im", en: "My Dashboard", de: "Mein Dashboard", fr: "Mon tableau de bord",
  };

  const { error } = await client.emails.send({
    from: fromAddress(),
    to: resolveRecipient(data.clientEmail),
    subject: subjects[lang],
    html: `
      <div style="${WRAP_STYLE}">
        <div style="${NAV_STYLE}"><h1 style="color:#fff;margin:0;font-size:20px;font-weight:700">${headings[lang]}</h1></div>
        <div style="${BODY_STYLE}">
          <p style="margin:0 0 12px">${greetings[lang]}</p>
          <p style="margin:0 0 20px">${bodies[lang]}</p>
          <p style="margin:0 0 20px;font-size:13px;color:#64748b">${hints[lang]}</p>
          <div style="margin-top:24px"><a href="${url}/dashboard" style="${BTN_STYLE}">${ctas[lang]}</a></div>
        </div>
        ${footer(lang)}
      </div>
    `,
  });
  if (error) logger.error({ error }, "Failed to send project rejected notification");
  else logger.info({ to: resolveRecipient(data.clientEmail), type: "project_rejected", lang }, "Project rejected notification sent");
}

// ── sendProviderApprovedNotification ─────────────────────────────────────────
export async function sendProviderApprovedNotification(data: {
  providerEmail: string;
  providerName: string;
  companyName: string;
  language?: string | null;
}): Promise<void> {
  const client = getResend();
  if (!client || !data.providerEmail) return;
  const lang = normLang(data.language);
  const url = appUrl();

  const subjects: Record<Lang, string> = {
    sq: `Profili juaj u aktivizua — ImmoVia365`,
    en: `Your profile has been approved — ImmoVia365`,
    de: `Ihr Profil wurde freigegeben — ImmoVia365`,
    fr: `Votre profil a été approuvé — ImmoVia365`,
  };
  const headings: Record<Lang, string> = {
    sq: "ImmoVia365 — Profil i Aktivizuar",
    en: "ImmoVia365 — Profile Approved",
    de: "ImmoVia365 — Profil freigegeben",
    fr: "ImmoVia365 — Profil approuvé",
  };
  const bodies: Record<Lang, string> = {
    sq: `Profili i kompanisë suaj <strong>${data.companyName}</strong> u shqyrtua dhe është tani aktiv. Mund të shikoni projektet dhe të dërgoni oferta.`,
    en: `Your company profile <strong>${data.companyName}</strong> has been reviewed and is now active. You can now view projects and submit offers.`,
    de: `Ihr Unternehmensprofil <strong>${data.companyName}</strong> wurde geprüft und ist jetzt aktiv. Sie können nun Projekte einsehen und Angebote einreichen.`,
    fr: `Votre profil d'entreprise <strong>${data.companyName}</strong> a été examiné et est maintenant actif. Vous pouvez maintenant consulter les projets et soumettre des offres.`,
  };
  const ctas: Record<Lang, string> = {
    sq: "Paneli i Ofruesit", en: "Provider Dashboard", de: "Zum Dashboard", fr: "Tableau de bord",
  };

  const { error } = await client.emails.send({
    from: fromAddress(),
    to: resolveRecipient(data.providerEmail),
    subject: subjects[lang],
    html: `
      <div style="${WRAP_STYLE}">
        <div style="${NAV_STYLE}"><h1 style="color:#fff;margin:0;font-size:20px;font-weight:700">${headings[lang]}</h1></div>
        <div style="${BODY_STYLE}">
          <p style="margin:0 0 12px">${{ sq: "Mirëdita", en: "Hello", de: "Guten Tag", fr: "Bonjour" }[lang]} <strong>${data.providerName}</strong>,</p>
          <p style="margin:0 0 20px">${bodies[lang]}</p>
          <div style="margin-top:24px"><a href="${url}/provider" style="${BTN_STYLE}">${ctas[lang]}</a></div>
        </div>
        ${footer(lang)}
      </div>
    `,
  });
  if (error) logger.error({ error }, "Failed to send provider approved notification");
  else logger.info({ to: resolveRecipient(data.providerEmail), type: "provider_approved", lang }, "Provider approved notification sent");
}

// ── sendProviderSuspendedNotification ─────────────────────────────────────────
export async function sendProviderSuspendedNotification(data: {
  providerEmail: string;
  providerName: string;
  companyName: string;
  language?: string | null;
}): Promise<void> {
  const client = getResend();
  if (!client || !data.providerEmail) return;
  const lang = normLang(data.language);

  const subjects: Record<Lang, string> = {
    sq: `Profili juaj u çaktivizua — ImmoVia365`,
    en: `Your profile has been deactivated — ImmoVia365`,
    de: `Ihr Profil wurde deaktiviert — ImmoVia365`,
    fr: `Votre profil a été désactivé — ImmoVia365`,
  };
  const headings: Record<Lang, string> = {
    sq: "ImmoVia365 — Statusi i Profilit",
    en: "ImmoVia365 — Profile Status",
    de: "ImmoVia365 — Profilestatus",
    fr: "ImmoVia365 — Statut du profil",
  };
  const bodies: Record<Lang, string> = {
    sq: `Profili juaj <strong>${data.companyName}</strong> u çaktivizua përkohësisht. Ju lutemi kontaktoni ekipin tonë për informacion të mëtejshëm.`,
    en: `Your profile <strong>${data.companyName}</strong> has been temporarily deactivated. Please contact our team for more information.`,
    de: `Ihr Profil <strong>${data.companyName}</strong> wurde vorübergehend deaktiviert. Bitte kontaktieren Sie unser Team für weitere Informationen.`,
    fr: `Votre profil <strong>${data.companyName}</strong> a été temporairement désactivé. Veuillez contacter notre équipe pour plus d'informations.`,
  };

  const { error } = await client.emails.send({
    from: fromAddress(),
    to: resolveRecipient(data.providerEmail),
    subject: subjects[lang],
    html: `
      <div style="${WRAP_STYLE}">
        <div style="${NAV_STYLE}"><h1 style="color:#fff;margin:0;font-size:20px;font-weight:700">${headings[lang]}</h1></div>
        <div style="${BODY_STYLE}">
          <p style="margin:0 0 12px">${{ sq: "Mirëdita", en: "Hello", de: "Guten Tag", fr: "Bonjour" }[lang]} <strong>${data.providerName}</strong>,</p>
          <p style="margin:0 0 20px">${bodies[lang]}</p>
        </div>
        ${footer(lang)}
      </div>
    `,
  });
  if (error) logger.error({ error }, "Failed to send provider suspended notification");
  else logger.info({ to: resolveRecipient(data.providerEmail), type: "provider_suspended", lang }, "Provider suspended notification sent");
}

// ── sendCompanyRejectedNotification ──────────────────────────────────────────
export async function sendCompanyRejectedNotification(data: {
  providerEmail: string;
  providerName: string;
  companyName: string;
  reason?: string | null;
  language?: string | null;
}): Promise<void> {
  const client = getResend();
  if (!client || !data.providerEmail) return;
  const lang = normLang(data.language);
  const url = appUrl();

  const subjects: Record<Lang, string> = {
    sq: `Regjistrimi juaj nuk u aprovua — ImmoVia365`,
    en: `Your registration was not approved — ImmoVia365`,
    de: `Ihre Registrierung wurde nicht genehmigt — ImmoVia365`,
    fr: `Votre inscription n'a pas été approuvée — ImmoVia365`,
  };
  const headings: Record<Lang, string> = {
    sq: "ImmoVia365 — Rezultati i Regjistrimit",
    en: "ImmoVia365 — Registration Result",
    de: "ImmoVia365 — Registrierungsergebnis",
    fr: "ImmoVia365 — Résultat de l'inscription",
  };
  const reasonLabel: Record<Lang, string> = { sq: "Arsyeja", en: "Reason", de: "Grund", fr: "Raison" };
  const bodies: Record<Lang, string> = {
    sq: `Fatkeqësisht, aplikimi i kompanisë suaj <strong>${data.companyName}</strong> nuk u aprovua.${data.reason ? ` <strong>${reasonLabel.sq}:</strong> ${data.reason}` : ""}`,
    en: `Unfortunately, your company application for <strong>${data.companyName}</strong> was not approved.${data.reason ? ` <strong>${reasonLabel.en}:</strong> ${data.reason}` : ""}`,
    de: `Leider wurde der Antrag Ihres Unternehmens <strong>${data.companyName}</strong> nicht genehmigt.${data.reason ? ` <strong>${reasonLabel.de}:</strong> ${data.reason}` : ""}`,
    fr: `Malheureusement, la demande de votre entreprise <strong>${data.companyName}</strong> n'a pas été approuvée.${data.reason ? ` <strong>${reasonLabel.fr}:</strong> ${data.reason}` : ""}`,
  };
  const hints: Record<Lang, string> = {
    sq: "Mund të kontaktoni ekipin tonë për sqarim ose të dërgoni një aplikim të ri.",
    en: "You can contact our team for clarification or submit a new application.",
    de: "Sie können unser Team für Klärung kontaktieren oder einen neuen Antrag stellen.",
    fr: "Vous pouvez contacter notre équipe pour obtenir des éclaircissements ou soumettre une nouvelle demande.",
  };
  const ctas: Record<Lang, string> = {
    sq: "Na Kontaktoni", en: "Contact Us", de: "Kontakt", fr: "Nous contacter",
  };

  const { error } = await client.emails.send({
    from: fromAddress(),
    to: resolveRecipient(data.providerEmail),
    subject: subjects[lang],
    html: `
      <div style="${WRAP_STYLE}">
        <div style="${NAV_STYLE}"><h1 style="color:#fff;margin:0;font-size:20px;font-weight:700">${headings[lang]}</h1></div>
        <div style="${BODY_STYLE}">
          <p style="margin:0 0 12px">${{ sq: "Mirëdita", en: "Hello", de: "Guten Tag", fr: "Bonjour" }[lang]} <strong>${data.providerName}</strong>,</p>
          <p style="margin:0 0 20px">${bodies[lang]}</p>
          <p style="margin:0 0 20px;font-size:13px;color:#64748b">${hints[lang]}</p>
          <div style="margin-top:24px"><a href="${url}/contact" style="${BTN_STYLE}">${ctas[lang]}</a></div>
        </div>
        ${footer(lang)}
      </div>
    `,
  });
  if (error) logger.error({ error }, "Failed to send company rejected notification");
  else logger.info({ to: resolveRecipient(data.providerEmail), type: "company_rejected", lang }, "Company rejected notification sent");
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
    from: fromAddress(),
    to: resolveRecipient(data.recipientEmail),
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
  else logger.info({ to: resolveRecipient(data.recipientEmail), type: "new_message", lang }, "Message notification sent");
}

// ── sendPremiumProjectNotification ────────────────────────────────────────────
export async function sendPremiumProjectNotification(data: {
  recipientEmail: string;
  recipientName: string;
  projectType: string;
  city: string;
  projectId: number;
  language?: string | null;
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

  const lang = normLang(data.language);
  const projectUrl = `${appUrl()}/projects/${data.projectId}`;

  const { error } = await client.emails.send({
    from: fromAddress(),
    to: resolveRecipient(data.recipientEmail),
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
  else logger.info({ to: resolveRecipient(data.recipientEmail), projectId: data.projectId }, "Premium project notification sent");
}

// ── sendOfferRejectedNotification ─────────────────────────────────────────────
export async function sendOfferRejectedNotification(data: {
  providerEmail: string;
  providerName: string;
  clientName: string;
  projectType: string;
  city: string;
  offerId: number;
  language?: string | null;
}): Promise<void> {
  const client = getResend();
  if (!client || !data.providerEmail) return;
  const lang = normLang(data.language);
  const url = appUrl();

  const subjects: Record<Lang, string> = {
    sq: `Oferta juaj nuk u pranua — ${data.projectType} në ${data.city}`,
    en: `Your offer was not accepted — ${data.projectType} in ${data.city}`,
    de: `Ihr Angebot wurde nicht angenommen — ${data.projectType} in ${data.city}`,
    fr: `Votre offre n'a pas été acceptée — ${data.projectType} à ${data.city}`,
  };
  const headings: Record<Lang, string> = {
    sq: "ImmoVia365 — Ofertë e Refuzuar",
    en: "ImmoVia365 — Offer Not Accepted",
    de: "ImmoVia365 — Angebot abgelehnt",
    fr: "ImmoVia365 — Offre non retenue",
  };
  const bodies: Record<Lang, string> = {
    sq: `<strong>${data.clientName}</strong> ka zgjedhur një ofertë tjetër për projektin <strong>${data.projectType}</strong> në <strong>${data.city}</strong>. Oferta juaj nuk u zgjodh këtë herë.`,
    en: `<strong>${data.clientName}</strong> has chosen another offer for the <strong>${data.projectType}</strong> project in <strong>${data.city}</strong>. Your offer was not selected this time.`,
    de: `<strong>${data.clientName}</strong> hat ein anderes Angebot für das Projekt <strong>${data.projectType}</strong> in <strong>${data.city}</strong> ausgewählt. Ihr Angebot wurde diesmal nicht berücksichtigt.`,
    fr: `<strong>${data.clientName}</strong> a choisi une autre offre pour le projet <strong>${data.projectType}</strong> à <strong>${data.city}</strong>. Votre offre n'a pas été retenue cette fois.`,
  };
  const encouragements: Record<Lang, string> = {
    sq: "Ka shumë projekte të tjera ku mund të aplikoni. Vazhdoni të dërgoni oferta!",
    en: "There are many other projects you can apply for. Keep submitting offers!",
    de: "Es gibt viele weitere Projekte, für die Sie sich bewerben können. Reichen Sie weiterhin Angebote ein!",
    fr: "Il y a de nombreux autres projets pour lesquels vous pouvez postuler. Continuez à soumettre des offres !",
  };
  const ctas: Record<Lang, string> = {
    sq: "Shiko Projektet", en: "Browse Projects", de: "Projekte ansehen", fr: "Voir les projets",
  };

  const { error } = await client.emails.send({
    from: fromAddress(),
    to: resolveRecipient(data.providerEmail),
    subject: subjects[lang],
    html: `
      <div style="${WRAP_STYLE}">
        <div style="${NAV_STYLE}"><h1 style="color:#fff;margin:0;font-size:20px;font-weight:700">${headings[lang]}</h1></div>
        <div style="${BODY_STYLE}">
          <p style="margin:0 0 12px">${{ sq: "Mirëdita", en: "Hello", de: "Hallo", fr: "Bonjour" }[lang]} <strong>${data.providerName}</strong>,</p>
          <p style="margin:0 0 20px">${bodies[lang]}</p>
          <p style="margin:0 0 20px;font-size:13px;color:#64748b">${encouragements[lang]}</p>
          <div style="margin-top:24px"><a href="${url}/projects" style="${BTN_STYLE}">${ctas[lang]}</a></div>
        </div>
        ${footer(lang)}
      </div>
    `,
  });
  if (error) logger.error({ error }, "Failed to send offer rejected notification");
  else logger.info({ to: resolveRecipient(data.providerEmail), type: "offer_rejected", lang }, "Offer rejected notification sent");
}

// ── sendProjectInviteNotification ─────────────────────────────────────────────
export async function sendProjectInviteNotification(data: {
  providerEmail: string;
  providerName: string;
  clientName: string;
  subject?: string | null;
  language?: string | null;
}): Promise<void> {
  const client = getResend();
  if (!client || !data.providerEmail) {
    logger.warn("Email not configured — skipping project invite notification");
    return;
  }
  const lang = normLang(data.language);
  const url = appUrl();

  const subjects: Record<Lang, string> = {
    sq: `Jeni ftuar në një projekt — ImmoVia365`,
    en: `You have been invited to a project — ImmoVia365`,
    de: `Sie wurden zu einem Projekt eingeladen — ImmoVia365`,
    fr: `Vous avez été invité à un projet — ImmoVia365`,
  };
  const headings: Record<Lang, string> = {
    sq: "ImmoVia365 — Ftesë Projekti",
    en: "ImmoVia365 — Project Invitation",
    de: "ImmoVia365 — Projekteinladung",
    fr: "ImmoVia365 — Invitation au projet",
  };
  const greetings: Record<Lang, string> = {
    sq: `Mirëdita <strong>${data.providerName}</strong>,`,
    en: `Hello <strong>${data.providerName}</strong>,`,
    de: `Hallo <strong>${data.providerName}</strong>,`,
    fr: `Bonjour <strong>${data.providerName}</strong>,`,
  };
  const bodies: Record<Lang, string> = {
    sq: `<strong>${data.clientName}</strong> ju ka kontaktuar dhe ju fton të dërgoni një ofertë për projektin e tyre${data.subject ? ` — <em>${data.subject}</em>` : ""}.`,
    en: `<strong>${data.clientName}</strong> has contacted you and invites you to submit an offer for their project${data.subject ? ` — <em>${data.subject}</em>` : ""}.`,
    de: `<strong>${data.clientName}</strong> hat Sie kontaktiert und lädt Sie ein, ein Angebot für ihr Projekt einzureichen${data.subject ? ` — <em>${data.subject}</em>` : ""}.`,
    fr: `<strong>${data.clientName}</strong> vous a contacté et vous invite à soumettre une offre pour son projet${data.subject ? ` — <em>${data.subject}</em>` : ""}.`,
  };
  const ctas: Record<Lang, string> = {
    sq: "Shiko Projektin",
    en: "View Project",
    de: "Projekt ansehen",
    fr: "Voir le projet",
  };

  const { error } = await client.emails.send({
    from: fromAddress(),
    to: resolveRecipient(data.providerEmail),
    subject: subjects[lang],
    html: `
      <div style="${WRAP_STYLE}">
        <div style="${NAV_STYLE}"><h1 style="color:#fff;margin:0;font-size:20px;font-weight:700">${headings[lang]}</h1></div>
        <div style="${BODY_STYLE}">
          <p style="margin:0 0 12px">${greetings[lang]}</p>
          <p style="margin:0 0 20px">${bodies[lang]}</p>
          <div style="margin-top:24px"><a href="${url}/provider" style="${BTN_STYLE}">${ctas[lang]}</a></div>
        </div>
        ${footer(lang)}
      </div>
    `,
  });
  if (error) logger.error({ error }, "Failed to send project invite notification");
  else logger.info({ to: resolveRecipient(data.providerEmail), type: "project_invite", lang }, "Project invite notification sent");
}
