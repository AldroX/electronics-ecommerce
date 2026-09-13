# Delta Spec: ofertas-landing

**Change**: `ofertas-pages`  
**Domain**: `ofertas-landing` (NEW)  
**Status**: Draft

---

## Requirements

| ID         | Requirement                                                                                                                           | Priority                                        |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| REQ-OL-001 | Route `/ofertas` MUST render a landing page listing all active offers using `getActiveOffers()`                                       | P0                                              |
| REQ-OL-002 | Each offer in the grid MUST link to its detail page at `/ofertas/{slug}` (not `/producto/{productSlug}`)                              | P0                                              |
| REQ-OL-003 | Page title MUST be `"Ofertas de la semana                                                                                             | {siteTitle}"`where`siteTitle` comes from config | P0  |
| REQ-OL-004 | Page meta description MUST describe the page as a weekly offers listing                                                               | P0                                              |
| REQ-OL-005 | Page MUST include breadcrumbs: `Inicio → Ofertas` (with `Inicio` linking to `/`)                                                      | P0                                              |
| REQ-OL-006 | Page MUST use `Base` layout with proper SEO (canonical, OG tags, schema.org BreadcrumbList)                                           | P0                                              |
| REQ-OL-007 | Grid MUST be responsive: 2 cols mobile, 3 cols tablet, 4 cols desktop                                                                 | P0                                              |
| REQ-OL-008 | When no active offers exist, page MUST render empty state with message "No hay ofertas activas esta semana" (no empty grid container) | P0                                              |
| REQ-OL-009 | Zero framework JS — static generation only                                                                                            | P0                                              |

---

## Scenarios

| ID         | Given                                                                                                    | When                                                | Then                                                                                           |
| ---------- | -------------------------------------------------------------------------------------------------------- | --------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| SCN-OL-001 | 3 active offers exist in `ofertas.json` with `validUntil >= today` and `availability !== 'out-of-stock'` | User visits `/ofertas`                              | Page renders 3 offer cards in a grid, each linking to `/ofertas/{offer.slug}`                  |
| SCN-OL-002 | 0 active offers exist (all expired or out of stock)                                                      | User visits `/ofertas`                              | Page renders empty state message "No hay ofertas activas esta semana" without a grid container |
| SCN-OL-003 | User visits `/ofertas` on mobile (360px)                                                                 | Page renders                                        | Grid shows 2 columns                                                                           |
| SCN-OL-004 | User visits `/ofertas` on tablet (768px)                                                                 | Page renders                                        | Grid shows 3 columns                                                                           |
| SCN-OL-005 | User visits `/ofertas` on desktop (1024px+)                                                              | Page renders                                        | Grid shows 4 columns                                                                           |
| SCN-OL-006 | Page is built                                                                                            | `getStaticPaths` is not needed (single static page) | Build succeeds with static HTML output                                                         |
| SCN-OL-007 | SEO audit runs                                                                                           | Page is analyzed                                    | Title = "Ofertas de la semana                                                                  | EnergíaTotal", canonical = `https://energiatotal.cu/ofertas`, OG tags present, BreadcrumbList JSON-LD with 2 items |

---

## Acceptance Criteria

- [ ] Route `/ofertas` exists and returns 200
- [ ] All active offers from `getActiveOffers()` are displayed
- [ ] Each card links to `/ofertas/{slug}` (not `/producto/{productSlug}`)
- [ ] Breadcrumbs render correctly with `Inicio → Ofertas`
- [ ] Page title follows convention
- [ ] Responsive grid works at all breakpoints
- [ ] Empty state handled gracefully
- [ ] Zero framework JS (Astro component only)
- [ ] SEO metadata complete

---

## Files to Create / Modify

| File                                   | Action                                                               |
| -------------------------------------- | -------------------------------------------------------------------- |
| `src/pages/ofertas/index.astro`        | **CREATE** — Landing page route                                      |
| `src/data/helpers/offers.ts`           | No change (already exports `getActiveOffers`)                        |
| `src/components/cards/OfferCard.astro` | No change (reuse for grid, but link target changes — see REQ-OL-002) |

> **Note on OfferCard**: The existing `OfferCard` links to
> `/producto/{productSlug}`. For the landing page, we need cards that link to
> `/ofertas/{slug}`. Options: (a) add a `linkTarget` prop to `OfferCard`, (b)
> create a new `OfferCardLanding` variant, (c) use a wrapper component. Decision
> deferred to design phase.
