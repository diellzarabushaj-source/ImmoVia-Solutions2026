---
name: Sanity Studio production serve setup
description: How to run Sanity Studio stably at /studio/ in Replit — build + serve.mjs approach
---

## The rule
Run Sanity Studio as a production build (`sanity build`) served by a minimal Node.js static server (`serve.mjs`), NOT `sanity dev`. The dev server creates a second Vite optimizer that produces a duplicate React bundle → "Invalid hook call" crash.

**Why:** Sanity's internal Vite runs `.sanity/vite/deps/react.js` AND the workspace Vite runs `.vite/deps/react.js`. Two React instances = rules of hooks violation.

**How to apply:** Keep the workflow command as `node serve.mjs` (the `serve` script). The `build` script runs `sanity build`. The `start` script chains both. Workflow only runs serve (pre-built dist).

## serve.mjs responsibilities
Two critical patches applied to `dist/index.html` at startup:

1. **Strip bridge.js**: `decorateIndexWithBridgeScript` in Sanity's runtime injects a CDN `<script>` AFTER Vite's HTML transform, so no Vite plugin can catch it. Regex strip at serve time: `/<script[^>]*sanity-cdn\.[a-z]+\/bridge\.js[^>]*><\/script>/g`

2. **Fix base paths**: `sanity build` generates `src="/static/..."` instead of `src="/studio/static/..."` in index.html even with `base: "/studio/"` in Vite config + `basePath: "/studio"` in sanity.config.ts. Fix at serve time: replace `href="/static/` → `href="/studio/static/` and `src="/static/` → `src="/studio/static/`.

Without fix #2, the Replit proxy routes `/static/...` to the immovia frontend → 404 for all JS/CSS.

## Verification gotcha
The `screenshot` tool uses a headless browser that does NOT execute `<script type="module">`. The page will always appear blank in that tool even when working perfectly. Use `runTest()` (Playwright) to verify — it loads ES modules correctly.

## CORS
All three origins were added before: `https://<specific>.worf.replit.dev`, `https://*.replit.dev`, `https://*.replit.app`. They are already in the Sanity project `c0tinigu`. Do not add them again.

## sanity.cli.ts must set build.target: "esnext"
React Compiler uses destructuring syntax in output that older build targets reject. Without `build: { target: "esnext" }` in the Vite config in `sanity.cli.ts`, `sanity build` fails.
