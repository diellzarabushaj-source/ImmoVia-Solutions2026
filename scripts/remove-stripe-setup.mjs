import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

function file(rel) {
  return path.join(root, rel);
}

function read(rel) {
  return fs.readFileSync(file(rel), "utf8");
}

function write(rel, content) {
  fs.writeFileSync(file(rel), content.endsWith("\n") ? content : `${content}\n`);
}

function replaceExact(rel, before, after, label = before.slice(0, 80)) {
  const current = read(rel);
  if (!current.includes(before)) {
    throw new Error(`Missing exact pattern in ${rel}: ${label}`);
  }
  write(rel, current.replace(before, after));
}

function replaceRegex(rel, regex, after, label) {
  const current = read(rel);
  if (!regex.test(current)) {
    throw new Error(`Missing regex pattern in ${rel}: ${label}`);
  }
  regex.lastIndex = 0;
  write(rel, current.replace(regex, after));
}

function removeFile(rel) {
  const target = file(rel);
  if (fs.existsSync(target)) fs.rmSync(target);
}

// 1) Remove the live Stripe webhook from the Express application.
replaceRegex(
  "artifacts/api-server/src/app.ts",
  /\n\/\/ ── Stripe webhook[\s\S]*?\napp\.use\(cors/,
  "\napp.use(cors",
  "Stripe webhook block",
);

// 2) Replace the Stripe router with a provider-neutral disabled payments router.
replaceExact(
  "artifacts/api-server/src/routes/index.ts",
  'import stripeRouter from "./stripe";',
  'import paymentsRouter from "./payments";',
  "Stripe router import",
);
replaceExact(
  "artifacts/api-server/src/routes/index.ts",
  "router.use(stripeRouter);",
  "router.use(paymentsRouter);",
  "Stripe router mount",
);

write(
  "artifacts/api-server/src/routes/payments.ts",
  `import { Router, type IRouter } from "express";

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
`,
);

// 3) Disconnect company checkout/verification endpoints from Stripe.
replaceExact(
  "artifacts/api-server/src/routes/companies.ts",
  'import { getStripeClient, getRegistrationFeePriceId, priceIdForSlug } from "../lib/stripeClient";\n',
  "",
  "Stripe client import",
);
replaceRegex(
  "artifacts/api-server/src/routes/companies.ts",
  /router\.post\("\/companies\/:id\/registration-checkout"[\s\S]*?(?=router\.delete\("\/companies\/:id")/,
  `router.post("/companies/:id/registration-checkout", (_req, res): void => {
  res.status(503).json({
    error: "Online payments are temporarily unavailable while a Kosovo bank integration is being prepared.",
    code: "PAYMENTS_DISABLED",
  });
});

router.post("/companies/:id/registration-payment/verify", (_req, res): void => {
  res.json({ paid: false, reason: "payments_disabled" });
});

router.post("/companies/:id/package-checkout", (_req, res): void => {
  res.status(503).json({
    error: "Online payments are temporarily unavailable while a Kosovo bank integration is being prepared.",
    code: "PAYMENTS_DISABLED",
  });
});

router.post("/companies/:id/package-payment/verify", (_req, res): void => {
  res.json({ paid: false, reason: "payments_disabled" });
});

`,
  "company Stripe checkout routes",
);

// 4) Remove Stripe invoice lookups from generic billing routes.
replaceExact(
  "artifacts/api-server/src/routes/billing.ts",
  'import { getStripeClient } from "../lib/stripeClient";\n',
  "",
  "billing Stripe import",
);
replaceRegex(
  "artifacts/api-server/src/routes/billing.ts",
  /  if \(company\?\.registrationFeePaid\) \{[\s\S]*?\n  \}\n\n  res\.json\(result\);/,
  `  if (company?.registrationFeePaid) {
    result.unshift({
      id: 0,
      paymentId: 0,
      number: "REG-001",
      issuedAt: company.createdAt instanceof Date ? company.createdAt : new Date(company.createdAt as string),
      kind: "registration",
      amountCents: 14900,
      status: "paid",
      receiptUrl: null,
      invoicePdfUrl: null,
      invoiceHostedUrl: null,
    });
  }

  res.json(result);`,
  "registration receipt Stripe lookup",
);
replaceRegex(
  "artifacts/api-server/src/routes/billing.ts",
  /router\.get\("\/billing\/stripe-invoices"[\s\S]*?(?=router\.get\("\/billing\/unlocked-contacts")/,
  "",
  "Stripe invoice endpoint",
);
replaceExact(
  "artifacts/api-server/src/routes/billing.ts",
  "// now activate ONLY through verified Stripe Checkout + webhook (see routes/stripe.ts).",
  "// will activate through the future Kosovo bank integration after verified payment.",
  "legacy Stripe comment",
);

// 5) Temporarily bypass only the old payment gate while payment integration is offline.
replaceExact(
  "artifacts/api-server/src/routes/provider-profile.ts",
  "  res.json({ user: publicUser, company: company ?? null, portfolio });",
  `  const companyForClient = company
    ? { ...company, registrationFeePaid: true, packagePaid: true }
    : null;
  res.json({ user: publicUser, company: companyForClient, portfolio });`,
  "provider payment gate response",
);

// 6) Disable checkout from the pricing page without changing its design.
replaceRegex(
  "artifacts/immovia/src/pages/pricing.tsx",
  /  const handleConfirm = async \(\) => \{[\s\S]*?\n  \};\n\n  const pageTitle/,
  `  const handleConfirm = async () => {
    setError(
      language === "sq"
        ? "Pagesat online janë përkohësisht të çaktivizuara. Integrimi me një bankë të Kosovës është në përgatitje."
        : language === "de"
          ? "Online-Zahlungen sind vorübergehend deaktiviert. Eine Integration mit einer Bank im Kosovo wird vorbereitet."
          : language === "fr"
            ? "Les paiements en ligne sont temporairement désactivés. Une intégration avec une banque du Kosovo est en préparation."
            : "Online payments are temporarily disabled while a Kosovo bank integration is being prepared.",
    );
  };

  const pageTitle`,
  "pricing checkout handler",
);
replaceExact(
  "artifacts/immovia/src/pages/pricing.tsx",
  "disabled={!selectedPlanType || loading}",
  "disabled={!selectedPlanType || loading}",
  "pricing button marker",
);

// 7) Provider onboarding creates the profile and stops before any payment provider.
replaceExact(
  "artifacts/immovia/src/pages/provider-onboarding.tsx",
  'import { useCreateCompany, useCreatePackageCheckout } from "@workspace/api-client-react";',
  'import { useCreateCompany } from "@workspace/api-client-react";',
  "package checkout hook import",
);
replaceExact(
  "artifacts/immovia/src/pages/provider-onboarding.tsx",
  "  const createPackageCheckout = useCreatePackageCheckout();\n",
  "",
  "package checkout hook",
);
replaceRegex(
  "artifacts/immovia/src/pages/provider-onboarding.tsx",
  /      const checkout = await createPackageCheckout\.mutateAsync\([\s\S]*?\n      \}\n    \} catch/,
  `      setLocation("/provider");
    } catch`,
  "onboarding checkout flow",
);

const onboarding = read("artifacts/immovia/src/pages/provider-onboarding.tsx")
  .replaceAll("Krijoni Profilin dhe Paguani", "Krijoni Profilin")
  .replaceAll("Create Profile & Pay", "Create Profile")
  .replaceAll("Profil erstellen & Bezahlen", "Profil erstellen")
  .replaceAll("Créer le profil & Payer", "Créer le profil")
  .replaceAll("Tarifa njëherë: CHF 149", "Pagesat online aktivizohen më vonë")
  .replaceAll("One-time setup fee: CHF 149", "Online payments will be activated later")
  .replaceAll("Einmalige Einrichtungsgebühr: CHF 149", "Online-Zahlungen werden später aktiviert")
  .replaceAll("Frais d'activation uniques : CHF 149", "Les paiements en ligne seront activés ultérieurement");
write("artifacts/immovia/src/pages/provider-onboarding.tsx", onboarding);

// 8) Point remaining dashboard compatibility calls to provider-neutral endpoints.
let provider = read("artifacts/immovia/src/pages/provider.tsx")
  .replaceAll("/api/stripe/subscription/sync", "/api/payments/subscription/sync")
  .replaceAll("/api/stripe/portal", "/api/payments/portal")
  .replaceAll("/api/billing/stripe-invoices", "/api/billing/provider-invoices")
  .replaceAll("Stripe", "Online payment");
write("artifacts/immovia/src/pages/provider.tsx", provider);

let providerBilling = read("artifacts/immovia/src/pages/provider-billing.tsx")
  .replaceAll("Stripe", "online payment")
  .replaceAll("stripeSync", "stripeSync")
  .replaceAll("stripePortal", "stripePortal");
write("artifacts/immovia/src/pages/provider-billing.tsx", providerBilling);

// 9) Keep the frontend API shape temporarily, but point it away from Stripe.
let billingApi = read("artifacts/immovia/src/lib/billing-api.ts")
  .replaceAll('/stripe/checkout', '/payments/checkout')
  .replaceAll('/stripe/portal', '/payments/portal')
  .replaceAll('/stripe/subscription/sync', '/payments/subscription/sync');
write("artifacts/immovia/src/lib/billing-api.ts", billingApi);

// 10) Remove Stripe environment documentation.
replaceRegex(
  ".env.example",
  /\n# -----------------------------------------------------------------------------\n# Stripe\n# -----------------------------------------------------------------------------[\s\S]*?(?=\n# -----------------------------------------------------------------------------\n# Resend email)/,
  "\n",
  "Stripe env section",
);

let deploymentDoc = read("VERCEL_DEPLOYMENT.md")
  .replace("Features such as Stripe, OpenAI, Resend, Sanity, and file uploads require their corresponding variables from `.env.example`.", "Features such as OpenAI, Resend, Sanity, and file uploads require their corresponding variables from `.env.example`.")
  .replace(/\n### Stripe[\s\S]*?(?=\n## 4\. Verify after deployment)/, "\n");
write("VERCEL_DEPLOYMENT.md", deploymentDoc);

// 11) Remove Stripe packages from the workspace manifest.
const packagePath = "package.json";
const pkg = JSON.parse(read(packagePath));
if (pkg.dependencies) {
  delete pkg.dependencies.stripe;
  delete pkg.dependencies["stripe-replit-sync"];
  if (Object.keys(pkg.dependencies).length === 0) delete pkg.dependencies;
}
write(packagePath, `${JSON.stringify(pkg, null, 2)}\n`);

// 12) Delete Stripe-only implementation files. Generic billing tables remain for the bank replacement.
[
  "artifacts/api-server/src/routes/stripe.ts",
  "artifacts/api-server/src/lib/stripeClient.ts",
  "artifacts/api-server/src/lib/webhookHandlers.ts",
  "artifacts/api-server/src/lib/stripeActivation.ts",
  "artifacts/api-server/src/payments/stripeProvider.ts",
].forEach(removeFile);

// Remove the temporary codemod and workflow from the final branch commit.
removeFile("scripts/remove-stripe-setup.mjs");
removeFile(".github/workflows/remove-stripe-setup.yml");
