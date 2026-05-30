---
name: Contact detail gating (public vs authenticated)
description: How and where personal contact PII is gated in the marketplace, and the dual-auth gotcha.
---

# Contact detail gating

Personal contact PII must be gated at BOTH layers, not just the UI:
- **UI** (`companies.tsx`, `company-profile.tsx`, `project-detail.tsx`): hide email/phone/contact buttons when `useAuth()` has no `user`; show a registration/login prompt instead (`t.publicProfile.contactLoginPrompt` / `contactLoginCta`, present in sq/en/de/fr).
- **API** (`routes/companies.ts`, `routes/projects.ts`): GET list + detail redact email/phone (and `fullName` for projects) to empty strings for unauthenticated requests, via an `isAuthenticated(req)` + `redactContact()` helper. Empty strings keep the required-string Zod response schema valid.

**Why:** UI-only gating is cosmetic — a public user can still read PII from devtools/network. The redaction stops the data at the server.

**How to apply / gotcha:** The app has TWO auth systems. Regular users authenticate via Clerk (`getAuth(req).userId`); the **admin dashboard uses session auth** (`req.session.adminAuthenticated === true`), NOT Clerk. Admin pages fetch the same public `GET /api/companies` and `GET /api/projects` endpoints, so `isAuthenticated()` must check BOTH `req.session.adminAuthenticated` and `getAuth(req).userId` — otherwise admins lose contact info. Any new endpoint that returns contact PII needs the same dual check.
