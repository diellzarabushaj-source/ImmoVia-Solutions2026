import { Router, type IRouter } from "express";
import { and, desc, eq, gte, sql } from "drizzle-orm";
import {
  db,
  subscriptionPlansTable,
  subscriptionsTable,
  paymentsTable,
  invoicesTable,
  offersTable,
  contactUnlocksTable,
  usersTable,
  companiesTable,
  projectsTable,
} from "@workspace/db";
import { getUnlockStats } from "../lib/planGating";
import { requireProvider } from "../middlewares/requireProvider";
import { paymentProvider } from "../payments";
import { rollSubscriptionCycle } from "../lib/credits";
import { getStripeClient } from "../lib/stripeClient";

const router: IRouter = Router();

export const PLAN_APP_LIMITS: Record<string, number> = {
  free: 0,
  basic: 20,
  pro: 50,
  premium: -1, // -1 = unlimited
  // legacy slugs kept for backward compat
  starter: 20,
  professional: 50,
  founding: 10,
};

export const PLAN_CONTACT_VISIBLE: Record<string, boolean> = {
  free: false,
  basic: true,        // All paid plans: contact details visible
  pro: true,
  premium: true,
  // legacy
  starter: true,
  professional: true,
  founding: true,
};

export const PLAN_BADGES: Record<string, string> = {
  free: "",
  basic: "Basic Provider",
  pro: "Professional Provider",
  premium: "Premium Partner",
  // legacy
  starter: "Basic Provider",
  professional: "Professional Provider",
  founding: "Basic Provider",
};

// Public catalogs
router.get("/plans", async (_req, res): Promise<void> => {
  const plans = await db
    .select()
    .from(subscriptionPlansTable)
    .orderBy(subscriptionPlansTable.sortOrder);
  res.json(plans);
});

// Provider state
router.get("/provider/me", requireProvider, async (req, res): Promise<void> => {
  const userId = req.userId!;
  await rollSubscriptionCycle(userId);
  const [sub] = await db
    .select()
    .from(subscriptionsTable)
    .where(eq(subscriptionsTable.userId, userId))
    .orderBy(desc(subscriptionsTable.id))
    .limit(1);
  let plan = null;
  if (sub) {
    const [p] = await db
      .select()
      .from(subscriptionPlansTable)
      .where(eq(subscriptionPlansTable.id, sub.planId));
    plan = p ?? null;
  }
  res.json({ subscription: sub ?? null, plan });
});

router.get("/provider/app-stats", requireProvider, async (req, res): Promise<void> => {
  const userId = req.userId!;
  await rollSubscriptionCycle(userId);

  const [sub] = await db
    .select()
    .from(subscriptionsTable)
    .where(eq(subscriptionsTable.userId, userId))
    .orderBy(desc(subscriptionsTable.id))
    .limit(1);

  let plan = null;
  if (sub) {
    const [p] = await db
      .select()
      .from(subscriptionPlansTable)
      .where(eq(subscriptionPlansTable.id, sub.planId));
    plan = p ?? null;
  }

  // Enforce expiry: subscription must be active AND within its period.
  const now = new Date();
  const subActive =
    sub?.status === "active" &&
    sub?.currentPeriodEnd != null &&
    new Date(sub.currentPeriodEnd) > now;

  const planSlug = subActive ? (plan?.slug ?? "free") : "free";
  const baseLimit = PLAN_APP_LIMITS[planSlug] ?? 0;
  // Rollover: add unused credits carried from the previous period (infinite plans ignore it).
  const carryover = subActive ? (sub?.carryoverCredits ?? 0) : 0;
  const appLimit = baseLimit === -1 ? -1 : baseLimit + carryover;
  const contactVisible = PLAN_CONTACT_VISIBLE[planSlug] ?? false;
  const badge = PLAN_BADGES[planSlug] ?? "Basic Anbieter";

  const periodStart =
    sub?.currentPeriodStart ?? new Date(new Date().getFullYear(), new Date().getMonth(), 1);

  const [{ usedThisMonth }] = await db
    .select({ usedThisMonth: sql<number>`count(*)::int` })
    .from(offersTable)
    .where(and(eq(offersTable.providerUserId, userId), gte(offersTable.createdAt, periodStart)));

  const unlockStats = await getUnlockStats(userId, periodStart);

  res.json({
    planSlug,
    planName: subActive ? (plan?.name ?? "Free") : "Free",
    priceCents: plan?.priceCents ?? 0,
    appLimit,
    usedThisMonth: usedThisMonth ?? 0,
    contactVisible,
    badge,
    periodStart: sub?.currentPeriodStart ?? periodStart,
    periodEnd: sub?.currentPeriodEnd ?? null,
    features: subActive ? (plan?.features ?? []) : [],
    contactUnlocksUsed: unlockStats.used,
    contactUnlocksLimit: subActive ? unlockStats.limit : 0,
  });
});

