# Vercel deployment

This repository is configured to deploy the Vite frontend and the existing Express API in one Vercel project.

## 1. Import the repository

Import `diellzarabushaj-source/ImmoVia-Solutions2026` in Vercel and keep the project **Root Directory** set to the repository root (`.`).

Do not select `artifacts/immovia` as the root directory. The frontend depends on workspace packages and the API entrypoint is located at `api/index.ts`.

Vercel reads these settings from `vercel.json`:

- Install: `pnpm install --frozen-lockfile`
- Frontend build: `pnpm --filter @workspace/immovia run build`
- Static output: `artifacts/immovia/dist/public`
- API: all `/api/*` requests are routed to the Express application
- SPA routing: non-file routes fall back to `index.html`

## 2. Add environment variables

Copy the required keys from `.env.example` into **Vercel → Project → Settings → Environment Variables**.

At minimum, the API requires:

- `DATABASE_URL`
- `SESSION_SECRET`
- `VITE_CLERK_PUBLISHABLE_KEY`
- `CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`

The frontend build also requires `VITE_CLERK_PUBLISHABLE_KEY`. Features such as Stripe, OpenAI, Resend, Sanity, and file uploads require their corresponding variables from `.env.example`.

Use a different `VITE_APP_URL` and `VITE_CLERK_PROXY_URL` for Preview and Production when appropriate.

## 3. External services

### Database

Use a hosted PostgreSQL database that accepts connections from Vercel, such as Neon, Supabase, or another managed PostgreSQL provider. The connection string should use TLS/SSL.

### File storage

The original Replit-only object-storage sidecar has been replaced with a portable Google Cloud Storage configuration while retaining Replit compatibility.

For Vercel, configure:

- `GOOGLE_CLOUD_PROJECT_ID`
- `GOOGLE_CLOUD_CREDENTIALS_JSON`
- `PUBLIC_OBJECT_SEARCH_PATHS`
- `PRIVATE_OBJECT_DIR`

### Clerk

Add the Vercel preview/production domains to the Clerk application's allowed origins and redirect URLs. Set the production proxy URL to:

`https://YOUR_DOMAIN/api/__clerk`

### Stripe

After production deployment, configure the Stripe webhook endpoint as:

`https://YOUR_DOMAIN/api/stripe/webhook`

Then save the webhook signing secret as `STRIPE_WEBHOOK_SECRET` in Vercel.

## 4. Verify after deployment

Check these routes:

- `/`
- a direct SPA route such as `/companies`
- `/api/health`
- `/sign-in`
- `/admin`

A successful frontend build does not guarantee that the API will run: missing server environment variables will appear in the Vercel Function logs.
