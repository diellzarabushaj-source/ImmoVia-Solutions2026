---
name: Clerk auth integration pattern
description: How Clerk is wired into the ImmoVia Express+React stack; pitfalls and decisions for JIT provisioning, role selection, and Tailwind v4 layer ordering.
---

# Clerk Auth Integration — ImmoVia

## Key decisions

**JIT provisioning** — users are created in the DB at first sign-in via POST /api/auth/sync. No Clerk webhook needed. The middleware looks up by `clerkUserId`; falls back to email to migrate pre-Clerk users.

**Role selection before Clerk UI** — the custom `/signup` page captures `role` + `providerType` into `sessionStorage` key `immovia_pending_signup`, then redirects to Clerk's `/sign-up`. After Clerk signup, `AuthProvider` reads sessionStorage and POSTs to `/auth/sync` with the role data, then clears it.

**clerkUserId column** — added via direct SQL (`ALTER TABLE users ADD COLUMN IF NOT EXISTS clerk_user_id text`) because `drizzle-kit push` requires a TTY. Unique partial index: `CREATE UNIQUE INDEX ... WHERE clerk_user_id IS NOT NULL`.

**Why:** Drizzle push in non-TTY shell asks interactively about existing rows + unique constraints. Use executeSql() for schema changes in this project.

**clerkClient is an object, not a function** — `import { clerkClient as clerk } from "@clerk/express"` then `clerk.users.getUser(id)`. Do NOT call it as `clerkClient()`.

**Admin auth** — `requireAdmin` middleware now uses Clerk JWT + DB role check (`getAuth(req)` → query usersTable by clerkUserId → role === "admin"). The old hardcoded session-based admin login (username/password) is removed. The frontend `admin.tsx` uses `useUser()` + `useAuth()`: if not signed into Clerk → redirect to `/sign-in`; if signed in but role !== "admin" → "Access Denied" page; if role === "admin" → AdminShell. Logout calls `auth.logout()` (Clerk signOut).

## Tailwind v4 + Clerk layers

In `index.css`, the `@layer` declaration must come BEFORE `@import "tailwindcss"`:

```css
@layer theme, base, clerk, components, utilities;
@import "tailwindcss";
@import "@clerk/themes/shadcn.css";
```

In `vite.config.ts`: `tailwindcss({ optimize: false })` — without this, nested `@layer` imports from `@clerk/themes/*.css` get reordered in prod builds.

## Auth routes after migration

- `GET /api/auth/me` — Clerk auth required; returns DB user by clerkUserId
- `POST /api/auth/sync` — Clerk auth required; JIT creates/links DB user; accepts role/providerType in body
- `PUT /api/auth/profile` — Clerk auth required; updates DB user fields
- Old `/api/auth/login`, `/api/auth/signup`, `/api/auth/logout` — REMOVED
