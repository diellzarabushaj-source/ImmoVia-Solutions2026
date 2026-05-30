---
name: Provider middleware vs frontend role-check mismatch
description: requireProvider and requireContractor must mirror the frontend isServiceProvider() logic exactly, or legacy users silently get 403 on all API calls.
---

The frontend `isServiceProvider(user)` accepts three conditions:
1. `accountType === "service_provider"` (new system)
2. `role === "service_provider"` (legacy)
3. `role === "contractor"` (old legacy)

Both backend middlewares (`requireProvider`, `requireContractor`) MUST mirror all three conditions. If they only check `accountType`, any user provisioned before the `accountType` column existed (accountType=null, role="contractor") will pass the frontend guard and land on the dashboard, but every API call will 403 — producing "many errors" across the whole dashboard (balance, app-stats, projects, offers, profile load/save all fail).

**Why:** accountType column was added after some users were already provisioned with role="contractor". Those users have accountType=null in the DB.

**How to apply:** Whenever adding a new provider-only middleware or tightening an existing one, use:
```typescript
const isProvider =
  user.accountType === "service_provider" ||
  user.role === "contractor" ||
  user.role === "service_provider";
if (!isProvider) { res.status(403)... }
```
Also: any component-level role check (e.g. `user.role === "contractor"`) should use the shared `isServiceProvider(user)` helper from AuthContext instead of a direct string comparison.
