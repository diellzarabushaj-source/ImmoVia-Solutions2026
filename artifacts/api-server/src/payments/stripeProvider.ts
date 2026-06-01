import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { getUncachableStripeClient } from "../lib/stripeClient";
import type { PaymentProvider, PaymentResult, SubscriptionResult } from "./index";

export class StripePaymentProvider implements PaymentProvider {
  private async getOrCreateCustomer(userId: number): Promise<string> {
    const stripe = await getUncachableStripeClient();

    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
    if (!user) throw new Error(`User ${userId} not found`);

    if (user.stripeCustomerId) return user.stripeCustomerId;

    const customer = await stripe.customers.create({
      email: user.email,
      name: user.fullName,
      metadata: { userId: String(userId) },
    });

    await db
      .update(usersTable)
      .set({ stripeCustomerId: customer.id })
      .where(eq(usersTable.id, userId));

    return customer.id;
  }

  async createCheckoutSession(args: {
    userId: number;
    priceId: string;
    successUrl: string;
    cancelUrl: string;
    interval: "month" | "year";
  }): Promise<string> {
    const stripe = await getUncachableStripeClient();
    const customerId = await this.getOrCreateCustomer(args.userId);

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      line_items: [{ price: args.priceId, quantity: 1 }],
      mode: "subscription",
      success_url: args.successUrl,
      cancel_url: args.cancelUrl,
      allow_promotion_codes: true,
      metadata: { userId: String(args.userId) },
      // Propagate userId onto the subscription so webhook events can resolve the user.
      subscription_data: { metadata: { userId: String(args.userId) } },
    });

    if (!session.url) throw new Error("Stripe did not return a checkout URL");
    return session.url;
  }

  async createPortalSession(args: {
    userId: number;
    returnUrl: string;
  }): Promise<string> {
    const stripe = await getUncachableStripeClient();
    const customerId = await this.getOrCreateCustomer(args.userId);

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: args.returnUrl,
    });

    return session.url;
  }

  async createSubscription(args: {
    userId: number;
    planSlug: string;
    priceCents: number;
  }): Promise<SubscriptionResult> {
    const now = new Date();
    const end = new Date(now);
    end.setMonth(end.getMonth() + 1);
    return {
      providerRef: `stripe_pending_${args.userId}_${args.planSlug}`,
      status: "pending",
      currentPeriodStart: now,
      currentPeriodEnd: end,
    };
  }

  async cancelSubscription(args: { providerRef: string }): Promise<void> {
    if (!args.providerRef.startsWith("sub_")) return;
    const stripe = await getUncachableStripeClient();
    await stripe.subscriptions.cancel(args.providerRef);
  }

  async chargeOnce(args: {
    userId: number;
    packSlug: string;
    priceCents: number;
  }): Promise<PaymentResult> {
    return {
      providerRef: `stripe_pending_${args.userId}_${args.packSlug}`,
      status: "pending",
    };
  }
}

export const stripePaymentProvider = new StripePaymentProvider();
