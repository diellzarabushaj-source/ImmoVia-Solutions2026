import type Stripe from "stripe";
import { getStripeClient, getWebhookSecret } from "./stripeClient";
import {
  activateSubscription,
  markSubscriptionCanceled,
  markSubscriptionPastDue,
  recordTestPayment,
  recordInvoice,
} from "./stripeActivation";
import { logger } from "./logger";

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
        if (session.mode === "payment") {
          // CHF 1 one-time live test payment — record, never upgrade the plan.
          await recordTestPayment(session);
        } else if (session.mode === "subscription" && session.subscription) {
          const subId =
            typeof session.subscription === "string"
              ? session.subscription
              : session.subscription.id;
          const sub = await stripe.subscriptions.retrieve(subId);
          await activateSubscription(sub);
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
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        await recordInvoice(invoice, "failed");
        await markSubscriptionPastDue(invoice.customer);
        break;
      }

      default:
        logger.info({ type: event.type }, "Unhandled Stripe webhook event");
    }
  }
}
