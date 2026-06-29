export interface SubscriptionPlan {
  id: number;
  slug: string;
  name: string;
  priceCents: number;
  yearlyPriceCents: number;
  featured: boolean;
  features: string[];
  sortOrder: number;
  badge: string | null;
  visibilityRank: number;
  contactVisible: boolean;
  stripePriceMonthly: string | null;
  stripePriceYearly: string | null;
}

export interface ProviderOffer {
  id: number;
  projectId: number;
  type: "normal" | "highlighted" | "top";
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
  kind?: string;
  amountCents?: number;
  status?: string;
  receiptUrl?: string | null;
  invoicePdfUrl?: string | null;
  invoiceHostedUrl?: string | null;
}

export interface UnlockedContact {
  id: number;
  projectId: number;
  unlockedAt: string;
  projectType: string;
  city: string;
  fullName: string;
  phone: string;
  email: string;
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
  contactUnlocksUsed: number;
  contactUnlocksLimit: number;
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

export interface UnlockedByEntry {
  isRevealed: boolean;
  name: string | null;
  planSlug: string;
  unlockedAt: string;
}

export interface UnlockedByResponse {
  total: number;
  providers: UnlockedByEntry[];
}

export const billingApi = {
  plans: () => jsonFetch<SubscriptionPlan[]>("/plans"),
  providerMe: () =>
    jsonFetch<{ subscription: { id: number; planId: number; status: string; currentPeriodStart: string; currentPeriodEnd: string } | null; plan: SubscriptionPlan | null }>(
      "/provider/me",
    ),
  appStats: () => jsonFetch<AppStats>("/provider/app-stats"),
  payments: () => jsonFetch<PaymentRow[]>("/billing/payments"),
  invoices: () => jsonFetch<InvoiceRow[]>("/billing/invoices"),
  stripeCheckout: (planId: number) =>
    jsonFetch<{ url: string }>("/stripe/checkout", {
      method: "POST",
      body: JSON.stringify({ planId }),
    }),
  stripePortal: () =>
    jsonFetch<{ url: string }>("/stripe/portal", { method: "POST" }),
  stripeSync: (sessionId?: string) =>
    jsonFetch<{ synced: boolean; plan?: string; reason?: string }>(
      sessionId
        ? `/stripe/subscription/sync?session_id=${encodeURIComponent(sessionId)}`
        : "/stripe/subscription/sync",
    ),
  cancel: () => jsonFetch<{ ok: boolean }>("/billing/cancel", { method: "POST" }),
  unlockedContacts: (page = 1) =>
    jsonFetch<{ items: UnlockedContact[]; total: number; page: number; limit: number }>(
      `/billing/unlocked-contacts?page=${page}`,
    ),
  providerProjects: () => jsonFetch<ProviderProject[]>("/provider/projects"),
  providerOffers: () => jsonFetch<ProviderOffer[]>("/provider/offers"),
  myProjects: () => jsonFetch<ProviderProject[]>("/me/projects"),
  projectOffers: (projectId: number) =>
    jsonFetch<OfferWithProvider[]>(`/projects/${projectId}/offers`),
  sendOffer: (
    projectId: number,
    body: { type: "normal" | "highlighted" | "top"; message: string; priceEstimate?: string },
  ) =>
    jsonFetch<{ offer: { id: number } }>(
      `/projects/${projectId}/offers`,
      { method: "POST", body: JSON.stringify(body) },
    ),
  acceptOffer: (offerId: number) =>
    jsonFetch<{ ok: boolean }>(`/offers/${offerId}/accept`, { method: "POST" }),
  unlockProjectContact: (projectId: number) =>
    jsonFetch<{ phone: string; email: string; fullName: string }>(
      `/projects/${projectId}/unlock`,
      { method: "POST" },
    ),
  unlockedBy: (projectId: number) =>
    jsonFetch<UnlockedByResponse>(`/projects/${projectId}/unlocked-by`),
};
