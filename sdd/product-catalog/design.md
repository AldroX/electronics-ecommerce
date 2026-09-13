# Product Catalog — Technical Design

## Change Overview

- **Change name**: `product-catalog`
- **Scope**: Two new static routes — `/productos` (catalog with
  filters/sort/pagination) and `/producto/[slug]` (detail page with gallery,
  specs, power calculator, related products, WhatsApp CTA, SEO)
- **Business model alignment**: WhatsApp is the primary CTA on every product; no
  cart, no checkout, no auth

---

## Architecture Decisions

| Decision                  | Choice                                                                   | Alternatives                               | Rationale                                                                            |
| ------------------------- | ------------------------------------------------------------------------ | ------------------------------------------ | ------------------------------------------------------------------------------------ |
| Catalog generation        | Static pagination via `Astro.paginate()` (12/page)                       | Client-only, server params                 | SEO-friendly URLs, zero JS for pagination, instant filter per page, <1 Mbps friendly |
| Product detail generation | Static via `getStaticPaths()` (all products)                             | SSR, hybrid                                | Full SEO, instant loads, 8 products = trivial build time                             |
| Filter/search             | Client-side vanilla JS module (`<script is:inline>`)                     | Server params, Alpine/HTMX                 | Single build page, instant after load, ~2KB gzipped, no framework                    |
| Image optimization        | `astro:assets` `Picture` (reuse existing pattern in ProductCard)         | Raw `<img>`, `@astrojs/image` (deprecated) | Consistent, build-time WebP/AVIF, responsive widths/sizes                            |
| WhatsApp message          | `product.whatsappMessage` from data (already contextual per product)     | Template interpolation                     | Already contains product name; no extra logic needed                                 |
| PowerCalculator           | Vanilla JS: battery Wh → hours for presets (router, laptop, fan, lights) | Solar input, custom loads                  | Simpler, matches product data (battery Wh field), explains jargon in plain language  |

---

## Data Flow

```
products.json
    │
    ▼
src/data/helpers/products.ts ──► filterProducts(), sortProducts(), paginateProducts()
    │
    ├──► /productos.astro (Astro.paginate 12/page)
    │       ├── Hero
    │       ├── ProductFilters (category, price, availability)
    │       ├── ProductSort (price↑/↓, name, newest)
    │       ├── ProductGrid (ProductCard × 12)
    │       └── Pagination (static links)
    │
    └──► /producto/[slug].astro (getStaticPaths all products)
            ├── Breadcrumbs + BreadcrumbList JSON-LD
            ├── ProductGallery (main + thumbnails, astro:assets Picture)
            ├── ProductSpecs (specs table from product.specs)
            ├── PowerCalculator (vanilla JS: Wh → runtime cards)
            ├── CTAWhatsApp (inline + floating, uses product.whatsappMessage)
            ├── RelatedProducts (ProductCard grid, 4 from same category, exclude self)
            └── Product JSON-LD (schema.org Product)
```

---

## File Changes

| File                                           | Action | Description                                                       |
| ---------------------------------------------- | ------ | ----------------------------------------------------------------- |
| `src/pages/productos.astro`                    | Create | Catalog page: Hero + Filters + Sort + Paginated ProductGrid       |
| `src/pages/producto/[slug].astro`              | Create | Detail page: Gallery + Specs + Calculator + Related + SEO         |
| `src/components/product/ProductGallery.astro`  | Create | Main image + thumbnails, lazy, WebP/AVIF, vanilla JS swap         |
| `src/components/product/ProductSpecs.astro`    | Create | Table from `product.specs` Record                                 |
| `src/components/product/PowerCalculator.astro` | Create | Vanilla JS: Wh → runtime cards (router, laptop, fan, lights)      |
| `src/components/product/RelatedProducts.astro` | Create | Grid of 4 ProductCards from same category (exclude self)          |
| `src/components/product/Breadcrumbs.astro`     | Create | Home > Category > Product + BreadcrumbList JSON-LD                |
| `src/components/cards/ProductFilters.astro`    | Create | Category checkboxes, price range inputs, availability radios      |
| `src/components/cards/ProductSort.astro`       | Create | Select: price↑, price↓, name, newest                              |
| `src/components/cards/Pagination.astro`        | Create | Prev/Next + page numbers, static links                            |
| `src/data/helpers/products.ts`                 | Modify | Add `filterProducts`, `sortProducts`, `paginateProducts`          |
| `src/layouts/Base.astro`                       | Modify | Add Product JSON-LD support (new props: `product`, `breadcrumbs`) |

---

## Interfaces / Contracts

### ProductFilters state (client-side)

