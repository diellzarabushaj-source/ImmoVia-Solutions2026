import { and, desc, eq } from "drizzle-orm";
import { db, subscriptionsTable } from "@workspace/db";

/** Advance the subscription billing period if it has expired. */
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

  const start = new Date(sub.currentPeriodEnd);
  const end = new Date(start);
  end.setMonth(end.getMonth() + 1);
  await db
    .update(subscriptionsTable)
    .set({ currentPeriodStart: start, currentPeriodEnd: end })
    .where(eq(subscriptionsTable.id, sub.id));
}
