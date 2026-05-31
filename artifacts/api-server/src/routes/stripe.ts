import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { subscriptionPlansTable, subscriptionsTable, paymentsTable, invoicesTable, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../middlewares/requireAuth";
import { requireProvider } from "../middlewares/requireProvider";
import { stripePaymentProvider } from "../payments/stripeProvider";
import { getStripePublishableKey, getUncachableStripeClient as getStripeClient } from "../lib/stripeClient";
import { grantMonthlyCredits } from "../lib/credits";

const router: IRouter = Router();

// GET /stripe/config — returns publishable key for frontend
router.get("/stripe/config", async (_req, res): Promise<void> => {
  try {
    const publishableKey = await getStripePublishableKey();
    res.json({ publishableKey });
  } catch {
    res.status(503).json({ error: "Stripe not configured" });
  }
});

// POST /stripe/checkout — create Stripe Checkout session for a plan
router.post("/stripe/checkout", requireProvider, async (req, res): Promise<void> => {
  const userId = req.userId!;
  const body = req.body as { planId?: number; interval?: "month" | "year" };
  const { planId, interval = "month" } = body;

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

  if (plan.slug === "free") {
    res.status(400).json({ error: "Free plan does not require checkout" });
    return;
  }

  const priceId = interval === "year" ? plan.stripePriceYearly : plan.stripePriceMonthly;
  if (!priceId) {
    res.status(503).json({ error: "Stripe price not configured for this plan. Run seed-stripe-products first." });
    return;
  }

  const host = `${req.protocol}://${req.get("host")}`;
  const successUrl = `${host}/provider/billing?checkout=success&plan=${plan.slug}`;
  const cancelUrl = `${host}/provider/billing?checkout=cancel`;

  try {
    const checkoutUrl = await stripePaymentProvider.createCheckoutSession({
      userId,
      priceId,
      successUrl,
      cancelUrl,
      interval,
    });
    res.json({ url: checkoutUrl });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Checkout failed";
    res.status(500).json({ error: msg });
  }
});

// POST /stripe/portal — Stripe Customer Portal (manage/cancel subscription)
router.post("/stripe/portal", requireProvider, async (req, res): Promise<void> => {
  const userId = req.userId!;
  const host = `${req.protocol}://${req.get("host")}`;
  const returnUrl = `${host}/provider/billing`;

  try {
    const portalUrl = await stripePaymentProvider.createPortalSession({ userId, returnUrl });
    res.json({ url: portalUrl });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Portal failed";
    res.status(500).json({ error: msg });
  }
});

// POST /stripe/webhook — receives Stripe events (registered in app.ts before json middleware)
// This route is wired up directly in app.ts — exported here for reference only
export async function handleStripeWebhook(payload: Buffer, signature: string): Promise<void> {
  const { WebhookHandlers } = await import("../lib/webhookHandlers");
  await WebhookHandlers.processWebhook(payload, signature);
}

// GET /stripe/subscription/sync — verify and activate subscription after successful checkout
// Frontend calls this on /provider/billing?checkout=success to provision local DB subscription
router.get("/stripe/subscription/sync", requireAuth, async (req, res): Promise<void> => {
  const userId = req.userId!;

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!user?.stripeCustomerId) {
    res.json({ synced: false, reason: "no_stripe_customer" });
    return;
  }

  try {
    const stripe = await getStripeClient();
    const stripeSubs = await stripe.subscriptions.list({
      customer: user.stripeCustomerId,
      status: "active",
      limit: 1,
      expand: ["data.items.data.price"],
    });

    const activeSub = stripeSubs.data[0];
    if (!activeSub) {
      res.json({ synced: false, reason: "no_active_stripe_subscription" });
      return;
    }

    const priceItem = activeSub.items.data[0];
    const priceId = priceItem?.price?.id;
    if (!priceId) {
      res.json({ synced: false, reason: "no_price_on_subscription" });
      return;
    }

    // Lookup plan by Stripe price ID
    const [planByMonthly] = await db
      .select()
      .from(subscriptionPlansTable)
      .where(eq(subscriptionPlansTable.stripePriceMonthly, priceId));

    const [planByYearly] = await db
      .select()
      .from(subscriptionPlansTable)
      .where(eq(subscriptionPlansTable.stripePriceYearly, priceId));

    const plan = planByMonthly ?? planByYearly;
    if (!plan) {
      res.json({ synced: false, reason: "plan_not_found_for_price" });
      return;
    }

    // Cancel existing local subscriptions
    await db
      .update(subscriptionsTable)
      .set({ status: "canceled" })
      .where(eq(subscriptionsTable.userId, userId));

    // Stripe v20 uses Unix timestamps (seconds)
    const rawStart = (activeSub as unknown as { current_period_start: number }).current_period_start;
    const rawEnd = (activeSub as unknown as { current_period_end: number }).current_period_end;
    const periodStart = new Date(rawStart * 1000);
    const periodEnd = new Date(rawEnd * 1000);

    const [sub] = await db
      .insert(subscriptionsTable)
      .values({
        userId,
        planId: plan.id,
        status: "active",
        currentPeriodStart: periodStart,
        currentPeriodEnd: periodEnd,
        providerRef: activeSub.id,
      })
      .returning();

    if (plan.monthlyCredits !== 0) {
      const credits = plan.monthlyCredits === -1 ? 999 : plan.monthlyCredits;
      await grantMonthlyCredits(userId, credits, periodEnd, `Stripe sync: ${plan.slug}`);
    }

    const [payment] = await db
      .insert(paymentsTable)
      .values({
        userId,
        kind: "subscription",
        refSlug: plan.slug,
        amountCents: plan.priceCents,
        currency: "CHF",
        providerRef: activeSub.id,
        status: "succeeded",
      })
      .returning();

    if (payment) {
      await db.insert(invoicesTable).values({
        paymentId: payment.id,
        number: `INV-${payment.id.toString().padStart(6, "0")}`,
      });
    }

    res.json({ synced: true, plan: plan.slug, subscriptionId: sub?.id });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Sync failed";
    res.status(500).json({ error: msg });
  }
});

export default router;
