# Threat Model

## Project Overview

ImmoVia is a public marketplace for homeowners and service providers. A React frontend talks to an Express API backed by PostgreSQL, with Clerk for end-user authentication, a separate session-based admin console, Stripe for payments, OpenAI for chatbot responses, Sanity for blog content, Resend for email, and object storage for uploads. The app handles project requests, provider profiles, messaging, billing state, and administrative moderation.

Production assumptions for future scans:
- `artifacts/mockup-sandbox/` is dev-only unless a production code path is shown.
- `NODE_ENV` is `production` in deployed environments.
- The current deployment is public, so all unauthenticated `/api/*` routes are internet-reachable.

## Assets

- **Homeowner project data** — project descriptions, locations, budgets, timing, contact details, and attached photos. Exposure can reveal private renovation plans and direct contact information.
- **Provider registration and profile data** — business names, contact data, licensing/profile information, pricing, gallery images, and unpublished moderation-state records.
- **User accounts and sessions** — Clerk identities, mapped local user IDs, provider plan state, and the separate admin session cookie.
- **Admin capabilities** — approval/rejection flows, user management, reports, settings, and any route guarded by `requireAdmin`.
- **Uploaded files and attachments** — provider photos, portfolio images, category images, and conversation/message attachments stored in object storage.
- **Application secrets and paid integrations** — OpenAI API key, Stripe secrets, Resend key, session secret, and API keys used by AI search endpoints.

## Trust Boundaries

- **Browser to Express API** — all client input is untrusted, including path/query params, JSON bodies, and uploaded object paths.
- **Express to PostgreSQL** — route-level authorization failures can directly expose or modify sensitive records.
- **Express to third parties** — Stripe, OpenAI, Resend, Sanity, Clerk, and object storage calls can create cost, spam, or data-exfiltration impact if abused.
- **Public to authenticated boundary** — many listing/detail endpoints are public but must server-side enforce what unpublished or contact data can cross to anonymous or low-privilege users.
- **Authenticated user to provider/admin boundary** — Clerk-authenticated users, paid providers, and the separate admin session each have different permissions that must be enforced on the server.
- **Object metadata/ACL boundary** — uploaded files may be stored in private buckets but still become public if download routes ignore ACL decisions.

## Scan Anchors

- Production backend entry: `artifacts/api-server/src/app.ts` and `artifacts/api-server/src/routes/index.ts`
- Highest-risk server areas: `routes/projects.ts`, `routes/companies.ts`, `routes/admin-auth.ts`, `routes/storage.ts`, `routes/user-auth.ts`, `routes/provider-profile.ts`, `routes/chat.ts`, `routes/stripe.ts`
- Public surfaces: listing/detail endpoints, chat/contact endpoints, blog/search endpoints, Stripe webhook, AI search endpoints
- Authenticated/provider surfaces: messaging, portfolio, billing, provider profile, project unlock flows
- Admin surface: `/admin` frontend and all `routes/admin*.ts` guarded by `requireAdmin`
- Usually ignore unless production reachability is shown: `artifacts/mockup-sandbox/**`

## Threat Categories

### Spoofing

ImmoVia uses two distinct authentication systems: Clerk for regular users and `express-session` for admin access. The system must ensure that all privileged routes validate the correct identity source, that admin authentication is not guessable or embedded in source, and that no route treats client-visible state as proof of privilege.

### Tampering

Users can submit projects, provider profiles, messages, billing actions, and moderation-related data. The server must enforce moderation state, plan entitlements, and ownership checks itself; client-side filtering or hidden UI is not sufficient. Payment and subscription state must only change in response to verified Stripe events or tightly scoped post-checkout validation.

### Information Disclosure

This application stores unpublished project requests, pending provider registrations, contact details, attachments, and uploaded images. Public and low-privilege endpoints must only expose approved/open records and must redact protected fields server-side. Private object-storage downloads must enforce authentication and ACL rules before streaming any file.

### Denial of Service

Several public or low-friction endpoints call paid or resource-intensive services, including OpenAI, email delivery, Stripe, and storage signing/download paths. The application must rate-limit abuse-prone endpoints according to cost and impact, keep request bodies bounded, and avoid allowing unauthenticated users to trigger disproportionate external spend.

### Elevation of Privilege

The highest-risk privilege transitions are anonymous to authenticated, authenticated to provider-plan access, and any user to admin. All admin operations must require strong server-side admin authentication. Provider-only or paid-plan-only data access (such as contact unlocks or unpublished records) must not be reachable through broad listing/detail routes or insecure object URLs.
