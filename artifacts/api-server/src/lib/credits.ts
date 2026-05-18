import { and, desc, eq, gt, sql } from "drizzle-orm";
import {
  db,
  immocreditTransactionsTable,
  subscriptionsTable,
  subscriptionPlansTable,
} from "@workspace/db";

export interface CreditBalance {
  monthly: number;
  purchased: number;
  total: number;
  usedThisMonth: number;
}

// Compute current balances by reading the latest transaction row.
// The displayed balance is always derived from / consistent with the ledger.
export async function getBalance(userId: number): Promise<CreditBalance> {
  const [last] = await db
    .select({
      monthly: immocreditTransactionsTable.balanceAfterMonthly,
      purchased: immocreditTransactionsTable.balanceAfterPurchased,
    })
    .from(immocreditTransactionsTable)
    .where(eq(immocreditTransactionsTable.userId, userId))
    .orderBy(desc(immocreditTransactionsTable.id))
    .limit(1);

  const monthly = last?.monthly ?? 0;
  const purchased = last?.purchased ?? 0;

  // usedThisMonth = sum of negative spend amounts since active sub's currentPeriodStart, else 30d
  const [sub] = await db
    .select()
    .from(subscriptionsTable)
    .where(eq(subscriptionsTable.userId, userId))
    .orderBy(desc(subscriptionsTable.id))
    .limit(1);

  const since = sub?.currentPeriodStart ?? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const [usedRow] = await db
    .select({ used: sql<number>`coalesce(-sum(${immocreditTransactionsTable.amount}), 0)::int` })
    .from(immocreditTransactionsTable)
    .where(
      and(
        eq(immocreditTransactionsTable.userId, userId),
        eq(immocreditTransactionsTable.type, "spend"),
        gt(immocreditTransactionsTable.createdAt, since),
      ),
    );

  return {
    monthly,
    purchased,
    total: monthly + purchased,
    usedThisMonth: usedRow?.used ?? 0,
  };
}

interface AppendArgs {
  userId: number;
  type: "grant" | "purchase" | "spend" | "refund" | "adjustment" | "expire";
  bucket: "monthly" | "purchased";
  deltaMonthly: number;
  deltaPurchased: number;
  relatedOfferId?: number | null;
  relatedProjectId?: number | null;
  relatedPaymentId?: number | null;
  expiresAt?: Date | null;
  note?: string | null;
}

async function appendTx(args: AppendArgs): Promise<void> {
  const bal = await getBalance(args.userId);
  const newMonthly = bal.monthly + args.deltaMonthly;
  const newPurchased = bal.purchased + args.deltaPurchased;
  if (newMonthly < 0 || newPurchased < 0) {
    throw new Error("Insufficient credits");
  }
  const amount = args.deltaMonthly + args.deltaPurchased;
  await db.insert(immocreditTransactionsTable).values({
    userId: args.userId,
    type: args.type,
    bucket: args.bucket,
    amount,
    balanceAfterMonthly: newMonthly,
    balanceAfterPurchased: newPurchased,
    relatedOfferId: args.relatedOfferId ?? null,
    relatedProjectId: args.relatedProjectId ?? null,
    relatedPaymentId: args.relatedPaymentId ?? null,
    expiresAt: args.expiresAt ?? null,
    note: args.note ?? null,
  });
}

export async function grantMonthlyCredits(
  userId: number,
  credits: number,
  expiresAt: Date,
  note: string,
): Promise<void> {
  // Reset monthly bucket to plan allotment (replace, not add).
  const bal = await getBalance(userId);
  const delta = credits - bal.monthly;
  if (delta === 0) return;
  await appendTx({
    userId,
    type: "grant",
    bucket: "monthly",
    deltaMonthly: delta,
    deltaPurchased: 0,
    expiresAt,
    note,
  });
}

