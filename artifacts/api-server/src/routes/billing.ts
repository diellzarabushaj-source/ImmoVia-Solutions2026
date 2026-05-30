import { Router, type IRouter } from "express";
import { and, desc, eq, gte, sql } from "drizzle-orm";
import {
  db,
  subscriptionPlansTable,
  immocreditPacksTable,
  subscriptionsTable,
  paymentsTable,
  invoicesTable,
  immocreditTransactionsTable,
  offersTable,
} from "@workspace/db";
import { requireProvider } from "../middlewares/requireProvider";
import { paymentProvider } from "../payments";
import {
  addPurchasedCredits,
  getBalance,
  grantMonthlyCredits,
  rollSubscriptionCycle,
} from "../lib/credits";

const router: IRouter = Router();

export const PLAN_APP_LIMITS: Record<string, number> = {
  free: 2,
  starter: 10,
  professional: 30,
  premium: 100,
  founding: 10,
};

export const PLAN_CONTACT_VISIBLE: Record<string, boolean> = {
  free: false,
  starter: true,
  professional: true,
  premium: true,
  founding: true,
};

export const PLAN_BADGES: Record<string, string> = {
  free: "Basic Anbieter",
  starter: "Aktiver Anbieter",
  professional: "Verifizierter Anbieter",
  premium: "Top Anbieter",
  founding: "Founding Anbieter",
};

// Public catalogs
router.get("/plans", async (_req, res): Promise<void> => {
  const plans = await db
    .select()
    .from(subscriptionPlansTable)
    .orderBy(subscriptionPlansTable.sortOrder);
  res.json(plans);
});

router.get("/packs", async (_req, res): Promise<void> => {
  const packs = await db
    .select()
    .from(immocreditPacksTable)
    .orderBy(immocreditPacksTable.sortOrder);
  res.json(packs);
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

router.get("/provider/balance", requireProvider, async (req, res): Promise<void> => {
  const userId = req.userId!;
  await rollSubscriptionCycle(userId);
  const balance = await getBalance(userId);
  res.json(balance);
});

router.get("/provider/transactions", requireProvider, async (req, res): Promise<void> => {
  const userId = req.userId!;
  const rows = await db
    .select()
    .from(immocreditTransactionsTable)
    .where(eq(immocreditTransactionsTable.userId, userId))
    .orderBy(desc(immocreditTransactionsTable.id))
    .limit(100);
  res.json(rows);
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
  const payments = await db
    .select()
    .from(paymentsTable)
    .where(eq(paymentsTable.userId, userId));
  const paymentIds = new Set(payments.map((p) => p.id));
  const allInvoices = await db.select().from(invoicesTable).orderBy(desc(invoicesTable.id));
  res.json(allInvoices.filter((i) => paymentIds.has(i.paymentId)));
});

router.post("/billing/subscribe", requireProvider, async (req, res): Promise<void> => {
  const userId = req.userId!;
  const body = req.body as Record<string, unknown>;
  const planId = typeof body.planId === "number" ? body.planId : null;
  if (!planId) {
    res.status(400).json({ error: "planId required" });
    return;
  }
  const [plan] = await db
    .select()
    .from(subscriptionPlansTable)
    .where(eq(subscriptionPlansTable.id, planId));
  if (!plan) {
    res.status(404).json({ error: "Plan not found" });
    return;
  }

  await db
    .update(subscriptionsTable)
    .set({ status: "canceled" })
    .where(eq(subscriptionsTable.userId, userId));

  const result = await paymentProvider.createSubscription({
    userId,
    planSlug: plan.slug,
    priceCents: plan.priceCents,
  });

  const [sub] = await db
    .insert(subscriptionsTable)
    .values({
      userId,
      planId: plan.id,
      status: "active",
      currentPeriodStart: result.currentPeriodStart,
      currentPeriodEnd: result.currentPeriodEnd,
      providerRef: result.providerRef,
    })
    .returning();

  let payment = null;
  if (plan.priceCents > 0) {
    [payment] = await db
      .insert(paymentsTable)
      .values({
        userId,
        kind: "subscription",
        refSlug: plan.slug,
        amountCents: plan.priceCents,
        currency: "CHF",
        providerRef: result.providerRef,
        status: "succeeded",
      })
      .returning();
    if (payment) {
      await db.insert(invoicesTable).values({
        paymentId: payment.id,
        number: `INV-${payment.id.toString().padStart(6, "0")}`,
      });
    }
  }

  if (plan.monthlyCredits > 0) {
    await grantMonthlyCredits(
      userId,
      plan.monthlyCredits,
      result.currentPeriodEnd,
      `Subscribe: ${plan.slug}`,
    );
  }

  res.json({ subscription: sub, plan, payment });
});

router.post("/billing/buy-pack", requireProvider, async (req, res): Promise<void> => {
  const userId = req.userId!;
  const body = req.body as Record<string, unknown>;
  const packId = typeof body.packId === "number" ? body.packId : null;
  if (!packId) {
    res.status(400).json({ error: "packId required" });
    return;
  }
  const [pack] = await db
    .select()
    .from(immocreditPacksTable)
    .where(eq(immocreditPacksTable.id, packId));
  if (!pack) {
    res.status(404).json({ error: "Pack not found" });
    return;
  }

  const result = await paymentProvider.chargeOnce({
    userId,
    packSlug: pack.slug,
    priceCents: pack.priceCents,
  });

  const [payment] = await db
    .insert(paymentsTable)
    .values({
      userId,
      kind: "pack",
      refSlug: pack.slug,
      amountCents: pack.priceCents,
      currency: "CHF",
      providerRef: result.providerRef,
      status: "succeeded",
    })
    .returning();
  if (payment) {
    await db.insert(invoicesTable).values({
      paymentId: payment.id,
      number: `INV-${payment.id.toString().padStart(6, "0")}`,
    });
    await addPurchasedCredits(userId, pack.credits, payment.id, `Pack: ${pack.slug}`);
  }

  res.json({ pack, payment, creditsAdded: pack.credits });
});

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
