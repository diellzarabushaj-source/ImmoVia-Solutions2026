export interface PaymentResult {
  providerRef: string;
  status: "succeeded" | "failed" | "pending";
}

export interface SubscriptionResult extends PaymentResult {
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
}

export interface PaymentProvider {
  createCheckoutSession?(args: {
    userId: number;
    priceId: string;
    successUrl: string;
    cancelUrl: string;
    interval: "month" | "year";
  }): Promise<string>;

  createPortalSession?(args: {
    userId: number;
    returnUrl: string;
  }): Promise<string>;

  createSubscription(args: {
    userId: number;
    planSlug: string;
    priceCents: number;
  }): Promise<SubscriptionResult>;

  cancelSubscription(args: { providerRef: string }): Promise<void>;

  chargeOnce(args: {
    userId: number;
    packSlug: string;
    priceCents: number;
  }): Promise<PaymentResult>;
}

// TODO(stripe): Replace MockPaymentProvider with a real StripePaymentProvider
// implementation. Read STRIPE_SECRET_KEY/STRIPE_WEBHOOK_SECRET from env.
export class MockPaymentProvider implements PaymentProvider {
  async createSubscription(args: {
    userId: number;
    planSlug: string;
    priceCents: number;
  }): Promise<SubscriptionResult> {
    const now = new Date();
    const end = new Date(now);
    end.setMonth(end.getMonth() + 1);
    return {
      providerRef: `mock_sub_${args.userId}_${args.planSlug}_${now.getTime()}`,
      status: "succeeded",
      currentPeriodStart: now,
      currentPeriodEnd: end,
    };
  }

  async cancelSubscription(_args: { providerRef: string }): Promise<void> {
    // no-op in mock
  }

  async chargeOnce(args: {
    userId: number;
    packSlug: string;
    priceCents: number;
  }): Promise<PaymentResult> {
    return {
      providerRef: `mock_pay_${args.userId}_${args.packSlug}_${Date.now()}`,
      status: "succeeded",
    };
  }
}

export const paymentProvider: PaymentProvider = new MockPaymentProvider();
