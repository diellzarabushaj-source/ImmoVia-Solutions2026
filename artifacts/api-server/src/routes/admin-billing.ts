import { Router, type IRouter } from "express";
import { desc, eq, sql } from "drizzle-orm";
import {
  db,
  subscriptionsTable,
  subscriptionPlansTable,
  immocreditTransactionsTable,
  paymentsTable,
  usersTable,
  offersTable,
  immocreditPacksTable,
} from "@workspace/db";
import { requireUserAdmin } from "../middlewares/requireProvider";
import { adminAdjust, refundCredits } from "../lib/credits";

const router: IRouter = Router();

router.get("/admin/subscriptions", requireUserAdmin, async (_req, res): Promise<void> => {
  const rows = await db
    .select({
      id: subscriptionsTable.id,
      userId: subscriptionsTable.userId,
      status: subscriptionsTable.status,
      currentPeriodStart: subscriptionsTable.currentPeriodStart,
      currentPeriodEnd: subscriptionsTable.currentPeriodEnd,
      planSlug: subscriptionPlansTable.slug,
      planName: subscriptionPlansTable.name,
      planPriceCents: subscriptionPlansTable.priceCents,
      userEmail: usersTable.email,
      userName: usersTable.fullName,
    })
    .from(subscriptionsTable)
    .leftJoin(subscriptionPlansTable, eq(subscriptionsTable.planId, subscriptionPlansTable.id))
    .leftJoin(usersTable, eq(subscriptionsTable.userId, usersTable.id))
    .orderBy(desc(subscriptionsTable.id))
    .limit(500);
  res.json(rows);
});

router.get("/admin/transactions", requireUserAdmin, async (_req, res): Promise<void> => {
  const rows = await db
    .select({
      id: immocreditTransactionsTable.id,
      userId: immocreditTransactionsTable.userId,
      type: immocreditTransactionsTable.type,
      bucket: immocreditTransactionsTable.bucket,
      amount: immocreditTransactionsTable.amount,
      balanceAfterMonthly: immocreditTransactionsTable.balanceAfterMonthly,
      balanceAfterPurchased: immocreditTransactionsTable.balanceAfterPurchased,
      note: immocreditTransactionsTable.note,
      createdAt: immocreditTransactionsTable.createdAt,
      userEmail: usersTable.email,
    })
    .from(immocreditTransactionsTable)
    .leftJoin(usersTable, eq(immocreditTransactionsTable.userId, usersTable.id))
    .orderBy(desc(immocreditTransactionsTable.id))
    .limit(500);
  res.json(rows);
});

router.get("/admin/payments", requireUserAdmin, async (_req, res): Promise<void> => {
  const rows = await db
    .select({
      id: paymentsTable.id,
      userId: paymentsTable.userId,
      kind: paymentsTable.kind,
      refSlug: paymentsTable.refSlug,
      amountCents: paymentsTable.amountCents,
      status: paymentsTable.status,
      createdAt: paymentsTable.createdAt,
      userEmail: usersTable.email,
    })
    .from(paymentsTable)
    .leftJoin(usersTable, eq(paymentsTable.userId, usersTable.id))
    .orderBy(desc(paymentsTable.id))
    .limit(500);
  res.json(rows);
});

router.post("/admin/credits/adjust", requireUserAdmin, async (req, res): Promise<void> => {
  const body = req.body as Record<string, unknown>;
  const userId = typeof body.userId === "number" ? body.userId : null;
  const delta = typeof body.delta === "number" ? body.delta : null;
  const bucket = body.bucket === "monthly" ? "monthly" : "purchased";
  const note = typeof body.note === "string" ? body.note : "Admin adjustment";
  if (!userId || delta == null) {
    res.status(400).json({ error: "userId and delta required" });
    return;
  }
  try {
    await adminAdjust(userId, delta, bucket, note);
  } catch (e) {
    res.status(400).json({ error: (e as Error).message });
    return;
  }
  res.json({ ok: true });
});

router.post("/admin/credits/refund", requireUserAdmin, async (req, res): Promise<void> => {
  const body = req.body as Record<string, unknown>;
  const offerId = typeof body.offerId === "number" ? body.offerId : null;
  if (!offerId) {
    res.status(400).json({ error: "offerId required" });
    return;
  }
  const [offer] = await db.select().from(offersTable).where(eq(offersTable.id, offerId));
  if (!offer) {
    res.status(404).json({ error: "Offer not found" });
    return;
  }
  await refundCredits(
    offer.providerUserId,
    offer.creditsSpent,
    offer.id,
    `Refund offer #${offer.id}`,
  );
  await db.update(offersTable).set({ status: "refunded" }).where(eq(offersTable.id, offerId));
  res.json({ ok: true });
});

router.get("/admin/metrics", requireUserAdmin, async (_req, res): Promise<void> => {
  // MRR = sum of active subs prices
  const [mrrRow] = await db
    .select({
      mrr: sql<number>`coalesce(sum(${subscriptionPlansTable.priceCents}), 0)::int`,
      active: sql<number>`count(*)::int`,
    })
    .from(subscriptionsTable)
    .leftJoin(subscriptionPlansTable, eq(subscriptionsTable.planId, subscriptionPlansTable.id))
    .where(eq(subscriptionsTable.status, "active"));
  const [packRev] = await db
    .select({ rev: sql<number>`coalesce(sum(${paymentsTable.amountCents}), 0)::int` })
    .from(paymentsTable)
    .where(eq(paymentsTable.kind, "pack"));
  const [totalRev] = await db
    .select({ rev: sql<number>`coalesce(sum(${paymentsTable.amountCents}), 0)::int` })
    .from(paymentsTable);
  res.json({
    mrrCents: mrrRow?.mrr ?? 0,
    activeSubscriptions: mrrRow?.active ?? 0,
    packRevenueCents: packRev?.rev ?? 0,
    totalRevenueCents: totalRev?.rev ?? 0,
    failedPayments: [],
  });
});

router.patch("/admin/plans/:id", requireUserAdmin, async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  const body = req.body as Record<string, unknown>;
  const updates: Partial<typeof subscriptionPlansTable.$inferInsert> = {};
  if (typeof body.priceCents === "number") updates.priceCents = body.priceCents;
  if (typeof body.monthlyCredits === "number") updates.monthlyCredits = body.monthlyCredits;
  if (Object.keys(updates).length === 0) {
    res.status(400).json({ error: "Nothing to update" });
    return;
  }
  await db.update(subscriptionPlansTable).set(updates).where(eq(subscriptionPlansTable.id, id));
  res.json({ ok: true });
});

router.patch("/admin/packs/:id", requireUserAdmin, async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  const body = req.body as Record<string, unknown>;
  const updates: Partial<typeof immocreditPacksTable.$inferInsert> = {};
  if (typeof body.priceCents === "number") updates.priceCents = body.priceCents;
  if (typeof body.credits === "number") updates.credits = body.credits;
  if (Object.keys(updates).length === 0) {
    res.status(400).json({ error: "Nothing to update" });
    return;
  }
  await db.update(immocreditPacksTable).set(updates).where(eq(immocreditPacksTable.id, id));
  res.json({ ok: true });
});

export default router;
