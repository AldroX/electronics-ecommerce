# Tasks: home-page

## Phase 1 — Data & Helpers (Foundation)

1.1 **Populate `src/data/products.json`** with 8 products: 4 `featured=true`, 3 `bestSeller=true`, 2 with `compareAtPrice > price`, varying `availability` states (in-stock, limited, out-of-stock). Validate against `Product` interface in `src/data/types.ts`.

1.2 **Populate `src/data/categories.json`** with 4 categories: `id`, `name`, `slug`, `description`, `icon` path. Match `Category` interface.

1.3 **Populate `src/data/solutions.json`** with 5 minimal solutions (for future `/soluciones` route). Minimal fields: `id`, `name`, `slug`, `shortDescription`.

1.4 **Populate `src/data/kits.json`** with 3 minimal kits (for future `/kits` route). Minimal fields: `id`, `name`, `slug`, `shortDescription`, `productIds[]`.

1.5 **Create `src/data/helpers/products.ts`** exporting `getFeaturedProducts()`, `getBestSellers()`, `getProductBySlug()` — static imports returning typed arrays from `products.json`.

1.6 **Create `src/data/helpers/categories.ts`** exporting `getAllCategories()` — static import returning typed array from `categories.json`.

1.7 **Create `src/config/whatsapp.json`** with `phoneNumber` and `templates: { productInquiry: "Hola, estoy interesado en {product}. ¿Está disponible?", generic: "Hola, estoy interesado en sus productos. ¿Está disponible?" }`.

## Phase 2 — Placeholder Images

2.1 **Create `public/images/placeholder-product.webp`** — generic product placeholder (400×400, WebP, <10KB).

2.2 **Create `public/images/placeholder-category.webp`** — generic category placeholder (400×300, WebP, <10KB).

2.3 **Create `public/images/fallback.webp`** — universal fallback (200×200, WebP, <5KB).

## Phase 3 — UI Components (Atoms)

3.1 **Create `src/components/ui/CTAWhatsApp.astro`** implementing `CTAWhatsAppProps` (variant: inline|floating, productName?, messageTemplate?, class?). Reads `whatsapp.json` in frontmatter. Inline: `<a href="wa.me/...">` with `target="_blank" rel="noopener noreferrer"`, `aria-label`, `:focus-visible` outline, 44×44px touch target. Floating: `fixed bottom-4 right-4 z-40`, same accessibility. Handles missing template → generic fallback. URL-encodes message.

3.2 **Create `src/components/ui/FloatingWhatsApp.astro`** — wrapper using `CTAWhatsApp` variant="floating" with no props. Adds `@media (prefers-reduced-motion: reduce)` to disable transitions.

## Phase 4 — Card Components (Molecules)

4.1 **Create `src/components/cards/ProductCard.astro`** implementing `ProductCardProps` ({ product: Product, priority?: boolean }). Renders: `<picture>` with responsive `srcset` (WebP/AVIF), `loading={priority ? 'eager' : 'lazy'}`, descriptive `alt`; `<h3>{product.name}</h3>`; conditional `shortDescription`; price + conditional `compareAtPrice` with strikethrough; availability badge (green/amber/red); `CTAWhatsApp` inline with `productName`. Missing image → `placeholder-product.webp` + fallback `alt`. Card wrapped in `<a href="/producto/{slug}">` for future route.

4.2 **Create `src/components/cards/CategoryCard.astro`** implementing `CategoryCardProps` ({ category: Category }). Renders: icon/image with `alt`; `<h3>{category.name}</h3>`; conditional description; wrapped in `<a href="/categoria/{slug}">` full-card link. Missing icon → `placeholder-category.webp`. Focus-visible outline, 44×44px touch target.

## Phase 5 — Section Components (Organisms)

5.1 **Create `src/components/sections/HeroSection.astro`** — no props. Loads data in frontmatter. Renders: `<section class="section">` with `.container`; `<h1>` headline; subheadline; dual CTA: primary `CTAWhatsApp` inline + `FloatingWhatsApp`; 4 trust indicators inline (shipping, warranty, support, secure payment). Above-fold images use `priority=true`.

5.2 **Create `src/components/sections/CategoriesSection.astro`** — no props. Calls `getAllCategories()`. Conditional render: `{categories.length > 0 && <section>...}`. `<h2>Categorías</h2>`; responsive grid `grid grid-cols-2 md:grid-cols-4 gap-6` with `CategoryCard` ×4.

