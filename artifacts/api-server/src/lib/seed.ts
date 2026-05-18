import { db, subscriptionPlansTable, immocreditPacksTable } from "@workspace/db";
import { logger } from "./logger";

const PLANS = [
  {
    slug: "free",
    name: "Free",
    priceCents: 0,
    monthlyCredits: 3,
    featured: false,
    features: ["3 ImmoCredits / month", "Basic profile listing", "Community support"],
    sortOrder: 1,
  },
  {
    slug: "starter",
    name: "Starter",
    priceCents: 1900,
    monthlyCredits: 20,
    featured: false,
    features: [
      "20 ImmoCredits / month",
      "Standard profile listing",
      "Email support",
      "Offer history",
    ],
    sortOrder: 2,
  },
  {
    slug: "pro",
    name: "Pro",
    priceCents: 4900,
    monthlyCredits: 70,
    featured: true,
    features: [
      "70 ImmoCredits / month",
      "Featured profile placement",
      "Priority support",
      "Advanced offer analytics",
      "Boosted offer discounts",
    ],
    sortOrder: 3,
  },
  {
    slug: "business",
    name: "Business",
    priceCents: 9900,
    monthlyCredits: 180,
    featured: false,
    features: [
      "180 ImmoCredits / month",
      "Top placement on homepage",
      "Dedicated account manager",
      "Multi-team support (coming soon)",
      "Custom branding",
    ],
    sortOrder: 4,
  },
  {
    slug: "premium",
    name: "Premium Partner",
    priceCents: 19900,
    monthlyCredits: 450,
    featured: false,
    features: [
      "450 ImmoCredits / month",
      "Premier homepage placement",
      "White-glove onboarding",
      "Custom reporting",
      "Beta access to new features",
    ],
    sortOrder: 5,
  },
];

const PACKS = [
  { slug: "mini", name: "Mini Pack", priceCents: 1200, credits: 10, sortOrder: 1 },
  { slug: "starter", name: "Starter Pack", priceCents: 2500, credits: 25, sortOrder: 2 },
  { slug: "growth", name: "Growth Pack", priceCents: 5500, credits: 60, sortOrder: 3 },
  { slug: "business", name: "Business Pack", priceCents: 12900, credits: 150, sortOrder: 4 },
  { slug: "pro", name: "Pro Pack", priceCents: 22900, credits: 300, sortOrder: 5 },
];

export async function seedBilling(): Promise<void> {
  try {
    for (const p of PLANS) {
      await db
        .insert(subscriptionPlansTable)
        .values(p)
        .onConflictDoUpdate({
          target: subscriptionPlansTable.slug,
          set: {
            name: p.name,
            priceCents: p.priceCents,
            monthlyCredits: p.monthlyCredits,
            featured: p.featured,
            features: p.features,
            sortOrder: p.sortOrder,
          },
        });
    }
    for (const p of PACKS) {
      await db
        .insert(immocreditPacksTable)
        .values(p)
        .onConflictDoUpdate({
          target: immocreditPacksTable.slug,
          set: {
            name: p.name,
            priceCents: p.priceCents,
            credits: p.credits,
            sortOrder: p.sortOrder,
          },
        });
    }
    logger.info("Billing seed complete");
  } catch (err) {
    logger.error({ err }, "Billing seed failed");
  }
}
