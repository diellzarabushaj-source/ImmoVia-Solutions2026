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
  free: 2,
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
  basic: false,   // Basic: platform messages only, no contact details
  pro: true,      // Professional: can see project poster contact details
  premium: true,  // Premium: can see all contact details
  // legacy
  starter: false,
  professional: true,
  founding: false,
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

  const planSlug = plan?.slug ?? "free";
  const appLimit = PLAN_APP_LIMITS[planSlug] ?? 2;
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
    planName: plan?.name ?? "Free",
    priceCents: plan?.priceCents ?? 0,
    appLimit,
    usedThisMonth: usedThisMonth ?? 0,
    contactVisible,
    badge,
    periodStart: sub?.currentPeriodStart ?? periodStart,
    periodEnd: sub?.currentPeriodEnd ?? null,
    features: plan?.features ?? [],
    contactUnlocksUsed: unlockStats.used,
    contactUnlocksLimit: unlockStats.limit,
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

  const result: Array<typeof regularInvoices[number] & { kind?: string; amountCents?: number; status?: string }> = [...regularInvoices];

  if (user) {
    const [company] = await db
      .select({ registrationFeePaid: companiesTable.registrationFeePaid, createdAt: companiesTable.createdAt })
      .from(companiesTable)
      .where(eq(companiesTable.email, user.email))
      .limit(1);
    if (company?.registrationFeePaid) {
      result.unshift({
        id: 0,
        paymentId: 0,
        number: "REG-001",
        issuedAt: company.createdAt instanceof Date ? company.createdAt : new Date(company.createdAt as string),
        kind: "registration",
        amountCents: 14900,
        status: "paid",
      });
    }
  }

  res.json(result);
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
