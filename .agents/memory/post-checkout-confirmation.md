---
name: Post-checkout confirmation page
description: How the Stripe post-checkout success flow is wired and the session_id fallback gotcha.
---

# Post-checkout confirmation

After Stripe Checkout, `success_url` points at a dedicated confirmation page (`/payment/success?session_id={CHECKOUT_SESSION_ID}`), not the billing page. The page calls the existing `stripeSync(session_id)` to activate, then reads `appStats` to render an order summary (plan, amount, monthly credits, next renewal).

**Gotcha — session_id is required on a confirmation page.** `GET /stripe/subscription/sync` falls back to "find the customer's active subscription" when no `session_id` is given. That fallback is fine for the billing page, but on a *payment success* page it can falsely confirm an OLD subscription as a fresh purchase. So the success page must NOT run sync without a `session_id` — show a pending/recovery state instead.

**Why:** A real return from Stripe always carries `{CHECKOUT_SESSION_ID}`; a missing id means the user navigated directly, so there's no fresh payment to confirm.

**How to apply:** Gate the success page to providers only (mirror `isServiceProvider`), require `session_id` before calling sync, and rely on `ranRef` + idempotent `activateSubscription` for StrictMode double-invoke safety.
