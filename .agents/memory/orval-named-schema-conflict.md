---
name: Orval named-schema vs inline conflict
description: When Orval generates types for inline request/response bodies AND for named schemas, it produces duplicate exports causing TS2308 in the api-zod barrel.
---

## The rule
Always use `$ref` to named schemas in `components/schemas` for request bodies and response objects. Never use inline `type: object` in `requestBody.content.schema` or `responses.content.schema`.

**Why:** Orval generates:
- A Zod validator in `api.ts` (e.g. `export const CreateRegistrationCheckoutBody = zod.object(...)`)
- A TypeScript type in `types/<name>.ts` (e.g. `export type CreateRegistrationCheckoutBody = {...}`)

Both get re-exported via `export *` in `api-zod/src/index.ts`, causing TS2308 "has already exported a member named X".

## Also: avoid GET+query-param endpoints that also have path params
Orval creates a merged `<Op>Params` Zod schema (path+query) in `api.ts` AND a separate query-only `<Op>Params` TS type in `types/`. These collide.
**Fix:** Use POST with a body instead of GET with query params when you have both path params and query params.

## How to apply
- In OpenAPI spec: put all request/response schemas under `components/schemas` and reference them with `$ref: "#/components/schemas/MySchema"`.
- For endpoints needing path + filtering: use POST with body, or split into separate routes.
- Run codegen and check for TS2308 errors before committing.
