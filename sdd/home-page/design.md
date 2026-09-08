# Design: home-page

## Architecture Decisions

| Decision | Choice | Alternatives | Rationale |
|----------|--------|--------------|-----------|
| Component structure | Flat `src/components/` with subdirs (cards/, sections/, ui/) | Nested by feature/domain | Matches Storeplate reference + existing base-architecture; keeps imports clean |
| Data fetching | Static imports in frontmatter via helpers (`getFeaturedProducts()`, `getBestSellers()`) | Dynamic API calls / client-side fetch | Zero JS, build-time data, aligns with Astro SSG and <1Mbps target |
| Images | Placeholder WebP + responsive sizes via `<picture>` + `srcset` + `loading="lazy"` | Single `<img>` / no responsive sizes | Performance budget requires lazy loading, WebP/AVIF, responsive sizes for <1Mbps connections |
| WhatsApp template | `{product}` placeholder in `whatsapp.json`, interpolate in `CTAWhatsApp` | Hardcode in component / per-product field | Reusable, configurable, single source of truth for message format |
| Floating WhatsApp z-index | `z-40` (below sidebar z-50 / overlay z-40) | Higher z-index (z-50+) | Avoids conflicts with mobile sidebar (z-50) and overlay (z-40) from Header |
| SEO | schema.org `WebPage` + OG + Twitter Card + sitemap in `Base.astro` | Per-page SEO components | Already implemented in Base.astro; DRY, consistent across all routes |
| Empty states | Conditional render sections when `data.length > 0` | Always render sections with empty state UI | Avoids empty grids in DOM; simpler layout; matches spec REQ-HP-002 |

## Data Flow (ASCII)

```
Base.astro (slot)
  └─ index.astro
       ├─ HeroSection (CTAWhatsApp inline + FloatingWhatsApp)
       ├─ CategoriesSection → CategoryCard ×4
       ├─ FeaturedProducts → ProductCard ×4-8 (getFeaturedProducts)
       ├─ BestSellers → ProductCard ×3-4 (getBestSellers)
       └─ TrustSection (CTAWhatsApp inline + FloatingWhatsApp)

Data: src/data/*.json → helpers (products.ts, categories.ts) → frontmatter imports in sections
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/pages/index.astro` | MODIFY | Replace stub with 5 MVP sections using new components |
| `src/data/products.json` | MODIFY | Populate 8 products: 4 featured, 3 bestSeller, 2 with compareAtPrice |
| `src/data/categories.json` | MODIFY | Populate 4 categories with icons |
| `src/data/solutions.json` | MODIFY | Populate 5 minimal solutions (for future) |
| `src/data/kits.json` | MODIFY | Populate 3 minimal kits (for future) |
| `src/components/ui/CTAWhatsApp.astro` | CREATE | Reusable WhatsApp CTA (inline + floating variants) |
| `src/components/ui/FloatingWhatsApp.astro` | CREATE | Fixed bottom-right WhatsApp button |
| `src/components/cards/ProductCard.astro` | CREATE | Product display with image, price, compare-at, badge, WhatsApp CTA |
| `src/components/cards/CategoryCard.astro` | CREATE | Category navigation card with icon, name, description, link |
| `src/components/sections/HeroSection.astro` | CREATE | Hero with headline, subheadline, dual CTA, trust indicators |
| `src/components/sections/CategoriesSection.astro` | CREATE | Grid of 4 CategoryCards |
| `src/components/sections/FeaturedProducts.astro` | CREATE | Grid of ProductCards from getFeaturedProducts() |
| `src/components/sections/BestSellers.astro` | CREATE | Grid of ProductCards from getBestSellers() |
| `src/components/sections/TrustSection.astro` | CREATE | 4-6 trust indicators + WhatsApp CTA |
| `public/images/placeholder-product.webp` | CREATE | Placeholder for missing product images |
| `public/images/placeholder-category.webp` | CREATE | Placeholder for missing category images |
| `public/images/fallback.webp` | CREATE | Generic fallback for any missing image |

## Interfaces / Contracts

### Product (existing in `src/data/types.ts` — used as-is)
```typescript
interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  price: number;
  compareAtPrice?: number;
  currency: string;
  category: string;
  images: string[];
  specs: Record<string, string>;
  features: string[];
  availability: 'in-stock' | 'limited' | 'out-of-stock';
  featured: boolean;
  bestSeller: boolean;
  kitOnly: boolean;
  whatsappMessage: string;
  tags: string[];
  seo: SEOData;
  relatedProducts: string[];
}
```

### CTAWhatsApp Props
```typescript
interface CTAWhatsAppProps {
  variant: 'inline' | 'floating';
  productName?: string;           // for {product} interpolation
  messageTemplate?: string;       // override template from whatsapp.json
  class?: string;                 // additional Tailwind classes
}
```

### FloatingWhatsApp Props
```typescript
interface FloatingWhatsAppProps {
  // No props — reads whatsapp.json internally
}
```

### ProductCard Props
```typescript
interface ProductCardProps {
  product: Product;
  priority?: boolean;             // for above-fold images (Hero)
}
```

### CategoryCard Props
```typescript
interface CategoryCardProps {
  category: Category;
}
```

### Section Components
All section components (`HeroSection`, `CategoriesSection`, `FeaturedProducts`, `BestSellers`, `TrustSection`) accept **no props** — they load data internally via helpers in frontmatter.

## Testing Strategy

| Check | Command / Method |
|-------|------------------|
| Type safety | `pnpm astro check` — must pass with zero errors |
| Build | `pnpm build` — must produce static output to `dist/` |
| Responsive | Manual test at 360px, 390px, 430px, 768px, 1024px, 1280px |
| Touch targets | Verify all interactive elements ≥44×44 CSS pixels (DevTools) |
| WhatsApp links | Click each CTA → verify `wa.me` URL with correct encoded message |
| Performance | Lighthouse / DevTools network throttle to <1Mbps; verify Hero loads first, below-fold images lazy |
| Accessibility | Keyboard navigation (Tab), focus visible, heading hierarchy (h1 → h2 → h3), alt text on all images |
| SEO | View source → verify schema.org WebPage JSON-LD, OG tags, Twitter Card, canonical |

## Threat Matrix

| Threat | Applicable? | Notes |
|--------|-------------|-------|
| Routing/shell injection | No | No dynamic routes in this change |
| Subprocess execution | No | No shell commands in components |
| VCS boundary crossing | No | No git operations |
| XSS via user input | No | No user input on home page |
| SSRF / open redirect | No | WhatsApp URLs use fixed domain `wa.me` |

**Result**: N/A — no routing/shell/subprocess/VCS boundary in this change.

## Migration

- **None required**. This change creates a new home page that replaces the stub.
- Data files (`products.json`, `categories.json`, `solutions.json`, `kits.json`) are populated in the same commit.
- No existing pages, routes, or user data to migrate.

## Open Questions

- None. All decisions resolved in proposal and spec phases.

---
*Generated: 2026-08-27 | SDD Phase: DESIGN | Change: home-page | Approach: A (Full MVP Home)*