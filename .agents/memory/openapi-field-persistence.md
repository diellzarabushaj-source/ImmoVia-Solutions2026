---
name: OpenAPI field add — persistence is not automatic
description: Adding a field to an OpenAPI request schema validates it but does NOT persist it; route handlers must explicitly map it.
---

When adding a new field to an OpenAPI request schema (e.g. `ProjectInput`, `ProjectUpdate`) and running codegen, the generated Zod schema will *accept and validate* the field, but the field is silently dropped unless the route handler explicitly maps it into the DB insert/update payload.

**Why:** Codegen only produces validators/types. The Express handlers build `insert(...).values({...})` / `update(...).set({...})` by hand, so a new field passes validation, returns 2xx, and looks wired — but never reaches the DB until you add it to that object.

**How to apply:** Whenever you add a field to a `*Input`/`*Update` schema, also update BOTH the create (POST) and update (PATCH) handlers in the matching `artifacts/api-server/src/routes/*.ts`. A symptom of forgetting: the API "advertises" an editable field that never changes the stored value. Keep trim/null policy consistent between create and update (e.g. `value?.trim() || null`).