export async function addPurchasedCredits(
  userId: number,
  credits: number,
  paymentId: number,
  note: string,
): Promise<void> {
  const expires = new Date();
  expires.setFullYear(expires.getFullYear() + 1);
  await appendTx({
    userId,
    type: "purchase",
    bucket: "purchased",
    deltaMonthly: 0,
    deltaPurchased: credits,
    relatedPaymentId: paymentId,
    expiresAt: expires,
    note,
  });
}

export async function adminAdjust(
  userId: number,
  delta: number,
  bucket: "monthly" | "purchased",
  note: string,
): Promise<void> {
  await appendTx({
    userId,
    type: "adjustment",
    bucket,
    deltaMonthly: bucket === "monthly" ? delta : 0,
    deltaPurchased: bucket === "purchased" ? delta : 0,
    note,
  });
}

export async function refundCredits(
  userId: number,
  amount: number,
  offerId: number,
  note: string,
): Promise<void> {
  // Refund into purchased bucket.
  await appendTx({
    userId,
    type: "refund",
    bucket: "purchased",
    deltaMonthly: 0,
    deltaPurchased: amount,
    relatedOfferId: offerId,
    note,
  });
}

// Spend monthly first, then purchased. Throws if insufficient.
export async function spendCredits(args: {
  userId: number;
  amount: number;
  offerId: number;
  projectId: number;
  note: string;
}): Promise<void> {
  const bal = await getBalance(args.userId);
  if (bal.total < args.amount) throw new Error("Insufficient credits");
  const fromMonthly = Math.min(bal.monthly, args.amount);
  const fromPurchased = args.amount - fromMonthly;
  if (fromMonthly > 0) {
    await appendTx({
      userId: args.userId,
      type: "spend",
      bucket: "monthly",
      deltaMonthly: -fromMonthly,
      deltaPurchased: 0,
      relatedOfferId: args.offerId,
      relatedProjectId: args.projectId,
      note: args.note,
    });
  }
  if (fromPurchased > 0) {
    await appendTx({
      userId: args.userId,
      type: "spend",
      bucket: "purchased",
      deltaMonthly: 0,
      deltaPurchased: -fromPurchased,
      relatedOfferId: args.offerId,
      relatedProjectId: args.projectId,
      note: args.note,
    });
  }
}

// Roll monthly cycle deterministically: if active subscription's
// current_period_end is past, advance it and re-grant monthly credits.
export async function rollSubscriptionCycle(userId: number): Promise<void> {
  const [sub] = await db
    .select()
    .from(subscriptionsTable)
    .where(and(eq(subscriptionsTable.userId, userId), eq(subscriptionsTable.status, "active")))
    .orderBy(desc(subscriptionsTable.id))
    .limit(1);
  if (!sub) return;
  const now = new Date();
  if (now <= sub.currentPeriodEnd) return;

  const [plan] = await db
    .select()
    .from(subscriptionPlansTable)
    .where(eq(subscriptionPlansTable.id, sub.planId));
  if (!plan) return;

  const start = new Date(sub.currentPeriodEnd);
  const end = new Date(start);
  end.setMonth(end.getMonth() + 1);
  await db
    .update(subscriptionsTable)
    .set({ currentPeriodStart: start, currentPeriodEnd: end })
    .where(eq(subscriptionsTable.id, sub.id));

  if (plan.monthlyCredits > 0) {
    await grantMonthlyCredits(userId, plan.monthlyCredits, end, `Cycle: ${plan.slug}`);
  }
}

export const PROJECT_SIZE_COST: Record<string, number> = {
  small: 2,
  medium: 5,
  large: 10,
  premium: 20,
};
export const OFFER_TYPE_SURCHARGE: Record<string, number> = {
  normal: 0,
  highlighted: 3,
  top: 7,
};
export const PROJECT_SIZE_OFFER_CAP: Record<string, number> = {
  small: 5,
  medium: 8,
  large: 12,
  premium: 15,
};

export function offerCost(projectSize: string, offerType: string): number {
  const base = PROJECT_SIZE_COST[projectSize] ?? PROJECT_SIZE_COST.medium!;
  const surcharge = OFFER_TYPE_SURCHARGE[offerType] ?? 0;
  return base + surcharge;
}
