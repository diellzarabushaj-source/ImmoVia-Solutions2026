import { Router, type IRouter } from "express";

const router: IRouter = Router();

const bankPending = {
  enabled: false,
  provider: null,
  replacement: "kosovo_bank",
  status: "pending_integration",
};

const dashboardUrl = "/provider?tab=plan";

// Generic payment status used while the Kosovo bank integration is prepared.
router.get("/payments/status", (_req, res): void => {
  res.json(bankPending);
});

// New generic endpoints. They intentionally do not charge anything.
router.post("/payments/checkout", (_req, res): void => {
  res.json({ url: dashboardUrl, ...bankPending });
});

router.post("/payments/portal", (_req, res): void => {
  res.json({ url: dashboardUrl, ...bankPending });
});

router.get("/payments/subscription/sync", (_req, res): void => {
  res.json({ synced: false, reason: "bank_integration_pending" });
});

router.get("/billing/provider-invoices", (_req, res): void => {
  res.json([]);
});

// Temporary compatibility aliases for old frontend routes. There is no Stripe
// client, webhook, key, product, price, or external payment call behind these.
router.get("/stripe/config", (_req, res): void => {
  res.json({ publishableKey: null, ...bankPending });
});

router.post("/stripe/checkout", (_req, res): void => {
  res.json({ url: dashboardUrl, ...bankPending });
});

router.post("/stripe/portal", (_req, res): void => {
  res.json({ url: dashboardUrl, ...bankPending });
});

router.get("/stripe/subscription/sync", (_req, res): void => {
  res.json({ synced: false, reason: "bank_integration_pending" });
});

router.get("/billing/stripe-invoices", (_req, res): void => {
  res.json([]);
});

// Compatibility for registration/onboarding pages. These routes let profile
// creation finish without displaying an error or performing a payment.
router.post("/companies/:id/registration-checkout", (_req, res): void => {
  res.json({ url: "/provider", ...bankPending });
});

router.post("/companies/:id/registration-payment/verify", (_req, res): void => {
  res.json({ paid: true, reason: "bank_integration_pending" });
});

router.post("/companies/:id/package-checkout", (_req, res): void => {
  res.json({ url: "/provider", ...bankPending });
});

router.post("/companies/:id/package-payment/verify", (_req, res): void => {
  res.json({ paid: true, reason: "bank_integration_pending" });
});

export default router;
