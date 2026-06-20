import { Router, type IRouter } from "express";
import { desc, eq, sql } from "drizzle-orm";
import {
  db,
  subscriptionsTable,
  subscriptionPlansTable,
  paymentsTable,
  usersTable,
} from "@workspace/db";
import { requireUserAdmin } from "../middlewares/requireProvider";

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
  const [totalRev] = await db
    .select({ rev: sql<number>`coalesce(sum(${paymentsTable.amountCents}), 0)::int` })
    .from(paymentsTable);
  res.json({
    mrrCents: mrrRow?.mrr ?? 0,
    activeSubscriptions: mrrRow?.active ?? 0,
    totalRevenueCents: totalRev?.rev ?? 0,
    failedPayments: [],
  });
});

router.patch("/admin/plans/:id", requireUserAdmin, async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  const body = req.body as Record<string, unknown>;
  const updates: Partial<typeof subscriptionPlansTable.$inferInsert> = {};
  if (typeof body.priceCents === "number") updates.priceCents = body.priceCents;
  if (Object.keys(updates).length === 0) {
    res.status(400).json({ error: "Nothing to update" });
    return;
  }
  await db.update(subscriptionPlansTable).set(updates).where(eq(subscriptionPlansTable.id, id));
  res.json({ ok: true });
});

export default router;
