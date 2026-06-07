# Deploy guide — Netlify (frontend) + Render (backend + Postgres)

This app is full-stack, so it needs two hosts:

| Part | Host | Config file |
|---|---|---|
| Vue storefront + admin (static) | **Netlify** | `netlify.toml` |
| NestJS API | **Render** | `render.yaml` |
| PostgreSQL database | **Render** (managed) | `render.yaml` |

> The local dev setup stays on **SQLite** (zero-setup). Production runs the
> exact same Prisma models on Postgres — the build swaps the datasource
> provider automatically (see `render.yaml`), so there's only one schema file.

---

## 1. Backend + database on Render

1. Push this repo to GitHub (already done on your branch).
2. Render Dashboard → **New → Blueprint** → select this repository.
3. Render reads `render.yaml` and provisions:
   - a free **PostgreSQL** database (`booking-db`)
   - a **web service** (`booking-api`) that builds, pushes the schema, seeds
     the two demo tenants, and starts on the port Render assigns.
4. `DATABASE_URL` and `JWT_SECRET` are wired automatically — no manual env vars.
5. When it's live, copy the API URL, e.g. `https://booking-api.onrender.com`.

**Notes**
- Free Render web services cold-start after inactivity (~30–50s first request).
- Free Postgres instances expire after ~30 days — fine for a demo.

---

## 2. Frontend on Netlify

1. Netlify → **Add new site → Import an existing project** → pick this repo.
2. Netlify reads `netlify.toml` (build command + `publish = apps/web/dist` +
   SPA redirect are already set).
3. Set the API URL — **either**:
   - edit `VITE_API_URL` in `netlify.toml`, **or**
   - Netlify UI → Site settings → Environment variables →
     `VITE_API_URL = https://booking-api.onrender.com` (no trailing slash).
4. Deploy. Open the Netlify URL:
   - storefront at `/` (tenant switcher bottom-right)
   - admin at `/admin` — login `admin@acme.nl` / `admin@studio.nl`, pw `demo1234`

---

## How the cross-origin call works

The frontend calls `${VITE_API_URL}/api/...`. The NestJS server enables CORS
for all origins (demo). For a real deployment, restrict it to your Netlify
origin in `apps/api/src/main.ts`.

## Security configuration

- **Passwords** are hashed with bcrypt (`bcryptjs`) on signup/seed and verified
  on login — no plaintext is stored.
- **CORS** is locked to `CORS_ORIGINS` (comma-separated) when set. `render.yaml`
  sets it to the Netlify URL; update it if your frontend URL changes. Unset
  (local dev) reflects any origin.
- **Demo hints** (prefilled credentials + the demo-login banner) are hidden when
  `VITE_DEMO_MODE="false"` — already set in `netlify.toml` for production.

## Production operations

- **Media storage**: set `S3_*` env vars (S3 or Cloudflare R2 / MinIO) so
  uploads are durable. Without them, files go to local disk and are LOST on
  redeploy. See `.env.example`.
- **Seeding**: the build no longer seeds (seeding is destructive). Seed the
  demo data once via the Render shell: `SEED_DEMO=force pnpm --filter @booking/api db:seed`.
  Leave `SEED_DEMO` unset/`false` afterwards so deploys never clobber real data.
- **Error tracking**: set `SENTRY_DSN` to capture 5xx errors.
- **Health check**: `GET /api/health` returns `{ status, db, uptime }` — point
  your uptime monitor here.
- **Password reset**: `/forgot` + `/reset` flow is built; wire a real email
  provider to deliver the reset link (currently logged / shown in non-prod).

## Going further

- Subscription billing (Stripe Billing) tied to feature flags; Stripe Connect
  for tenant payments; calendar sync; real transactional email/SMS.
- Versioned `prisma migrate deploy` (move to a single Postgres provider).
- Per-tenant custom domains via the `Domain` table + on-demand TLS.
