---
name: SP onboarding gate pattern
description: The full SP registration + payment gate flow — states, redirects, and localStorage key
---

# SP Onboarding Gate State Machine

Gate state type in `provider.tsx`:
`"checking" | "package_unpaid" | "unpaid" | "paid" | "error"`

## State transitions
1. `checking` → fetch `/api/provider/profile`
2. No company → redirect to `/provider-onboarding` (NOT `/register-company`)
3. company exists, `packagePaid === false` → `package_unpaid` (full-screen gate, subscription checkout)
4. company exists, `packagePaid === true`, `registrationFeePaid === false` → `unpaid` (blurred dashboard + fixed overlay, CHF 149)
5. Both paid → `paid` (full dashboard access)

## Blurred dashboard ("unpaid" state)
- NOT an early return — uses React Fragment `<>...</>` as return root
- Fixed overlay `z-50` placed before the main container div as a Fragment sibling
- Main container gets `blur-sm pointer-events-none select-none` class when `registrationGate === "unpaid"`
- `handleGatePay` defined BEFORE the `return ()` statement (regular async function, not inside a conditional)

## Plan localStorage key
`immovia_pending_plan` — stored in signup.tsx when SP selects plan, read in provider-onboarding.tsx, cleared after successful company creation + package checkout redirect.

## Package checkout flow
- `POST /api/companies/:id/package-checkout` → Stripe subscription mode
- `priceIdForSlug` maps: "basic" → BASIC, "pro" → PROFESSIONAL, "premium" → PREMIUM
- Backend normalizes "professional" → "pro" before calling `priceIdForSlug`
- Success URL: `/package-payment-success?company_id=X&session_id={CHECKOUT_SESSION_ID}`
- Cancel URL: `/provider?cancelled=1`

## useCategories in provider-onboarding.tsx
Call as `useCategories("service")` — it takes a type filter, NOT a language code.

**Why:** `useCategories(type?)` accepts `"service" | "project" | undefined`, not a language string.
**How to apply:** Always pass `"service"` in SP onboarding contexts.
