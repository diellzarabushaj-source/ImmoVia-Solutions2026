import type Stripe from "stripe";
import { eq } from "drizzle-orm";
import {
  db,
  usersTable,
  subscriptionPlansTable,
  subscriptionsTable,
  paymentsTable,
  invoicesTable,
  companiesTable,
} from "@workspace/db";
import { slugForPriceId } from "./stripeClient";
import { logger } from "./logger";

function customerIdOf(value: string | { id: string } | null | undefined): string | undefined {
  if (!value) return undefined;
  return typeof value === "string" ? value : value.id;
}

async function resolveUserId(args: {
  metadataUserId?: string | null;
  customer?: string | { id: string } | null;
}): Promise<number | undefined> {
  if (args.metadataUserId) {
    const id = Number(args.metadataUserId);
    if (!Number.isNaN(id)) return id;
  }
  const customerId = customerIdOf(args.customer);
  if (customerId) {
    const [user] = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.stripeCustomerId, customerId));
    return user?.id;
  }
  return undefined;
}

function priceIdOf(sub: Stripe.Subscription): string | undefined {
  const rawPrice = sub.items?.data[0]?.price;
  return typeof rawPrice === "string" ? rawPrice : rawPrice?.id;
}

function periodFromSubscription(sub: Stripe.Subscription): { start: Date; end: Date } {
  // Stripe v20 removed current_period_start/current_period_end from the
  // Subscription object — derive the period from start_date + the price interval.
  const rawStart = sub.start_date ?? sub.billing_cycle_anchor ?? Math.floor(Date.now() / 1000);
  const start = new Date(rawStart * 1000);
  const end = new Date(start);
  const interval = sub.items?.data[0]?.price?.recurring?.interval;
  if (interval === "year") end.setFullYear(end.getFullYear() + 1);
  else end.setMonth(end.getMonth() + 1);
  return { start, end };
}

/**
 * Idempotently mirror a Stripe subscription into the local DB.
 * Safe to call from both the post-checkout sync route and webhook events.
 * Returns the resolved plan slug when it activated/updated, otherwise null.
 *
 * @param overrideUserId - when the caller already knows the local user ID (e.g.
 *   the authenticated sync route), pass it here so we don't depend on the
 *   Stripe metadata or stripeCustomerId being set.
 */
