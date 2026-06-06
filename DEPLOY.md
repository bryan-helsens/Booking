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

## Going further (production hardening)

- Hash passwords (bcrypt/argon2) and wire real OAuth callbacks.
- Restrict CORS to the known frontend origin.
- Replace `db push` + seed with versioned `prisma migrate deploy`.
- Per-tenant custom domains via the `Domain` table + on-demand TLS.
- Object storage (S3/R2) for media uploads; wire Stripe/Mollie + Twilio.
