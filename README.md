# Multi-Tenant White-Label Booking Platform (demo)

A **Shopify × Calendly** style platform: every tenant composes its own booking
website — branding, theme, pages, services — entirely **database-driven**, with
**nothing hardcoded** in the frontend.

> This is a runnable demo/example. Online payments and SMS are intentionally
> left as feature-flag stubs (not wired to Stripe/Twilio).

## Stack

| Layer | Tech |
|---|---|
| Frontend | Vue 3 · TypeScript · Vite · Element Plus · Pinia · Vue Router |
| Backend | NestJS · Prisma · **SQLite** (demo; swap to PostgreSQL in prod) |
| Auth | JWT (+ OAuth structure, stubbed) |

## Monorepo layout

```
booking/
├── apps/
│   ├── api/                 # NestJS + Prisma
│   │   ├── prisma/          # schema.prisma + seed.ts
│   │   └── src/
│   │       ├── common/      # tenant middleware, CLS context, guard
│   │       ├── prisma/      # PrismaService (auto tenant-scoping)
│   │       └── modules/     # auth · site · pages · booking
│   └── web/                 # Vue 3 app (storefront + /admin)
│       └── src/
│           ├── storefront/  # public site + dynamic renderer + sections
│           ├── admin/       # dashboard + visual builder
│           ├── stores/      # Pinia: site, auth, builder
│           └── theme/       # design tokens → CSS vars + Element Plus
└── pnpm-workspace.yaml
```

## Quick start

```bash
pnpm install

# 1) set up the SQLite db (generate client, push schema, seed 2 tenants)
pnpm db:setup

# 2) run API (:3000) and web (:5173) together
pnpm dev
```

Open:
- **Storefront**: http://localhost:5173  (use the tenant switcher, bottom-right)
- **Admin**: http://localhost:5173/admin

Demo logins (password `demo1234`):
- `admin@acme.nl` — *Acme Wellness Spa* (light, teal, rounded)
- `admin@studio.nl` — *Studio Noir Barber* (dark, gold, sharp)

## Architecture highlights

- **Multi-tenancy** — shared schema, `tenantId` on every tenant table.
  Tenant is resolved per request (`X-Tenant` header / host) into a CLS
  context; `PrismaService` auto-injects `tenantId` on reads as a safety net.
- **Theme Engine** — `ThemeConfig.tokens` (JSON) → CSS custom properties +
  Element Plus variable overrides. Instant re-theming, dark/light, live preview.
- **JSON Page Builder** — pages stored as `{ sections: [{ type, visible, props }] }`.
  A **component registry** maps `type` → Vue component. New blocks = new
  component + registry + seeded `ComponentDefinition`, **no DB migration**.
- **Config-driven UI / Feature Flags** — branding, content, features all come
  from the API; the storefront renders purely from config.
- **Draft / publish** — theme and pages keep a draft that the builder previews
  before publishing.

## API (all tenant-scoped via `X-Tenant`)

```
POST /api/auth/login            GET  /api/auth/oauth/:provider
GET  /api/site                  (bootstrap: tenant + theme + content + features)
GET/PUT /api/theme · PUT /api/theme/draft · POST /api/theme/publish
GET/PUT /api/content            GET/PUT /api/features
GET  /api/components            (builder registry)
GET  /api/pages · /pages/:slug · PUT /pages/:slug · POST /pages/:slug/publish
GET/POST/PUT/DELETE /api/services
GET/PUT /api/business-hours     GET /api/availability?serviceId=&date=
GET/POST /api/bookings · PATCH /api/bookings/:id
```

## Deploying (live URL)

Full-stack, so it needs two hosts: **Netlify** (frontend) + **Render**
(NestJS API + managed Postgres). Config is committed (`netlify.toml`,
`render.yaml`). Step-by-step guide: see [`DEPLOY.md`](./DEPLOY.md).

## From demo → production

- Swap SQLite → PostgreSQL (change Prisma `datasource`), enable Row-Level Security.
- Hash passwords (bcrypt/argon2), real OAuth callbacks, refresh tokens.
- Object storage for media uploads; wire Stripe/Mollie + Twilio behind the flags.
- Split `web` into separate `storefront` + `admin` apps if desired; per-tenant
  custom domains via the `Domain` table + on-demand TLS.
