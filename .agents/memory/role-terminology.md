---
name: Canonical account-type terminology
description: The one approved user-facing name for each of ImmoVia's two account types, per language, and what must NOT be renamed.
---

# Canonical role terminology (user-facing)

ImmoVia has exactly two account types. Use ONE canonical user-facing noun for each, everywhere in UI, nav, dashboards, forms, admin, and `translations.ts`:

- **Type 1 — the party posting a project** → **Project Poster**
  - en: Project Poster · de: Projektersteller · fr: Porteur de projet · sq: Posto Projekt
- **Type 2 — the party offering services** → **Service Provider**
  - en: Service Provider · de: Dienstleister · fr: Prestataire · sq: Ofrues Shërbimi

Each type has two subtypes on a SEPARATE axis (account_subtype): **individual** and **company** → "Individual Project Poster", "Company Project Poster", "Individual Service Provider", "Company Service Provider". Never collapse the two axes into one (no `individual_project_poster` enum value).

**Why:** Latest explicit user decision via the canvas spec supersedes the earlier "Client/Kunde/Klient" naming. The user was emphatic: use ONLY "Project Poster" and "Service Provider" everywhere (public pages, dashboards, admin). Do NOT use client, freelancer, worker, employer, contractor, talent, customer, or job seeker. A user is EXACTLY ONE account_type (chosen at signup) — never both. Rejected alternatives:
- NOT "Client" anymore (was the prior decision; user reversed it).
- NOT "Homeowner" — a poster may be a tenant, property manager, company, or real-estate owner.
- NOT "Contractor" — platform is not construction-only.

**Migration status:** The terminology rename across `translations.ts`/admin is an in-progress effort the user said to START with the Service Provider post-sign-in experience. The single-role separation of the *navbar* (logged-in users see only their own role's CTA) is done; broader Client→Project Poster string rename may still be partial elsewhere.

**How to apply:**
- Internal/code/DB identifiers stay as-is: `account_type=project_poster` and `account_type=service_provider`. Only the *display* strings change.
- Do NOT rename the **legal-entity** concept: the individual-vs-company toggle, `companyName`/Firmenname/business-name fields, and "are you registering as an individual or a company?" wording all keep "Company/Kompani/Firma/Unternehmen/Société". That is a different axis from the account-type role.
- German "Kunde" and French "Client" were already canonical in some keys, so many strings were already correct before unification.
- When bulk-editing `translations.ts`, never do a bare word replace (e.g. `Companies`→`Service Providers`) — camelCase keys like `totalCompanies` and words like `Firmenname` get corrupted. Replace quoted-value or distinctive full-phrase forms instead, longest/compound phrases first.
