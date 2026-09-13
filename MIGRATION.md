# Migration: Static JSON → Supabase API

## Overview

This document describes the migration from local JSON files (`src/data/*.json`)
to Supabase (PostgreSQL) as the primary data source, with Astro API Routes as
the access layer.

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Astro Pages    │────▶│  API Routes      │────▶│  Supabase       │
│  (getStaticPaths)│     │  (/api/*)        │     │  (PostgreSQL)   │
└─────────────────┘     └──────────────────┘     └─────────────────┘
        │                       │                       │
        │              ┌────────┴────────┐             │
        └──────────────▶│  fetchers.ts    │─────────────┘
                        │  (build-time    │
                        │   fetch for     │
                        │   getStaticPaths)│
                        └─────────────────┘
```

## Feature Flags

Control data source via `src/config/features.json`:

```json
{
  "products": "api",
  "categories": "api",
  "solutions": "api",
  "kits": "api",
  "offers": "api",
  "guides": "api",
  "faqs": "api"
}
```

Values: `"api"` (Supabase) or `"static"` (local JSON).

## Migration Steps

### 1. Prepare Supabase

```bash
# Apply migrations (run once)
psql -h <host> -U postgres -d postgres -f supabase/migrations/001_initial_schema.sql
psql -h <host> -U postgres -d postgres -f supabase/migrations/002_rls_policies.sql
psql -h <host> -U postgres -d postgres -f supabase/migrations/003_storage.sql
```

### 2. Configure Environment

```bash
# .env
PUBLIC_SUPABASE_URL=https://ygsgimmjhjhnyqftetvuib.supabase.co
PUBLIC_SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
ANALYTICS_HMAC_SECRET=<32+ char secret>
```

### 3. Migrate Data

```bash
# Run migration script (idempotent upsert)
pnpm tsx scripts/migrate-json-to-db.ts

# Verify counts match
pnpm tsx scripts/verify-migration.ts
```

### 4. Enable API Mode

Feature flags already set to `"api"` in `src/config/features.json`.

### 5. Build & Deploy

```bash
pnpm build
# Deploy to your platform (Vercel, Netlify, etc.)
```

## Rollback Procedure

If issues arise, rollback to static JSON:

```bash
# 1. Flip feature flags back to static
pnpm tsx scripts/rollback-to-static.ts

# 2. Rebuild
pnpm build

# 3. Verify site works with local JSON
# 4. API routes remain available for re-enable
```

## Data Flow

### Build Time (Static Generation)

1. `getStaticPaths` in each page calls `fetchProducts()`, `fetchCategories()`,
   etc.
2. These functions call internal API routes (`/api/products`, `/api/categories`,
   etc.)
3. API routes query Supabase and return JSON
4. Astro generates static HTML pages

### Runtime (Client)

1. Pages embed initial data in `<script type="application/json">`
2. Client-side filtering/sort uses embedded data (no extra API calls)
3. WhatsApp CTA uses pre-filled message from product data

## API Endpoints

| Endpoint                 | Method | Description                            |
| ------------------------ | ------ | -------------------------------------- |
| `/api/products`          | GET    | List products with filters, pagination |
| `/api/products/[slug]`   | GET    | Product detail                         |
| `/api/categories`        | GET    | List categories                        |
| `/api/categories/[slug]` | GET    | Category + products                    |
| `/api/solutions`         | GET    | List solutions                         |
| `/api/solutions/[slug]`  | GET    | Solution + products                    |
| `/api/kits`              | GET    | List kits                              |
| `/api/offers`            | GET    | List offers                            |
| `/api/offers/[slug]`     | GET    | Offer detail                           |
| `/api/guides`            | GET    | List guides                            |
| `/api/guides/[slug]`     | GET    | Guide detail                           |
| `/api/faqs`              | GET    | List FAQs                              |
| `/api/upload`            | POST   | Upload image to Supabase Storage       |
| `/api/admin/*`           | *      | Admin CRUD (protected)                 |
| `/api/analytics/*`       | POST   | Analytics tracking (HMAC)              |

## Verification Checklist

- [ ] `pnpm astro check` passes (0 errors)
- [ ] `pnpm build` succeeds
- [ ] `/productos` loads with all products
- [ ] `/producto/[slug]` shows correct product
- [ ] `/categoria/[slug]` shows category + products
- [ ] `/soluciones`, `/kits`, `/ofertas`, `/guias`, `/faq` work
- [ ] Client-side filtering works on `/productos`
- [ ] WhatsApp CTA generates correct message
- [ ] Images load (Supabase Storage or local assets)
- [ ] SEO meta tags present (OG, JSON-LD)

## Troubleshooting

### "Cannot find module" errors

```bash
pnpm install
```

### Supabase connection errors

- Verify `PUBLIC_SUPABASE_URL` and keys
- Check Supabase project is not paused
- Verify IP allowlist (0.0.0.0/0 for dev)

### Build fails on getStaticPaths

- Ensure API routes are deployed (server output mode)
- Check `fetchers.ts` base URL matches deployment

### Rollback needed

```bash
pnpm tsx scripts/rollback-to-static.ts
pnpm build
```

## Performance Notes

- **Static-first**: All pages pre-rendered at build time
- **<1 Mbps target**: No framework JS, lazy-loaded images, optimized assets
- **API calls only at build time** — zero runtime API latency for users
- **Supabase RLS**: Public read access, service role for writes
- **Realtime**: Available for admin dashboard (optional)

## Future Enhancements

1. **ISR (Incremental Static Regeneration)** — Rebuild individual pages on data
   change
2. **Edge caching** — Deploy API routes to edge for lower latency
3. **Search integration** — Add Meilisearch/Typesense for full-text search
4. **Analytics dashboard** — Build admin UI using Realtime subscriptions
