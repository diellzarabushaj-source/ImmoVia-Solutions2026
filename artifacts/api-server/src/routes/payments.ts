import { Router, type IRouter } from "express";

const router: IRouter = Router();

const unavailable = {
  error: "Online payments are temporarily unavailable while a Kosovo bank integration is being prepared.",
  code: "PAYMENTS_DISABLED",
};

router.get("/payments/status", (_req, res): void => {
  res.json({ enabled: false, provider: null, replacement: "kosovo_bank" });
});

router.post("/payments/checkout", (_req, res): void => {
  res.status(503).json(unavailable);
});

router.post("/payments/portal", (_req, res): void => {
  res.status(503).json(unavailable);
});

router.get("/payments/subscription/sync", (_req, res): void => {
  res.json({ synced: false, reason: "payments_disabled" });
});

router.get("/billing/provider-invoices", (_req, res): void => {
  res.json([]);
});

export default router;