router.get("/billing/payments", requireProvider, async (req, res): Promise<void> => {
  const userId = req.userId!;
  const rows = await db
    .select()
    .from(paymentsTable)
    .where(eq(paymentsTable.userId, userId))
    .orderBy(desc(paymentsTable.id))
    .limit(100);
  res.json(rows);
});

router.get("/billing/invoices", requireProvider, async (req, res): Promise<void> => {
  const userId = req.userId!;
  const [payments, user] = await Promise.all([
    db.select().from(paymentsTable).where(eq(paymentsTable.userId, userId)),
    db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1).then((r) => r[0]),
  ]);
  const paymentIds = new Set(payments.map((p) => p.id));
  const allInvoices = await db.select().from(invoicesTable).orderBy(desc(invoicesTable.id));
  const regularInvoices = allInvoices.filter((i) => paymentIds.has(i.paymentId));

  const result: Array<typeof regularInvoices[number] & { kind?: string; amountCents?: number; status?: string; receiptUrl?: string | null }> = [...regularInvoices];

  if (user) {
    const [company] = await db
      .select({ registrationFeePaid: companiesTable.registrationFeePaid, createdAt: companiesTable.createdAt })
      .from(companiesTable)
      .where(eq(companiesTable.email, user.email))
      .limit(1);
    if (company?.registrationFeePaid) {
      let receiptUrl: string | null = null;
      try {
        const [companyFull] = await db
          .select({ stripeRegistrationSessionId: companiesTable.stripeRegistrationSessionId })
          .from(companiesTable)
          .where(eq(companiesTable.email, user.email))
          .limit(1);
        if (companyFull?.stripeRegistrationSessionId) {
          const stripe = getStripeClient();
          const session = await stripe.checkout.sessions.retrieve(
            companyFull.stripeRegistrationSessionId,
            { expand: ["payment_intent.latest_charge"] }
          );
          const pi = session.payment_intent as import("stripe").Stripe.PaymentIntent | null;
          const charge = pi?.latest_charge as import("stripe").Stripe.Charge | null;
          receiptUrl = charge?.receipt_url ?? null;
        }
      } catch {
        // non-fatal — row still shown without receipt link
      }
      result.unshift({
        id: 0,
        paymentId: 0,
        number: "REG-001",
        issuedAt: company.createdAt instanceof Date ? company.createdAt : new Date(company.createdAt as string),
        kind: "registration",
        amountCents: 14900,
        status: "paid",
        receiptUrl,
      });
    }
  }

  res.json(result);
});

