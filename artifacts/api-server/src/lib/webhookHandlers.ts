import type Stripe from "stripe";
import { getStripeClient, getWebhookSecret } from "./stripeClient";
import {
  activateSubscription,
  markSubscriptionCanceled,
  markSubscriptionPastDue,
  recordInvoice,
} from "./stripeActivation";
import { logger } from "./logger";
import { db, companiesTable, usersTable, subscriptionsTable, subscriptionPlansTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { sendSubscriptionPaymentSuccessEmail, sendSubscriptionPaymentFailedEmail } from "./email";

export class WebhookHandlers {
  static async processWebhook(payload: Buffer, signature: string): Promise<void> {
    if (!Buffer.isBuffer(payload)) {
      throw new Error(
        "STRIPE WEBHOOK: payload must be a Buffer. " +
          "Ensure the webhook route is registered BEFORE express.json().",
      );
    }

    const stripe = getStripeClient();
    // Verifies the signature using STRIPE_WEBHOOK_SECRET — throws on tampering.
    const event = stripe.webhooks.constructEvent(payload, signature, getWebhookSecret());

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode === "subscription" && session.subscription) {
          const subId =
            typeof session.subscription === "string"
              ? session.subscription
              : session.subscription.id;
          const sub = await stripe.subscriptions.retrieve(subId);
          await activateSubscription(sub);
        } else if (session.mode === "payment" && session.payment_status === "paid") {
          const companyId = session.metadata?.companyId;
          if (companyId) {
            await db
              .update(companiesTable)
              .set({ registrationFeePaid: true, stripeRegistrationSessionId: session.id })
              .where(eq(companiesTable.id, parseInt(companyId, 10)));
            logger.info({ companyId }, "Registration fee paid via webhook");
          }
        }
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        await activateSubscription(sub);
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        await markSubscriptionCanceled(sub.id);
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        await recordInvoice(invoice, "succeeded");
        // Send payment confirmation email (fire-and-forget)
        void (async () => {
          try {
            const customerId = typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id;
            if (!customerId) return;
            const [user] = await db
              .select({ id: usersTable.id, email: usersTable.email, fullName: usersTable.fullName, language: usersTable.language })
              .from(usersTable)
              .where(eq(usersTable.stripeCustomerId, customerId))
              .limit(1);
            if (!user?.email) return;
            const [sub] = await db
              .select({ planName: subscriptionPlansTable.name })
              .from(subscriptionsTable)
              .innerJoin(subscriptionPlansTable, eq(subscriptionsTable.planId, subscriptionPlansTable.id))
              .where(eq(subscriptionsTable.userId, user.id))
              .limit(1);
            await sendSubscriptionPaymentSuccessEmail({
              recipientEmail: user.email,
              recipientName: user.fullName,
              planName: sub?.planName ?? "Subscription",
              amountCents: invoice.amount_paid || invoice.amount_due || 0,
              currency: invoice.currency ?? "CHF",
              language: user.language,
            });
          } catch (err) {
            logger.error({ err }, "Failed to send payment success email");
          }
        })();
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        await recordInvoice(invoice, "failed");
        await markSubscriptionPastDue(invoice.customer);
        // Send payment failed warning email (fire-and-forget)
        void (async () => {
          try {
            const customerId = typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id;
            if (!customerId) return;
            const [user] = await db
              .select({ id: usersTable.id, email: usersTable.email, fullName: usersTable.fullName, language: usersTable.language })
              .from(usersTable)
              .where(eq(usersTable.stripeCustomerId, customerId))
              .limit(1);
            if (!user?.email) return;
            const [sub] = await db
              .select({ planName: subscriptionPlansTable.name })
              .from(subscriptionsTable)
              .innerJoin(subscriptionPlansTable, eq(subscriptionsTable.planId, subscriptionPlansTable.id))
              .where(eq(subscriptionsTable.userId, user.id))
              .limit(1);
            await sendSubscriptionPaymentFailedEmail({
              recipientEmail: user.email,
              recipientName: user.fullName,
              planName: sub?.planName ?? "Subscription",
              language: user.language,
            });
          } catch (err) {
            logger.error({ err }, "Failed to send payment failed email");
          }
        })();
        break;
      }

      default:
        logger.info({ type: event.type }, "Unhandled Stripe webhook event");
    }
  }
}
