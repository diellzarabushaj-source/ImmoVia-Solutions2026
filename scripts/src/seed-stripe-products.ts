/**
 * Seed ImmoVia365 subscription plans in Stripe and store price IDs in DB.
 *
 * Run: pnpm --filter @workspace/scripts exec tsx src/seed-stripe-products.ts
 *
 * Requires:
 *   REPLIT_CONNECTORS_HOSTNAME  (set automatically in Replit)
 *   REPL_IDENTITY or WEB_REPL_RENEWAL  (set automatically in Replit)
 *   DATABASE_URL
 */
import Stripe from "stripe";
import { Pool } from "pg";

async function getStripeSecretKey(): Promise<string> {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY
    ? "repl " + process.env.REPL_IDENTITY
    : process.env.WEB_REPL_RENEWAL
      ? "depl " + process.env.WEB_REPL_RENEWAL
      : null;

  if (!hostname || !xReplitToken) {
    throw new Error(
      "Missing REPLIT_CONNECTORS_HOSTNAME or identity token. Run inside Replit.",
    );
  }

  const isProduction = process.env.REPLIT_DEPLOYMENT === "1";
  const targetEnvironment = isProduction ? "production" : "development";

  const url = new URL(`https://${hostname}/api/v2/connection`);
  url.searchParams.set("include_secrets", "true");
  url.searchParams.set("connector_names", "stripe");
  url.searchParams.set("environment", targetEnvironment);

  const response = await fetch(url.toString(), {
    headers: { Accept: "application/json", "X-Replit-Token": xReplitToken },
    signal: AbortSignal.timeout(10_000),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch Stripe credentials: ${response.status}`);
  }

  const data = (await response.json()) as {
    items?: Array<{ settings?: { secret?: string } }>;
  };
  const secret = data.items?.[0]?.settings?.secret;
  if (!secret) throw new Error("Stripe secret key not found in connector settings");
  return secret;
}

const PLANS = [
  {
    slug: "basic",
    name: "Basic Provider",
    monthlyChf: 2900,
    yearlyChf: 27900,
    description: "10 Project Credits/month · Standard visibility · Basic Provider badge",
  },
  {
    slug: "pro",
    name: "Pro Provider",
    monthlyChf: 7900,
    yearlyChf: 75900,
    description: "35 Project Credits/month · Better visibility · Appears above Basic",
  },
  {
    slug: "premium",
    name: "Premium Partner",
    monthlyChf: 14900,
    yearlyChf: 143000,
    description: "Unlimited Credits · Top placement · Access to unregistered leads",
  },
];

async function main() {
  const secretKey = await getStripeSecretKey();
  const stripe = new Stripe(secretKey, { apiVersion: "2025-11-17.clover" as const });
  console.log("Connected to Stripe");

  const db = new Pool({ connectionString: process.env.DATABASE_URL });

  for (const plan of PLANS) {
    console.log(`\nProcessing plan: ${plan.name}`);

    // Find or create product
    const existing = await stripe.products.search({
      query: `metadata['immoviaPlan']:'${plan.slug}'`,
    });

    let product = existing.data[0];
    if (!product) {
      product = await stripe.products.create({
        name: plan.name,
        description: plan.description,
        metadata: { immoviaPlan: plan.slug },
      });
      console.log(`  Created product: ${product.id}`);
    } else {
      console.log(`  Found existing product: ${product.id}`);
    }

    // List existing prices for this product
    const existingPrices = await stripe.prices.list({ product: product.id, active: true });

    // Monthly price
    const existingMonthly = existingPrices.data.find(
      (p) => p.recurring?.interval === "month" && p.unit_amount === plan.monthlyChf,
    );
    let monthlyPriceId: string;
    if (existingMonthly) {
      monthlyPriceId = existingMonthly.id;
      console.log(`  Found monthly price: ${monthlyPriceId}`);
    } else {
      const mp = await stripe.prices.create({
        product: product.id,
        unit_amount: plan.monthlyChf,
        currency: "chf",
        recurring: { interval: "month" },
        metadata: { immoviaPlan: plan.slug, interval: "month" },
      });
      monthlyPriceId = mp.id;
      console.log(`  Created monthly price: ${monthlyPriceId}`);
    }

    // Yearly price
    const existingYearly = existingPrices.data.find(
      (p) => p.recurring?.interval === "year" && p.unit_amount === plan.yearlyChf,
    );
    let yearlyPriceId: string;
    if (existingYearly) {
      yearlyPriceId = existingYearly.id;
      console.log(`  Found yearly price: ${yearlyPriceId}`);
    } else {
      const yp = await stripe.prices.create({
        product: product.id,
        unit_amount: plan.yearlyChf,
        currency: "chf",
        recurring: { interval: "year" },
        metadata: { immoviaPlan: plan.slug, interval: "year" },
      });
      yearlyPriceId = yp.id;
      console.log(`  Created yearly price: ${yearlyPriceId}`);
    }

    await db.query(
      `UPDATE subscription_plans SET stripe_price_monthly = $1, stripe_price_yearly = $2 WHERE slug = $3`,
      [monthlyPriceId, yearlyPriceId, plan.slug],
    );
    console.log(`  DB updated for slug=${plan.slug}`);
  }

  await db.end();
  console.log("\nDone! Stripe products seeded and DB updated.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
