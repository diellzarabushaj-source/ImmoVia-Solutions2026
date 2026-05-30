---
name: Canonical account-type terminology
description: The one approved user-facing name for each of ImmoVia's two account types, per language, and what must NOT be renamed.
---

# Canonical role terminology (user-facing)

ImmoVia has exactly two account types. Use ONE canonical user-facing noun for each, everywhere in UI, nav, dashboards, forms, admin, and `translations.ts`:

- **Type 1 — the party posting a project** → **Client**
  - en: Client · de: Kunde · fr: Client · sq: Klient
- **Type 2 — the party offering services** → **Service Provider**
  - en: Service Provider · de: Dienstleister · fr: Prestataire · sq: Ofrues Shërbimi

**Why:** User decision (explicit). Rejected alternatives and their reasons:
- NOT "Homeowner" — a poster may be a tenant, property manager, company, or real-estate owner.
- NOT "Contractor" — the platform is not construction-only (cleaning, garden, interior design, moving, real-estate services, etc.).
- "Professional" is allowed only in soft marketing copy, never as the role name.

**How to apply:**
- Internal/code/DB identifiers stay as-is: `account_type=project_poster` and `account_type=service_provider`. Only the *display* strings change.
- Do NOT rename the **legal-entity** concept: the individual-vs-company toggle, `companyName`/Firmenname/business-name fields, and "are you registering as an individual or a company?" wording all keep "Company/Kompani/Firma/Unternehmen/Société". That is a different axis from the account-type role.
- German "Kunde" and French "Client" were already canonical in some keys, so many strings were already correct before unification.
- When bulk-editing `translations.ts`, never do a bare word replace (e.g. `Companies`→`Service Providers`) — camelCase keys like `totalCompanies` and words like `Firmenname` get corrupted. Replace quoted-value or distinctive full-phrase forms instead, longest/compound phrases first.