router.get("/billing/registration-receipt", requireProvider, async (req, res): Promise<void> => {
  const userId = req.userId!;
  const [user] = await db
    .select({ email: usersTable.email, fullName: usersTable.fullName })
    .from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (!user) { res.status(404).send("Not found"); return; }

  const [company] = await db
    .select({
      companyName: companiesTable.companyName,
      contactName: companiesTable.contactName,
      city: companiesTable.city,
      phone: companiesTable.phone,
      registrationFeePaid: companiesTable.registrationFeePaid,
      createdAt: companiesTable.createdAt,
    })
    .from(companiesTable).where(eq(companiesTable.email, user.email)).limit(1);

  if (!company?.registrationFeePaid) { res.status(404).send("Not found"); return; }

  const issuedAt = company.createdAt instanceof Date ? company.createdAt : new Date(company.createdAt as string);
  const dateStr = issuedAt.toLocaleDateString("de-CH", { year: "numeric", month: "long", day: "numeric" });

  const html = `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="utf-8"/>
<title>Quittung REG-001 – ImmoVia</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:system-ui,sans-serif;color:#1a2a3a;background:#fff;padding:48px 56px;max-width:760px;margin:auto}
  .header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:48px}
  .brand{font-size:26px;font-weight:800;color:#1e3a5f;letter-spacing:-0.5px}
  .brand span{color:#3b82f6}
  .meta{text-align:right;font-size:13px;color:#64748b}
  .meta strong{display:block;font-size:18px;font-weight:700;color:#1a2a3a;margin-bottom:4px}
  h2{font-size:20px;font-weight:700;margin-bottom:20px;padding-bottom:10px;border-bottom:2px solid #e2e8f0}
  .grid{display:grid;grid-template-columns:1fr 1fr;gap:32px;margin-bottom:40px}
  .label{font-size:11px;text-transform:uppercase;letter-spacing:.6px;color:#94a3b8;margin-bottom:4px}
  .value{font-size:14px;font-weight:500;color:#1a2a3a}
  table{width:100%;border-collapse:collapse;margin-bottom:32px}
  th{text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:.6px;color:#94a3b8;padding:8px 12px;background:#f8fafc;border:1px solid #e2e8f0}
  td{padding:14px 12px;border:1px solid #e2e8f0;font-size:14px}
  .amount-row td{font-weight:700;font-size:16px;background:#f0f7ff}
  .badge{display:inline-block;padding:3px 10px;border-radius:99px;font-size:12px;font-weight:600;background:#dcfce7;color:#166534}
  .footer{margin-top:48px;padding-top:16px;border-top:1px solid #e2e8f0;font-size:11px;color:#94a3b8;text-align:center}
  @media print{body{padding:24px 32px} .no-print{display:none}}
</style>
</head>
<body>
<div class="header">
  <div class="brand">Immo<span>Via</span><div style="font-size:11px;font-weight:400;color:#64748b;margin-top:2px">immovia365.ch</div></div>
  <div class="meta"><strong>Quittung / Ricevuta</strong>REG-001 &nbsp;·&nbsp; ${dateStr}</div>
</div>

<h2>Einmalgebühr Registrierung / One-time Registration Fee</h2>

<div class="grid">
  <div>
    <div class="label">Auftragnehmer / Provider</div>
    <div class="value">${company.companyName}</div>
    <div class="value" style="color:#64748b">${company.contactName}</div>
    <div class="value" style="color:#64748b">${company.city}</div>
    <div class="value" style="color:#64748b">${user.email}</div>
  </div>
  <div>
    <div class="label">Ausgestellt von / Issued by</div>
    <div class="value">ImmoVia365 GmbH</div>
    <div class="value" style="color:#64748b">Zürich, Schweiz</div>
    <div class="value" style="color:#64748b">immovia365.ch</div>
  </div>
</div>

<table>
  <thead>
    <tr>
      <th>Beschreibung / Description</th>
      <th style="text-align:right">Betrag / Amount</th>
      <th style="text-align:center">Status</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Einmalige Registrierungsgebühr – Aktivierung Dienstleisterprofil<br/><span style="color:#64748b;font-size:12px">One-time registration fee – Provider profile activation</span></td>
      <td style="text-align:right">CHF&nbsp;149.00</td>
      <td style="text-align:center"><span class="badge">Bezahlt / Paid</span></td>
    </tr>
    <tr class="amount-row">
      <td><strong>Total</strong></td>
      <td style="text-align:right">CHF&nbsp;149.00</td>
      <td style="text-align:center"><span class="badge">Bezahlt / Paid</span></td>
    </tr>
  </tbody>
</table>

<div class="no-print" style="margin-bottom:32px">
  <button onclick="window.print()" style="padding:10px 24px;background:#1e3a5f;color:#fff;border:none;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer">
    Drucken / Print (PDF speichern)
  </button>
</div>

<div class="footer">
  ImmoVia365 &nbsp;·&nbsp; Zürich, Schweiz &nbsp;·&nbsp; immovia365.ch<br/>
  Dieses Dokument dient als Zahlungsbestätigung. &nbsp;·&nbsp; This document serves as proof of payment.
</div>
</body>
</html>`;

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(html);
});

