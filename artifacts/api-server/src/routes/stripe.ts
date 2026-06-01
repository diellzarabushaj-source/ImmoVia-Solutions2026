import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { subscriptionPlansTable, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../middlewares/requireAuth";
import { requireProvider } from "../middlewares/requireProvider";
import { stripePaymentProvider } from "../payments/stripeProvider";
import {
  getStripePublishableKey,
  getUncachableStripeClient as getStripeClient,
  priceIdForSlug,
  getTestPriceId,
} from "../lib/stripeClient";
import { activateSubscription } from "../lib/stripeActivation";

const router: IRouter = Router();

// GET /stripe/config — returns publishable key for frontend (safe to expose)
router.get("/stripe/config", (_req, res): void => {
  try {
    res.json({ publishableKey: getStripePublishableKey() });
  } catch {
    res.status(503).json({ error: "Stripe not configured" });
  }
});

// POST /stripe/checkout — create a subscription Checkout session for a plan
router.post("/stripe/checkout", requireProvider, async (req, res): Promise<void> => {
  const userId = req.userId!;
  const body = req.body as { planId?: number };
  const { planId } = body;

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

  // Live monthly price IDs come from explicit env vars (mapped by plan slug).
  const priceId = priceIdForSlug(plan.slug);
  if (!priceId) {
    res.status(503).json({
      error:
        "Stripe price not configured for this plan. Set the STRIPE_*_PRICE_ID environment variables.",
    });
    return;
  }

  const host = `${req.protocol}://${req.get("host")}`;
  // {CHECKOUT_SESSION_ID} is substituted by Stripe so we can resolve the session on success.
  const successUrl = `${host}/dashboard?payment=success&session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl = `${host}/pricing?payment=cancelled`;

  try {
    const checkoutUrl = await stripePaymentProvider.createCheckoutSession({
      userId,
      priceId,
      successUrl,
      cancelUrl,
      interval: "month",
    });
    res.json({ url: checkoutUrl });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Checkout failed";
    res.status(500).json({ error: msg });
  }
});

// POST /stripe/test-checkout — one-time CHF 1 live test payment (no plan upgrade)
router.post("/stripe/test-checkout", requireProvider, async (req, res): Promise<void> => {
  const userId = req.userId!;

  let priceId: string;
  try {
    priceId = getTestPriceId();
  } catch {
    res.status(503).json({ error: "STRIPE_TEST_PRICE_ID is not configured" });
    return;
  }

  const host = `${req.protocol}://${req.get("host")}`;
  const successUrl = `${host}/dashboard?payment=success&test=1`;
  const cancelUrl = `${host}/pricing?payment=cancelled`;

  try {
    const checkoutUrl = await stripePaymentProvider.createTestPaymentSession({
      userId,
      priceId,
      successUrl,
      cancelUrl,
    });
    res.json({ url: checkoutUrl });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Test checkout failed";
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
// Accepts optional ?session_id=cs_xxx so we can resolve the subscription directly
router.get("/stripe/subscription/sync", requireAuth, async (req, res): Promise<void> => {
  const userId = req.userId!;
  const sessionId = typeof req.query["session_id"] === "string" ? req.query["session_id"] : undefined;

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!user?.stripeCustomerId && !sessionId) {
    res.json({ synced: false, reason: "no_stripe_customer" });
    return;
  }

  try {
    const stripe = await getStripeClient();

    // Resolve the active subscription — prefer session_id path to avoid race conditions
    // where Stripe hasn't transitioned the subscription to "active" yet.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let activeSub: any | undefined;

    if (sessionId) {
      // Retrieve the checkout session; the subscription field will be the sub ID or object
      const session = await stripe.checkout.sessions.retrieve(sessionId, {
        expand: ["subscription"],
      });
      const embedded = session.subscription;
      if (embedded && typeof embedded !== "string") {
        activeSub = embedded;
      } else if (typeof embedded === "string") {
        activeSub = await stripe.subscriptions.retrieve(embedded);
      }
    }

    if (!activeSub && user?.stripeCustomerId) {
      // Fallback: list active/trialing subscriptions for this customer
      const stripeSubs = await stripe.subscriptions.list({
        customer: user.stripeCustomerId,
        status: "active",
        limit: 1,
      });
      if (stripeSubs.data[0]) {
        activeSub = stripeSubs.data[0];
      } else {
        // Also check trialing (free trial period)
        const trialSubs = await stripe.subscriptions.list({
          customer: user.stripeCustomerId,
          status: "trialing",
          limit: 1,
        });
        activeSub = trialSubs.data[0];
      }
    }

    if (!activeSub) {
      res.json({ synced: false, reason: "no_active_stripe_subscription" });
      return;
    }

    // Provision the local subscription idempotently (shared with webhook handling).
    const slug = await activateSubscription(activeSub);
    if (!slug) {
      res.json({ synced: false, reason: "plan_not_found_for_price" });
      return;
    }

    res.json({ synced: true, plan: slug });
  } catch (err) {
    req.log.error({ err }, "stripe sync error");
    const msg = err instanceof Error ? err.message : "Sync failed";
    res.status(500).json({ error: msg });
  }
});

export default router;