5.3 **Create `src/components/sections/FeaturedProducts.astro`** — no props. Calls `getFeaturedProducts()`. Conditional render. `<h2>Destacados</h2>`; grid `grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6` with `ProductCard` ×4 (priority=false).

5.4 **Create `src/components/sections/BestSellers.astro`** — no props. Calls `getBestSellers()`. Conditional render. `<h2>Más Vendidos</h2>`; same grid pattern with `ProductCard` ×3.

5.5 **Create `src/components/sections/TrustSection.astro`** — no props. Renders 6 trust indicators (free shipping, 2-year warranty, tech support, secure payment, 30-day returns, free advice) as icon + text pairs. Includes `CTAWhatsApp` inline (generic template). `FloatingWhatsApp` rendered once globally (not per-section).

## Phase 6 — Page Assembly & SEO

6.1 **Modify `src/pages/index.astro`** — replace stub with: import all 5 sections; render in order: `HeroSection`, `CategoriesSection`, `FeaturedProducts`, `BestSellers`, `TrustSection`. Ensure single `<h1>` (from Hero), section `<h2>`s, card `<h3>`s. Verify `Base.astro` provides schema.org `WebPage` JSON-LD, OG/Twitter tags, canonical, sitemap entry.

6.2 **Verify `src/layouts/Base.astro`** includes all required SEO meta tags for home route (og:image should reference hero image or site logo).

## Phase 7 — Verification (Spec-Referenced)

7.1 **Type safety**: Run `pnpm astro check` — must pass zero errors. Validates REQ-HP-001, REQ-HP-003, REQ-CW-001–007, REQ-PC-001–007, REQ-CC-001–006.

7.2 **Build**: Run `pnpm build` — produces static `dist/`. Validates REQ-HP-001, REQ-HP-005 (zero framework JS).

7.3 **Responsive manual test**: View at 360px, 390px, 430px, 768px, 1024px, 1280px. Verify grid reflow, no horizontal scroll. Validates REQ-HP-006.

7.4 **Touch targets**: DevTools → inspect all interactive elements ≥44×44 CSS pixels. Validates REQ-HP-006, REQ-CW-006, REQ-PC-005, REQ-CC-003.

7.5 **WhatsApp links**: Click each CTA → verify `wa.me` URL with correct encoded message per SCN-CW-001, SCN-CW-004. Test floating button scroll behavior per SCN-CW-002.

7.6 **Performance simulation**: Throttle to <1Mbps (DevTools). Verify Hero loads first (eager), below-fold images lazy. Validates SCN-HP-004, REQ-HP-005.

7.7 **Accessibility audit**: Keyboard Tab navigation — focus visible on all links/buttons (WCAG 2.4.7). Heading hierarchy h1→h2→h3. All images have descriptive alt. Validates REQ-HP-003, REQ-CW-005, REQ-PC-002, REQ-CC-002, REQ-CC-006.

7.8 **SEO verification**: View source → confirm schema.org WebPage JSON-LD, og:title/description/image/type, twitter:card, canonical URL. Validates REQ-HP-004.

7.9 **Edge case — empty products**: Temporarily clear `featured`/`bestSeller` arrays → verify FeaturedProducts and BestSellers sections omitted (no empty containers). Validates SCN-HP-002.

7.10 **Edge case — missing images**: Reference non-existent image in product → verify placeholder displays with correct alt. Validates SCN-HP-003, SCN-PC-003, SCN-CC-002.

---

## Workload Forecast & Chained PR Recommendation

| Metric | Estimate |
|--------|----------|
| Files created/modified | 19 |
| New components | 9 |
| Data files populated | 4 |
| Placeholder images | 3 |
| Estimated lines of code | 500–900 |

**Chained PRs recommended: YES** — exceeds 400-line threshold.

### Work Units (for chained PRs)

| Work Unit | Tasks | Scope | Est. Lines |
|-----------|-------|-------|------------|
| WU-1: Data & Helpers | 1.1–1.7 | JSON data + helpers + whatsapp config | 150–250 |
| WU-2: Placeholders | 2.1–2.3 | 3 WebP images | binary |
| WU-3: UI Components | 3.1–3.2 | CTAWhatsApp, FloatingWhatsApp | 80–120 |
| WU-4: Card Components | 4.1–4.2 | ProductCard, CategoryCard | 100–150 |
| WU-5: Sections + Page | 5.1–6.2 | 5 sections + index.astro + SEO verify | 150–250 |
| WU-6: Verification | 7.1–7.10 | All spec scenarios | — |

Each work unit = one commit. PR chain: WU-1 → WU-2 → WU-3 → WU-4 → WU-5 → WU-6.