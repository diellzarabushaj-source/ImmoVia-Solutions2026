---
name: Stripe v20 API breaking changes
description: Key differences in stripe@20.0.0 / API version 2025-11-17.clover that break subscription sync logic
---

## Breaking changes in stripe@20.0.0 (apiVersion: "2025-11-17.clover")

### Subscription period fields removed
`current_period_start` and `current_period_end` no longer exist on the Subscription object.

**Replacement:**
- Period start → `subscription.start_date` (Unix seconds)
- Period end → calculate from `start_date` + price recurring interval (month/year)
- Fallback → `billing_cycle_anchor` is still present

```typescript
const rawStart = activeSub.start_date ?? activeSub.billing_cycle_anchor ?? Math.floor(Date.now() / 1000);
const periodStart = new Date(rawStart * 1000);
const periodEnd = new Date(periodStart);
if (isYearly) periodEnd.setFullYear(periodEnd.getFullYear() + 1);
else periodEnd.setMonth(periodEnd.getMonth() + 1);
```

### Checkout session → subscription race condition
After Stripe redirects to success URL, the subscription may briefly be in `"incomplete"` status. Querying `subscriptions.list({ status: "active" })` immediately after redirect can return empty.

**Fix:** Include `{CHECKOUT_SESSION_ID}` in the success URL — Stripe substitutes the real session ID. Then retrieve the checkout session with `expand: ["subscription"]` to get the subscription object directly, regardless of its current status.

```typescript
// success_url
`${host}/provider/billing?checkout=success&session_id={CHECKOUT_SESSION_ID}`

// sync endpoint
const session = await stripe.checkout.sessions.retrieve(sessionId, { expand: ["subscription"] });
const sub = session.subscription; // object or string ID
```

**Why:** The session-based lookup is authoritative and status-independent; list-based lookup has a timing window where the subscription hasn't transitioned to "active" yet.
