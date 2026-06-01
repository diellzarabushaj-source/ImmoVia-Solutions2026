---
name: pnpm filtered add prunes hoisted deps
description: Why a filtered `pnpm add` can break an unrelated package's runtime/build, and how to recover.
---

Running `pnpm add <pkg> --filter @workspace/<one-package>` (or `pnpm --filter X add`) can prune
an already-declared, hoisted dependency from another workspace package's resolved tree, even though
that dependency is still listed in the other package's `package.json`. Symptom seen: after adding
`@types/pg` to `scripts`, the api-server build failed with esbuild "Could not resolve openai" and
typecheck failed on the openai import, despite `openai` being declared in api-server's package.json.

**Why:** filtered installs only reconcile the targeted package's links; the hoisted store can be left
inconsistent for siblings, dropping a previously-linked dep from `node_modules/.pnpm`.

**How to apply:** after any filtered `pnpm add`, run a full `pnpm install` at the workspace root to
reconcile all packages, then restart the affected workflow. Verify with
`ls -d node_modules/.pnpm/<pkg>@*`. Don't assume a missing-module error after a filtered add is a real
dependency problem — it's usually just an out-of-sync store.
