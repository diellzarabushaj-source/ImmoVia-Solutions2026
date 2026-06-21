import { and, desc, eq } from "drizzle-orm";
import { db, subscriptionsTable } from "@workspace/db";

/**
 * Called on every /provider/app-stats request.
 *
 * If the subscription period has ended and Stripe hasn't yet delivered a renewal
 * webhook (customer.subscription.updated), mark it "past_due" so billing treats
 * the user as expired.  A 2-hour grace window absorbs normal Stripe delivery lag.
 *
 * Period advancement is Stripe's responsibility — handled exclusively via webhooks.
 * activateSubscription() resets status → "active" and sets a new currentPeriodEnd
 * once the renewal webhook arrives, restoring full access.
 */
export async function rollSubscriptionCycle(userId: number): Promise<void> {
  const [sub] = await db
    .select()
    .from(subscriptionsTable)
    .where(and(eq(subscriptionsTable.userId, userId), eq(subscriptionsTable.status, "active")))
    .orderBy(desc(subscriptionsTable.id))
    .limit(1);

  if (!sub) return;

  const GRACE_MS = 2 * 60 * 60 * 1000; // 2-hour grace for webhook lag
  if (Date.now() > sub.currentPeriodEnd.getTime() + GRACE_MS) {
    await db
      .update(subscriptionsTable)
      .set({ status: "past_due" })
      .where(eq(subscriptionsTable.id, sub.id));
  }
}