export async function activateSubscription(
  sub: Stripe.Subscription,
  overrideUserId?: number,
): Promise<string | null> {
  const userId = overrideUserId ?? await resolveUserId({
    metadataUserId: sub.metadata?.["userId"],
    customer: sub.customer,
  });
  if (!userId) {
    logger.warn({ subscription: sub.id }, "Stripe subscription has no matching local user");
    return null;
  }

  const priceId = priceIdOf(sub);
  if (!priceId) {
    logger.warn({ subscription: sub.id }, "Stripe subscription has no price");
    return null;
  }

  const slug = slugForPriceId(priceId);
  if (!slug) {
    logger.warn({ priceId }, "No local plan slug maps to this Stripe price ID");
    return null;
  }

  const [plan] = await db
    .select()
    .from(subscriptionPlansTable)
    .where(eq(subscriptionPlansTable.slug, slug));
  if (!plan) {
    logger.warn({ slug }, "Plan not found for slug");
    return null;
  }

  const { start, end } = periodFromSubscription(sub);
  // Entitlement (credits + paid status) is only granted for charge-confirmed states.
  const isEntitled = sub.status === "active" || sub.status === "trialing";
  const status = isEntitled ? "active" : (sub.status ?? "incomplete");

  // Idempotency: if we already track this Stripe subscription, just update it.
  const [existing] = await db
    .select()
    .from(subscriptionsTable)
    .where(eq(subscriptionsTable.providerRef, sub.id));

  if (existing) {
    await db
      .update(subscriptionsTable)
      .set({ status, currentPeriodStart: start, currentPeriodEnd: end, planId: plan.id })
      .where(eq(subscriptionsTable.id, existing.id));
    return plan.slug;
  }

  // New subscription: supersede any previous local subscriptions for this user.
  await db
    .update(subscriptionsTable)
    .set({ status: "canceled" })
    .where(eq(subscriptionsTable.userId, userId));

  await db.insert(subscriptionsTable).values({
    userId,
    planId: plan.id,
    status,
    currentPeriodStart: start,
    currentPeriodEnd: end,
    providerRef: sub.id,
  });

  // Do not record a paid invoice until Stripe confirms the charge.
  if (!isEntitled) {
    logger.info(
      { userId, plan: plan.slug, subscription: sub.id, status: sub.status },
      "Recorded Stripe subscription (not yet entitled)",
    );
    return plan.slug;
  }

  // Record the initial subscription payment (keyed by subscription id for idempotency).
  const [payment] = await db
    .insert(paymentsTable)
    .values({
      userId,
      kind: "subscription",
      refSlug: plan.slug,
      amountCents: plan.priceCents,
      currency: "CHF",
      providerRef: sub.id,
      status: "succeeded",
    })
    .returning();

  if (payment) {
    await db.insert(invoicesTable).values({
      paymentId: payment.id,
      number: `INV-${payment.id.toString().padStart(6, "0")}`,
    });
  }

  logger.info({ userId, plan: plan.slug, subscription: sub.id }, "Activated Stripe subscription");

  // Sync planType on the provider's company directory entry (linked by user email) so
  // that the directory sort order reflects the live subscription state.
  try {
    const [user] = await db.select({ email: usersTable.email }).from(usersTable).where(eq(usersTable.id, userId));
    if (user?.email) {
      await db.update(companiesTable).set({ planType: plan.slug }).where(eq(companiesTable.email, user.email));
    }
  } catch (syncErr) {
    logger.warn({ syncErr }, "Failed to sync planType on company profile");
  }

  return plan.slug;
}

export async function markSubscriptionCanceled(providerRef: string): Promise<void> {
  await db
    .update(subscriptionsTable)
    .set({ status: "canceled" })
    .where(eq(subscriptionsTable.providerRef, providerRef));
  logger.info({ subscription: providerRef }, "Marked Stripe subscription canceled");
}

export async function markSubscriptionPastDue(customer: string | { id: string } | null): Promise<void> {
  const customerId = customerIdOf(customer);
  if (!customerId) return;
  const [user] = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.stripeCustomerId, customerId));
  if (!user) return;
  await db
    .update(subscriptionsTable)
    .set({ status: "past_due" })
    .where(eq(subscriptionsTable.userId, user.id));
}

/**
 * Record an invoice payment (renewals / failures). Idempotent by invoice id.
 * The initial subscription_create invoice is skipped because activateSubscription
 * already recorded that first payment.
 */
export async function recordInvoice(
  invoice: Stripe.Invoice,
  result: "succeeded" | "failed",
): Promise<void> {
  // Initial subscription invoice already handled during activation.
  if (result === "succeeded" && invoice.billing_reason === "subscription_create") return;

  const userId = await resolveUserId({ customer: invoice.customer });
  if (!userId) {
    logger.warn({ invoice: invoice.id }, "Invoice has no matching local user");
    return;
  }

  const providerRef = invoice.id ?? `inv_${Date.now()}`;
  const [existing] = await db
    .select({ id: paymentsTable.id })
    .from(paymentsTable)
    .where(eq(paymentsTable.providerRef, providerRef));
  if (existing) return;

  const [payment] = await db
    .insert(paymentsTable)
    .values({
      userId,
      kind: "subscription",
      refSlug: "renewal",
      amountCents: invoice.amount_paid || invoice.amount_due || 0,
      currency: (invoice.currency ?? "chf").toUpperCase(),
      providerRef,
      status: result,
    })
    .returning();

  if (result === "succeeded" && payment) {
    await db.insert(invoicesTable).values({
      paymentId: payment.id,
      number: invoice.number ?? `INV-${payment.id.toString().padStart(6, "0")}`,
    });
  }
  logger.info({ userId, invoice: invoice.id, result }, "Recorded invoice payment");
}
