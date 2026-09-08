# Delta Spec: ofertas-detail

**Change**: `ofertas-pages`  
**Domain**: `ofertas-detail` (NEW)  
**Status**: Draft

---

## Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| REQ-OD-001 | Route `/ofertas/[slug]` MUST render detail page for each offer via `getStaticPaths` using `getAllOffers()` | P0 |
| REQ-OD-002 | Page MUST display offer `name` as `<h1>` | P0 |
| REQ-OD-003 | Page MUST display offer `description` | P0 |
| REQ-OD-004 | Page MUST display offer `image` (responsive, WebP/AVIF, lazy-loaded) | P0 |
| REQ-OD-005 | Page MUST show price breakdown: original price (strikethrough), current price (prominent, primary color), discount badge (`-{discountPercent}%`) | P0 |
| REQ-OD-006 | Page MUST show availability badge (in-stock/limited/out-of-stock with appropriate colors) | P0 |
| REQ-OD-007 | Page MUST show `validUntil` formatted as "Válido hasta DD/MM" | P0 |
| REQ-OD-008 | Page MUST link to full product at `/producto/{productSlug}` with label "Ver producto completo" | P0 |
| REQ-OD-009 | Page MUST include inline `CTAWhatsApp` with contextual message from `offer.whatsappMessage` (interpolated with `{PRODUCTO}` → `offer.name`) | P0 |
| REQ-OD-010 | Page MUST include breadcrumbs: `Inicio → Ofertas → {offer.name}` (with `Inicio` linking to `/`, `Ofertas` linking to `/ofertas`) | P0 |
| REQ-OD-011 | SEO MUST use `offer.seo` fields: `title`, `description`, `image`, `canonical` (if provided) | P0 |
| REQ-OD-012 | When offer is `out-of-stock`, WhatsApp CTA MUST be hidden (consistent with `OfferCard` behavior) | P0 |
| REQ-OD-013 | Page MUST include schema.org `Product` JSON-LD with offer pricing and availability | P0 |
| REQ-OD-014 | Page MUST include schema.org `BreadcrumbList` JSON-LD | P0 |
| REQ-OD-015 | Zero framework JS — static generation only | P0 |

---

## Scenarios

| ID | Given | When | Then |
|----|-------|------|------|
| SCN-OD-001 | 4 offers exist in `ofertas.json` (3 active, 1 out-of-stock) | Build runs | `getStaticPaths` generates 4 routes: `/ofertas/oferta-panel-solar-450w`, `/ofertas/oferta-power-station-1000wh`, `/ofertas/oferta-kit-iluminacion-solar`, `/ofertas/oferta-bateria-lifepo4-100ah` |
| SCN-OD-002 | User visits `/ofertas/oferta-panel-solar-450w` (active, in-stock) | Page renders | `<h1>` = "Panel Solar 450W Monocristalino", description visible, image shown, price breakdown with $189.99 current / $229.99 original, -17% badge, "Disponible" badge, "Válido hasta 15/09", WhatsApp CTA visible with message "Hola, estoy interesado en la oferta de Panel Solar 450W Monocristalino. ¿Está disponible?", link to `/producto/panel-solar-450w-monocristalino` |
| SCN-OD-003 | User visits `/ofertas/oferta-bateria-lifepo4-100ah` (out-of-stock) | Page renders | "Agotado" badge shown, WhatsApp CTA hidden, price breakdown still visible |
| SCN-OD-004 | User visits `/ofertas/oferta-kit-iluminacion-solar` (limited) | Page renders | "Pocas unidades" badge shown (amber), WhatsApp CTA visible |
| SCN-OD-005 | SEO audit runs on detail page | Page analyzed | Title = `offer.seo.title`, description = `offer.seo.description`, og:image = `offer.seo.image`, canonical = `offer.seo.canonical` or `https://energiatotal.cu/ofertas/{slug}`, Product JSON-LD with correct price/availability, BreadcrumbList with 3 items |
| SCN-OD-006 | User clicks "Ver producto completo" link | Navigation occurs | User lands on `/producto/{productSlug}` |
| SCN-OD-007 | User clicks WhatsApp CTA | New tab opens | WhatsApp Web opens with pre-filled message containing offer name |
| SCN-OD-008 | Invalid slug requested (e.g., `/ofertas/inexistente`) | Page renders | 404 (Astro default) — no route matches because `getStaticPaths` only returns known slugs |

---

## Acceptance Criteria

- [ ] All 4 offer detail pages generate at build time
- [ ] Each page shows correct offer data (name, description, image, prices, badges, validUntil)
- [ ] WhatsApp CTA uses `offer.whatsappMessage` with `{PRODUCTO}` interpolated
- [ ] WhatsApp CTA hidden for `out-of-stock` offers
- [ ] Link to full product works correctly
- [ ] Breadcrumbs: `Inicio → Ofertas → {offer.name}`
- [ ] SEO: title, description, image, canonical from `offer.seo`
- [ ] schema.org Product JSON-LD with correct offer data
- [ ] schema.org BreadcrumbList JSON-LD
- [ ] Responsive image with lazy loading
- [ ] Zero framework JS

---

## Files to Create / Modify

| File | Action |
|------|--------|
| `src/pages/ofertas/[slug].astro` | **CREATE** — Detail page route with `getStaticPaths` |
| `src/data/helpers/offers.ts` | No change (already exports `getAllOffers`, `getOfferBySlug`) |
| `src/components/ui/CTAWhatsApp.astro` | No change (reuse existing component) |
| `src/components/product/Breadcrumbs.astro` | No change (reuse, pass breadcrumb items) |

---

## Data Mapping (Offer → Product JSON-LD)

| Product JSON-LD Field | Source |
|----------------------|--------|
| `name` | `offer.name` |
| `description` | `offer.description` |
| `image` | `offer.image` (absolute URL via `config.site.base_url`) |
| `sku` | `offer.id` |
| `offers.price` | `offer.currentPrice` |
| `offers.priceCurrency` | `offer.currency` |
| `offers.availability` | Map `offer.availability` to schema.org URL (same as Product) |
| `offers.url` | `https://energiatotal.cu/ofertas/{offer.slug}` |

> **Note**: The offer is a promotional price on a product. The Product JSON-LD represents the *offer itself* as a Product with its promotional price, not the base product. This is appropriate for offer detail pages.