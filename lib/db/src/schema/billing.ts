import {
  pgTable,
  text,
  serial,
  integer,
  timestamp,
  boolean,
  jsonb,
} from "drizzle-orm/pg-core";

export const subscriptionPlansTable = pgTable("subscription_plans", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(), // free | basic | pro | premium
  name: text("name").notNull(),
  priceCents: integer("price_cents").notNull().default(0),
  yearlyPriceCents: integer("yearly_price_cents").notNull().default(0),
  monthlyCredits: integer("monthly_credits").notNull().default(0), // -1 = unlimited
  featured: boolean("featured").notNull().default(false),
  features: jsonb("features").$type<string[]>().notNull().default([]),
  sortOrder: integer("sort_order").notNull().default(0),
  // Stripe price IDs — set after running seed-stripe-products script
  stripePriceMonthly: text("stripe_price_monthly"),
  stripePriceYearly: text("stripe_price_yearly"),
  // Badge label for this plan
  badge: text("badge"),
  // Visibility rank (higher = shown first in listings)
  visibilityRank: integer("visibility_rank").notNull().default(0),
  // Whether this plan allows access to contact details
  contactVisible: boolean("contact_visible").notNull().default(false),
});

export const immocreditPacksTable = pgTable("immocredit_packs", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(), // mini | starter | growth | business | pro
  name: text("name").notNull(),
  priceCents: integer("price_cents").notNull(),
  credits: integer("credits").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const subscriptionsTable = pgTable("subscriptions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  planId: integer("plan_id").notNull(),
  status: text("status").notNull().default("active"), // active | canceled | past_due
  currentPeriodStart: timestamp("current_period_start", { withTimezone: true }).notNull(),
  currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }).notNull(),
  providerRef: text("provider_ref"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const paymentsTable = pgTable("payments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  kind: text("kind").notNull(), // subscription | pack
  refSlug: text("ref_slug").notNull(),
  amountCents: integer("amount_cents").notNull(),
  currency: text("currency").notNull().default("EUR"),
  providerRef: text("provider_ref"),
  status: text("status").notNull().default("succeeded"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const invoicesTable = pgTable("invoices", {
  id: serial("id").primaryKey(),
  paymentId: integer("payment_id").notNull(),
  number: text("number").notNull(),
  issuedAt: timestamp("issued_at", { withTimezone: true }).notNull().defaultNow(),
});

export const immocreditTransactionsTable = pgTable("immocredit_transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  // grant | purchase | spend | refund | adjustment | expire
  type: text("type").notNull(),
  // monthly | purchased  (which bucket was affected)
  bucket: text("bucket").notNull(),
  amount: integer("amount").notNull(), // signed, positive for credits in, negative for out
  balanceAfterMonthly: integer("balance_after_monthly").notNull(),
  balanceAfterPurchased: integer("balance_after_purchased").notNull(),
  relatedOfferId: integer("related_offer_id"),
  relatedProjectId: integer("related_project_id"),
  relatedPaymentId: integer("related_payment_id"),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  note: text("note"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const offersTable = pgTable("offers", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull(),
  providerUserId: integer("provider_user_id").notNull(),
  // normal | highlighted | top
  type: text("type").notNull().default("normal"),
  creditsSpent: integer("credits_spent").notNull(),
  message: text("message").notNull(),
  priceEstimate: text("price_estimate"),
  status: text("status").notNull().default("sent"), // sent | accepted | rejected | refunded
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type SubscriptionPlan = typeof subscriptionPlansTable.$inferSelect;
export type ImmocreditPack = typeof immocreditPacksTable.$inferSelect;
export type Subscription = typeof subscriptionsTable.$inferSelect;
export type Payment = typeof paymentsTable.$inferSelect;
export type Invoice = typeof invoicesTable.$inferSelect;
export type ImmocreditTransaction = typeof immocreditTransactionsTable.$inferSelect;
export type Offer = typeof offersTable.$inferSelect;