router.get("/billing/stripe-invoices", requireProvider, async (req, res): Promise<void> => {
  const userId = req.userId!;
  const [user] = await db.select({ stripeCustomerId: usersTable.stripeCustomerId }).from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (!user?.stripeCustomerId) { res.json([]); return; }
  try {
    const stripe = getStripeClient();
    const invoiceList = await stripe.invoices.list({ customer: user.stripeCustomerId, limit: 24, status: "paid" });
    const result = invoiceList.data.map((inv) => ({
      stripeId: inv.id,
      number: inv.number ?? inv.id,
      date: inv.created,
      amountCents: inv.amount_paid,
      currency: inv.currency,
      pdfUrl: inv.invoice_pdf ?? null,
      hostedUrl: inv.hosted_invoice_url ?? null,
      status: inv.status ?? "paid",
    }));
    res.json(result);
  } catch {
    res.json([]);
  }
});

router.get("/billing/unlocked-contacts", requireProvider, async (req, res): Promise<void> => {
  const userId = req.userId!;
  const page = Math.max(1, parseInt(String(req.query.page ?? "1"), 10));
  const limit = 20;
  const offset = (page - 1) * limit;

  const [rows, countResult] = await Promise.all([
    db
      .select({
        id: contactUnlocksTable.id,
        projectId: contactUnlocksTable.projectId,
        unlockedAt: contactUnlocksTable.unlockedAt,
        projectType: projectsTable.projectType,
        city: projectsTable.city,
        fullName: projectsTable.fullName,
        phone: projectsTable.phone,
        email: projectsTable.email,
      })
      .from(contactUnlocksTable)
      .innerJoin(projectsTable, eq(contactUnlocksTable.projectId, projectsTable.id))
      .where(eq(contactUnlocksTable.providerUserId, userId))
      .orderBy(desc(contactUnlocksTable.unlockedAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ total: sql<number>`count(*)::int` })
      .from(contactUnlocksTable)
      .where(eq(contactUnlocksTable.providerUserId, userId)),
  ]);

  const total = countResult[0]?.total ?? 0;
  res.json({ items: rows, total, page, limit });
});

// NOTE: The legacy POST /billing/subscribe endpoint was removed before launch.
// It activated paid plans via a mock provider without a real charge. Paid plans
// now activate ONLY through verified Stripe Checkout + webhook (see routes/stripe.ts).

router.post("/billing/cancel", requireProvider, async (req, res): Promise<void> => {
  const userId = req.userId!;
  const [sub] = await db
    .select()
    .from(subscriptionsTable)
    .where(eq(subscriptionsTable.userId, userId))
    .orderBy(desc(subscriptionsTable.id))
    .limit(1);
  if (!sub) {
    res.status(404).json({ error: "No subscription" });
    return;
  }
  if (sub.providerRef) {
    await paymentProvider.cancelSubscription({ providerRef: sub.providerRef });
  }
  await db
    .update(subscriptionsTable)
    .set({ status: "canceled" })
    .where(eq(subscriptionsTable.id, sub.id));
  res.json({ ok: true });
});

export default router;
