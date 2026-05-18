# ImmoVia

A professional renovation and construction services platform connecting homeowners with vetted contractors across Albania, Germany, and Switzerland.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/immovia run dev` — run the frontend (port 25886)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string
- Required env: `OPENAI_API_KEY` — OpenAI API key for the AI chatbot
- Optional env: `VITE_APP_URL` — Public base URL (e.g. `https://immovia.replit.app`) — set this for production so OG/Twitter share images resolve as absolute URLs for crawlers

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite, wouter routing, shadcn/ui, framer-motion, lucide-react
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)
- AI: OpenAI gpt-4o-mini

## Where things live

- `lib/api-spec/openapi.yaml` — OpenAPI contract (source of truth)
- `lib/db/src/schema/projects.ts` — Projects table schema
- `lib/db/src/schema/companies.ts` — Companies table schema
- `artifacts/api-server/src/routes/` — API route handlers (projects, companies, admin, chat)
- `artifacts/immovia/src/` — React frontend
- `artifacts/immovia/src/lib/translations.ts` — All i18n strings (sq/en/de)
- `artifacts/immovia/src/contexts/LanguageContext.tsx` — Language switching context

## Architecture decisions

- OpenAPI-first: spec gates codegen which gates both the frontend types and the server Zod validators
- Language context stored in localStorage; all visible strings come from `translations.ts` (never hardcoded)
- OpenAI API key is stored as a Replit secret and only accessed server-side in `routes/chat.ts` — never exposed to the frontend
- Admin dashboard is at `/admin` with a subtle footer link (no auth in prototype — add Clerk auth before production)
- Service types are stored as a Postgres text array column

## Product

- **Homeowners** submit renovation/construction project requests via a 4-step wizard
- **Companies & professionals** register their services through a structured form
- **Language support**: Albanian (sq), English (en), German (de) switchable at any time
- **AI Chatbot**: renovation assistant powered by GPT-4o-mini, responds in the selected language
- **Admin dashboard**: manage all project requests and company registrations with status controls
- **Company directory**: browse approved contractors filtered by city and service type

## User preferences

- Professional icons only (lucide-react), no emojis anywhere in the UI
- Navy/blue/light-blue/white color palette
- Trilingual: Albanian, English, German (Shqip, English, Deutsch)
- Admin dashboard accessible via `/admin` (hidden footer link)
- OPENAI_API_KEY must stay server-side only

## Gotchas

- After any OpenAPI spec change: run `pnpm --filter @workspace/api-spec run codegen` before editing routes or frontend
- `pnpm --filter @workspace/db run push` to apply schema changes to the DB
- Do not run `pnpm run dev` at the workspace root
- The DB schema uses `text().array()` for `serviceTypes` — use `{val1,val2}` Postgres array syntax when inserting via raw SQL

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
