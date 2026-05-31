export interface SubscriptionPlan {
  id: number;
  slug: string;
  name: string;
  priceCents: number;
  yearlyPriceCents: number;
  monthlyCredits: number;
  featured: boolean;
  features: string[];
  sortOrder: number;
  badge: string | null;
  visibilityRank: number;
  contactVisible: boolean;
  stripePriceMonthly: string | null;
  stripePriceYearly: string | null;
}

export interface ImmocreditPack {
  id: number;
  slug: string;
  name: string;
  priceCents: number;
  credits: number;
  sortOrder: number;
}

export interface CreditBalance {
  monthly: number;
  purchased: number;
  total: number;
  usedThisMonth: number;
}

export interface ImmoTransaction {
  id: number;
  userId: number;
  type: string;
  bucket: string;
  amount: number;
  balanceAfterMonthly: number;
  balanceAfterPurchased: number;
  note: string | null;
  createdAt: string;
}

export interface ProviderOffer {
  id: number;
  projectId: number;
  type: "normal" | "highlighted" | "top";
  creditsSpent: number;
  message: string;
  priceEstimate: string | null;
  status: string;
  createdAt: string;
  projectFullName: string | null;
  projectCity: string | null;
  projectType: string | null;
  projectSize: string | null;
}

export interface ProviderProject {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  title: string | null;
  projectType: string;
  subcategory: string | null;
  subcategoryOtherText: string | null;
  description: string;
  city: string;
  address: string | null;
  budget: string | null;
  timeline: string | null;
  size: string;
  status: string;
  createdAt: string;
  ownerUserId: number | null;
  photos: string[];
  files: string[];
}

export interface OfferWithProvider {
  id: number;
  projectId: number;
  providerUserId: number;
  type: string;
  creditsSpent: number;
  message: string;
  priceEstimate: string | null;
  status: string;
  createdAt: string;
  providerName: string | null;
  providerCompany: string | null;
  providerCity: string | null;
}

export interface PaymentRow {
  id: number;
  userId: number;
  kind: string;
  refSlug: string;
  amountCents: number;
  currency: string;
  status: string;
  createdAt: string;
}

export interface InvoiceRow {
  id: number;
  paymentId: number;
  number: string;
  issuedAt: string;
}

export interface AppStats {
  planSlug: string;
  planName: string;
  priceCents: number;
  appLimit: number;
  usedThisMonth: number;
  contactVisible: boolean;
  badge: string;
  periodStart: string;
  periodEnd: string | null;
  features: string[];
}

async function jsonFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    ...init,
  });
  if (!res.ok) {
    let msg = `Request failed (${res.status})`;
    try {
      const data = (await res.json()) as { error?: string };
      if (data.error) msg = data.error;
    } catch {
      // ignore
    }
    throw new Error(msg);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const billingApi = {
  plans: () => jsonFetch<SubscriptionPlan[]>("/plans"),
  packs: () => jsonFetch<ImmocreditPack[]>("/packs"),
  balance: () => jsonFetch<CreditBalance>("/provider/balance"),
  providerMe: () =>
    jsonFetch<{ subscription: { id: number; planId: number; status: string; currentPeriodStart: string; currentPeriodEnd: string } | null; plan: SubscriptionPlan | null }>(
      "/provider/me",
    ),
  appStats: () => jsonFetch<AppStats>("/provider/app-stats"),
  transactions: () => jsonFetch<ImmoTransaction[]>("/provider/transactions"),
  payments: () => jsonFetch<PaymentRow[]>("/billing/payments"),
  invoices: () => jsonFetch<InvoiceRow[]>("/billing/invoices"),
  subscribe: (planId: number) =>
    jsonFetch<{ subscription: unknown; plan: SubscriptionPlan; payment: unknown }>("/billing/subscribe", {
      method: "POST",
      body: JSON.stringify({ planId }),
    }),
  stripeCheckout: (planId: number, interval: "month" | "year") =>
    jsonFetch<{ url: string }>("/stripe/checkout", {
      method: "POST",
      body: JSON.stringify({ planId, interval }),
    }),
  stripePortal: () =>
    jsonFetch<{ url: string }>("/stripe/portal", { method: "POST" }),
  stripeSync: () =>
    jsonFetch<{ synced: boolean; plan?: string; reason?: string }>("/stripe/subscription/sync"),
  buyPack: (packId: number) =>
    jsonFetch<{ pack: ImmocreditPack; payment: unknown; creditsAdded: number }>("/billing/buy-pack", {
      method: "POST",
      body: JSON.stringify({ packId }),
    }),
  cancel: () => jsonFetch<{ ok: boolean }>("/billing/cancel", { method: "POST" }),
  providerProjects: () => jsonFetch<ProviderProject[]>("/provider/projects"),
  providerOffers: () => jsonFetch<ProviderOffer[]>("/provider/offers"),
  myProjects: () => jsonFetch<ProviderProject[]>("/me/projects"),
  projectOffers: (projectId: number) =>
    jsonFetch<OfferWithProvider[]>(`/projects/${projectId}/offers`),
  sendOffer: (
    projectId: number,
    body: { type: "normal" | "highlighted" | "top"; message: string; priceEstimate?: string },
  ) =>
    jsonFetch<{ offer: { id: number }; cost: number; balanceAfter: CreditBalance }>(
      `/projects/${projectId}/offers`,
      { method: "POST", body: JSON.stringify(body) },
    ),
  acceptOffer: (offerId: number) =>
    jsonFetch<{ ok: boolean }>(`/offers/${offerId}/accept`, { method: "POST" }),
};

export function offerCostFor(size: string | null | undefined, type: "normal" | "highlighted" | "top"): number {
  const sizeCosts: Record<string, number> = { small: 2, medium: 5, large: 10, premium: 20 };
  const surcharge: Record<string, number> = { normal: 0, highlighted: 3, top: 7 };
  return (sizeCosts[size ?? "medium"] ?? 5) + (surcharge[type] ?? 0);
}
