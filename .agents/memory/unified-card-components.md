---
name: Unified card components & poster gating
description: Single reusable ProjectCard/ProviderCard policy and where poster identity is privacy-gated.
---

# Unified card surfaces

Project and provider "card" surfaces share ONE component each, fed by API data — never hand-built per-page card forks.

- `components/project/ProjectCard.tsx` (takes `ProjectCardData`) is the canonical project card; reference style is the home-page card.
- `components/provider/ProviderCard.tsx` (takes `ProviderCardData`) is the canonical provider/company card.
- Shared display helpers live in `lib/display.ts` (e.g. photo src resolution) — reuse these instead of re-deriving icon/label/photo logic in pages.

**Why:** consistency across home, browse, dashboard, and detail surfaces, with the API as the single source of truth. Adding a new card surface = reuse these, pass a `footer` for page-specific actions; do not copy markup.

**How to apply:** when a page needs page-specific buttons, pass them via the `footer` prop and stop event propagation so the card's `onClick` (navigation) still works. Extend the shared component (e.g. an optional gallery CTA slot) rather than forking it.

# Poster identity privacy gating

Poster identity (`posterName`, `posterAvatarUrl`, `posterType`) is exposed ONLY to authenticated users, and contact details (`fullName/email/phone`) only to authenticated users.

- Server enforces this in the projects routes via `redactContact` + `withPoster(..., includePoster=authed)`, applied to BOTH the list endpoint and the detail endpoint. Gating must stay on both — a fix to one is not enough.
- Frontend renders the poster block only when `posterName` is present, so it hides automatically for unauthenticated users (no separate client-side auth check needed for that block).

**Why:** privacy requirement — unauthenticated visitors must never receive poster identity or contact info, on any endpoint.

**How to apply:** any new endpoint returning project rows must run the same redaction/gating; never trust the client to hide fields the server sent.