```typescript
interface FilterState {
  search: string;
  categories: string[];
  priceMin: number;
  priceMax: number;
  availability: ('in-stock' | 'limited' | 'out-of-stock')[];
}
```

### PowerCalculator output

```typescript
interface RuntimeEstimate {
  load: string; // "Router (5W)", "Laptop (65W)", "Fan (25W)", "Lights (10W)"
  hours: number; // batteryWh / loadW (integer, rounded down)
}
```

### Product JSON-LD (extends Base.astro schema)

```typescript
interface ProductSchema {
  '@type': 'Product';
  name: string;
  description: string;
  image: string[];
  sku: string; // product.id
  brand: { '@type': 'Brand'; name: string };
  offers: {
    '@type': 'Offer';
    price: number;
    priceCurrency: 'USD';
    availability: 'InStock' | 'LimitedAvailability' | 'OutOfStock';
    url: string;
  };
}
```

### Breadcrumbs JSON-LD

```typescript
interface BreadcrumbListSchema {
  '@type': 'BreadcrumbList';
  itemListElement: Array<{
    '@type': 'ListItem';
    position: number;
    name: string;
    item: string;
  }>;
}
```

---

## Component Contracts

### `ProductGallery.astro`

**Props**: `images: string[]`, `productName: string`

- Main image: `astro:assets` `Picture`, eager load, WebP/AVIF, responsive widths
- Thumbnails: lazy, click → swap main (vanilla JS, no framework)
- Fallback: `onerror` → `/images/placeholder-product.svg`

### `ProductSpecs.astro`

**Props**: `specs: Record<string, string>`

- Renders `<dl>` / `<table>` with Spanish labels from data
- No logic — pure presentation

### `PowerCalculator.astro`

**Props**: `batteryWh: number`

- Static presets:
  `[{load: "Router (5W)", watts: 5}, {load: "Laptop (65W)", watts: 65}, {load: "Fan (25W)", watts: 25}, {load: "Lights (10W)", watts: 10}]`
- Vanilla JS: `hours = Math.floor(batteryWh / watts)`
- Displays as cards: "Router (5W) → ~200h"

### `RelatedProducts.astro`

**Props**: `product: Product`, `allProducts: Product[]`

- Filters: same category, exclude self, limit 4
- Renders `ProductCard` grid (reuses existing component)

### `Breadcrumbs.astro`

**Props**: `product: Product`, `categories: Category[]`

- Builds: Home → Category → Product
- Injects BreadcrumbList JSON-LD

### `ProductFilters.astro`

**Props**: `categories: Category[]`

- Checkbox group: category
- Number inputs: price min/max
- Radio group: availability (in-stock, limited, out-of-stock)
- Emits custom event `filters-change` with `FilterState`

### `ProductSort.astro`

**Props**: none (self-contained)

- Select options: "price-asc", "price-desc", "name-asc", "newest"
- Emits custom event `sort-change` with sort key

### `Pagination.astro`

**Props**: `pagination: Astro.Pagination`

- Renders Prev/Next + page numbers as static `<a>` links
- Uses `pagination.page`, `pagination.totalPages`, `pagination.next`,
  `pagination.prev`

---

## Testing Strategy

| Layer       | What                                                                | Approach                                                            |
| ----------- | ------------------------------------------------------------------- | ------------------------------------------------------------------- |
| Unit        | `filterProducts`, `sortProducts`, `paginateProducts`                | Manual verification via `pnpm dev` + console; Vitest if added later |
| Integration | Catalog page renders, filters work, sort works, pagination works    | `pnpm build` + visual check in preview                              |
| Integration | Detail page all sections render, gallery swaps, calculator computes | `pnpm build` + visual check                                         |
| E2E         | WhatsApp CTA message correctness (product name in URL)              | Manual: click → verify `wa.me` URL contains product name            |
| SEO         | Product JSON-LD validates, Breadcrumbs JSON-LD validates            | Rich Results Test on built HTML (`dist/`)                           |

---

## Threat Matrix

N/A — no routing, shell, subprocess, VCS/PR automation, or executable-file
classification boundary in this change.

---

## Migration / Rollout

No migration required. New routes added alongside existing. No breaking changes
to existing pages or components.

---

## Open Questions

1. **Product image paths in data**: Currently `/images/placeholder-*.webp`
   (404→onerror). Switch to `src/assets/` imports for real WebP/AVIF via
   `astro:assets`?
2. **Category filter pills vs checkboxes UX**: Desktop — pills, Mobile —
   accordion? (Tailwind responsive variant)

---

## Engram Persistence

Saved as `sdd/product-catalog/design` with
`topic_key: sdd/product-catalog/design`, type: `architecture`,
`capture_prompt: false`.
