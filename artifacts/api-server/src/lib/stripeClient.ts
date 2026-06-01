import Stripe from "stripe";
import { logger } from "./logger";

// ── Explicit live Stripe configuration via Replit Secrets ────────────────────
// We use explicit environment variables (NOT the Replit Stripe connector) so the
// deployed app talks to the real live Stripe account and the live products.
//
// Required secrets:
//   STRIPE_SECRET_KEY              — live secret key (server-only, never exposed)
//   VITE_STRIPE_PUBLISHABLE_KEY    — live publishable key (safe for the client)
//   STRIPE_BASIC_PRICE_ID          — recurring price for Basic (CHF 29/mo)
//   STRIPE_PROFESSIONAL_PRICE_ID   — recurring price for Professional (CHF 59/mo)
//   STRIPE_PREMIUM_PRICE_ID        — recurring price for Premium (CHF 99/mo)
//   STRIPE_TEST_PRICE_ID           — one-time price for the CHF 1 live test payment
//   STRIPE_WEBHOOK_SECRET          — signing secret for /api/stripe/webhook

const REQUIRED_STRIPE_ENV = [
  "STRIPE_SECRET_KEY",
  "VITE_STRIPE_PUBLISHABLE_KEY",
  "STRIPE_BASIC_PRICE_ID",
  "STRIPE_PROFESSIONAL_PRICE_ID",
  "STRIPE_PREMIUM_PRICE_ID",
  "STRIPE_TEST_PRICE_ID",
  "STRIPE_WEBHOOK_SECRET",
] as const;

/** Returns the list of missing required Stripe env vars and logs an error for each. */
export function checkStripeEnv(): string[] {
  const missing = REQUIRED_STRIPE_ENV.filter((k) => !process.env[k]);
  if (missing.length > 0) {
    logger.error(
      { missing },
      "Stripe is misconfigured — the following required environment variables are missing. " +
        "Stripe checkout, the test payment, and webhooks will fail until they are set in Replit Secrets.",
    );
  } else {
    logger.info("Stripe live environment variables detected");
  }
  return missing;
}

let _client: Stripe | null = null;

/** Returns a cached live Stripe client built from STRIPE_SECRET_KEY. */
export function getStripeClient(): Stripe {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error("STRIPE_SECRET_KEY is not set. Add it in Replit Secrets to enable payments.");
  }
  if (!_client) {
    _client = new Stripe(secretKey, { apiVersion: "2025-11-17.clover" as const });
  }
  return _client;
}

/** Backwards-compatible async accessor used across the codebase. */
export async function getUncachableStripeClient(): Promise<Stripe> {
  return getStripeClient();
}

/** Publishable key for the frontend (safe to expose). */
export function getStripePublishableKey(): string {
  const key = process.env.VITE_STRIPE_PUBLISHABLE_KEY;
  if (!key) throw new Error("VITE_STRIPE_PUBLISHABLE_KEY is not set");
  return key;
}

export function getWebhookSecret(): string {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) throw new Error("STRIPE_WEBHOOK_SECRET is not set");
  return secret;
}

export function getTestPriceId(): string {
  const id = process.env.STRIPE_TEST_PRICE_ID;
  if (!id) throw new Error("STRIPE_TEST_PRICE_ID is not set");
  return id;
}

/** Maps an internal plan slug to its configured live Stripe price ID. */
export function priceIdForSlug(slug: string): string | undefined {
  switch (slug) {
    case "basic":
      return process.env.STRIPE_BASIC_PRICE_ID;
    case "pro":
      return process.env.STRIPE_PROFESSIONAL_PRICE_ID;
    case "premium":
      return process.env.STRIPE_PREMIUM_PRICE_ID;
    default:
      return undefined;
  }
}

/** Reverse lookup: maps a live Stripe price ID back to an internal plan slug. */
export function slugForPriceId(priceId: string): string | undefined {
  if (priceId && priceId === process.env.STRIPE_BASIC_PRICE_ID) return "basic";
  if (priceId && priceId === process.env.STRIPE_PROFESSIONAL_PRICE_ID) return "pro";
  if (priceId && priceId === process.env.STRIPE_PREMIUM_PRICE_ID) return "premium";
  return undefined;
}
