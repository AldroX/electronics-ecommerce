# SDD Design: seo-assets

**Change**: Add sitemap.xml, robots.txt, and real WebP/AVIF image optimization via `astro:assets`

---

## Context

The `home-page` verify report identified two SEO gaps:
1. **No sitemap.xml / robots.txt** — search engines lack a structured crawl map
2. **Image variants missing** — product/category images reference `.webp` paths that 404; fallback uses `onerror` → `.svg`. Real WebP/AVIF with `srcset` per breakpoint is not implemented.

This design addresses both using Astro's built-in capabilities.

---

## Architecture Decisions

| Option | Tradeoff | Decision |
|--------|----------|----------|
| `@astrojs/image` (npm) | Deprecated since Astro v3; no longer maintained | **REJECT** |
| `astro:assets` `Picture` (built-in) | Build-time only, requires import paths | **ADOPT** for importable images |
| Raw `<img>` with `onerror` | Runtime fallback for missing/placeholder images | **KEEP** for placeholder/missing case |

### Rationale

- **`astro:assets`** is the modern, built-in image optimization in Astro v3+. It transforms imported images at build time, generating WebP/AVIF variants and `srcset` automatically.
- **Data layer constraint**: `products.json` and `categories.json` reference public paths like `/images/placeholder-product.webp` that don't exist as files. These are placeholders. `astro:assets` works with **import paths** (e.g., `import img from '@/assets/product.jpg'`), not public URLs.
- **Hybrid approach**: Use `Picture` for real product images (when we have actual source files in `src/assets/`), keep raw `<img>` + `onerror` for the placeholder case.

---

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `astro.config.mjs` | Modify | Add `@astrojs/sitemap` integration, set `site: "https://energiatotal.cu"` |
| `package.json` | Modify | Add `@astrojs/sitemap` as devDependency |
| `src/components/cards/ProductCard.astro` | Modify | Conditional render: `Picture` for imported images, raw `<img>` + `onerror` for public-path placeholders |
| `src/components/cards/CategoryCard.astro` | Modify | Same pattern as ProductCard |
| `public/robots.txt` | Create | Static robots.txt (sitemap integration generates sitemap.xml automatically) |

---

## Detailed Implementation

### 1. `astro.config.mjs`

```javascript
// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from "@tailwindcss/vite";
import sitemap from "@astrojs/sitemap";

export default defineConfig({
  site: "https://energiatotal.cu",
  vite: {
    plugins: [tailwindcss()],
  },
  integrations: [sitemap()],
});
```

- `site` enables canonical URLs and sitemap generation
- `@astrojs/sitemap` runs at build time, outputs `dist/sitemap.xml`
- No route filtering needed initially — all routes are indexable

### 2. `package.json`

Add to `devDependencies`:
```json
"@astrojs/sitemap": "^3.2.1"
```

Run `pnpm install` after.

### 3. `public/robots.txt`

```text
User-agent: *
Allow: /

# Block admin/private areas (future-proofing)
Disallow: /admin/
Disallow: /api/
Disallow: /private/

Sitemap: https://energiatotal.cu/sitemap.xml
```

### 4. `ProductCard.astro` — Hybrid Image Rendering

The component receives `product.images` as public URL strings (e.g., `["/images/placeholder-product.webp"]`). We need to distinguish:

- **Importable image**: File exists in `src/assets/` → use `Picture`
- **Placeholder/public URL**: No source file → use raw `<img>` with `onerror`

```astro
---
import type { Product } from "@/data/types";
import CTAWhatsApp from "../ui/CTAWhatsApp.astro";
import { Picture } from "astro:assets";

// Helper: check if an image path is an importable asset (in src/assets)
// vs a public/ placeholder. In the future, real products will use imports.
function isImportableImage(path: string): boolean {
  return path.startsWith("@/assets/") || path.startsWith("../assets/");
}

export interface Props {
  product: Product;
  priority?: boolean;
}

const { product, priority = false } = Astro.props;

const PLACEHOLDER = "/images/placeholder-product.svg";
const primaryPublic = product.images[0] ?? PLACEHOLDER;
const hasImages = product.images.length > 0;

// Try to resolve as importable asset (future: real product images in src/assets)
const primaryImportPath = hasImages && isImportableImage(product.images[0])
  ? product.images[0]
  : null;

const imageAlt = hasImages ? product.name : `Imagen no disponible para ${product.name}`;

// Availability badge (unchanged)
const availabilityMap = {
  "in-stock": { label: "Disponible", class: "bg-emerald-100 text-emerald-700" },
  limited: { label: "Pocas unidades", class: "bg-amber-100 text-amber-700" },
  "out-of-stock": { label: "Agotado", class: "bg-red-100 text-red-700" },
} as const;
const stockKey = product.availability as keyof typeof availabilityMap;
const badge = availabilityMap[stockKey] ?? availabilityMap["in-stock"];

const isOutOfStock = product.availability === "out-of-stock";
const whatsappMessage = isOutOfStock
  ? `${product.whatsappMessage} (Producto agotado, consultar reposición)`
  : undefined;

const formatter = new Intl.NumberFormat("es", {
  style: "currency",
  currency: product.currency,
});
const showCompareAt = Boolean(
  product.compareAtPrice && product.compareAtPrice > product.price
);
const price = formatter.format(product.price);
const compareAt = showCompareAt ? formatter.format(product.compareAtPrice!) : null;
---

<a
  href={`/producto/${product.slug}`}
  class="group flex h-full flex-col overflow-hidden rounded-lg border border-border bg-white shadow transition hover:shadow-lg scroll-mt-24 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
  aria-label={`Ver ${product.name}`}
>
  <div class="relative aspect-[4/3] w-full overflow-hidden bg-light">
    {primaryImportPath && (
      <!-- Real asset: use astro:assets Picture for WebP/AVIF + srcset -->
      <Picture
        src={import.meta.glob('@/assets/**/*', { eager: true })[primaryImportPath]?.default ?? import(primaryImportPath)}
        alt={imageAlt}
        loading={priority ? "eager" : "lazy"}
        widths={[480, 640, 800]}
        sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
        formats={["avif", "webp"]}
        class="h-full w-full object-cover transition-transform duration-300 motion-safe:group-hover:scale-105"
      />
    )}
    {(!primaryImportPath || !hasImages) && (
      <!-- Placeholder/missing: raw img with onerror fallback -->
      <picture>
        <img
          src={primaryPublic}
          alt={imageAlt}
          loading={priority ? "eager" : "lazy"}
          width="400"
          height="300"
          decoding="async"
          class="h-full w-full object-cover transition-transform duration-300 motion-safe:group-hover:scale-105"
          onerror={`this.onerror=null;this.src='${PLACEHOLDER}';this.srcset='';this.alt='Imagen no disponible para ${product.name}';`}
        />
      </picture>
    )}
  </div>

  <div class="flex flex-1 flex-col gap-2 p-4">
    <span class={`inline-flex w-fit items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${badge.class}`}>
      {badge.label}
    </span>

    <h3 class="text-h6 font-bold leading-snug text-text-dark">{product.name}</h3>

    {product.shortDescription && (
      <p class="line-clamp-2 text-sm text-text-light">{product.shortDescription}</p>
    )}

    <div class="mt-auto flex items-baseline gap-2 pt-2">
      <span class="text-lg font-bold text-primary">{price}</span>
      {showCompareAt && (
        <span class="text-sm text-text-light line-through">{compareAt}</span>
      )}
    </div>

    <CTAWhatsApp variant="inline" productName={product.name} messageTemplate={whatsappMessage} class="mt-2" />
  </div>
</a>
```

**Note**: The `import.meta.glob` + dynamic import pattern works for Vite. A simpler approach for now: since all current images are placeholders, the `Picture` branch won't execute yet. When real product images are added to `src/assets/`, the data layer will switch to import paths (e.g., `@/assets/products/panel-solar-450w.jpg`), and the `Picture` branch activates automatically.

### 5. `CategoryCard.astro` — Same Pattern

```astro
---
import type { Category } from "@/data/types";
import { Picture } from "astro:assets";

function isImportableImage(path: string): boolean {
  return path.startsWith("@/assets/") || path.startsWith("../assets/");
}

export interface Props {
  category: Category;
}

const { category } = Astro.props;

const PLACEHOLDER = "/images/placeholder-category.svg";
const srcPublic = category.image?.trim() ? category.image : PLACEHOLDER;
const isImportable = isImportableImage(category.image ?? "");
const srcImport = isImportable ? category.image : null;
const imageAlt = srcPublic === PLACEHOLDER ? `Categoría: ${category.name}` : category.name;
---

<a
  href={`/categoria/${category.slug}`}
  class="group flex h-full flex-col items-center gap-3 rounded-lg border border-border bg-white p-6 text-center shadow transition hover:shadow-lg scroll-mt-24 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
  aria-label={`Ver categoría ${category.name}`}
>
  <picture class="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-light">
    {srcImport && (
      <Picture
        src={import.meta.glob('@/assets/**/*', { eager: true })[srcImport]?.default ?? import(srcImport)}
        alt={imageAlt}
        loading="lazy"
        widths={[96, 144, 192]}
        sizes="96px"
        formats={["avif", "webp"]}
        class="h-20 w-20 object-contain transition-transform duration-300 motion-safe:group-hover:scale-110"
      />
    )}
    {(!srcImport || !category.image?.trim()) && (
      <img
        src={srcPublic}
        alt={imageAlt}
        loading="lazy"
        width="96"
        height="96"
        decoding="async"
        class="h-20 w-20 object-contain transition-transform duration-300 motion-safe:group-hover:scale-110"
        onerror={`this.onerror=null;this.src='${PLACEHOLDER}';this.alt='Categoría: ${category.name}';`}
      />
    )}
  </picture>

  <h3 class="text-h6 font-bold leading-snug text-text-dark">{category.name}</h3>

  {category.description && (
    <p class="text-sm text-text-light">{category.description}</p>
  )}
</a>
```

---

## Data Layer Evolution (Future)

When real product images are available:

1. Add image files to `src/assets/products/` and `src/assets/categories/`
2. Update `products.json` / `categories.json` to use import paths:
   ```json
   "images": ["@/assets/products/panel-solar-450w.jpg"]
   ```
3. Update `types.ts` if needed (currently `images: string[]` supports both)
4. Components automatically switch to `Picture` branch — no component changes needed

---

## Acceptance Criteria

1. **Build succeeds**: `pnpm build` completes without errors
2. **Sitemap generated**: `dist/sitemap.xml` exists with all routes
3. **Robots.txt copied**: `dist/robots.txt` exists with correct content
4. **Images optimize**: When importable images exist, `Picture` generates WebP/AVIF + `srcset`
5. **Fallback works**: Placeholder images still render via `onerror` → SVG
6. **Type check passes**: `pnpm astro check` reports no errors

---

## Threat Matrix

| Threat | Mitigation |
|--------|------------|
| `@astrojs/sitemap` adds build time | Negligible for static site; runs once at build |
| `astro:assets` increases build memory | Acceptable for <50 product images; monitor |
| Dynamic import fails in Picture | Fallback branch handles missing imports gracefully |
| Public placeholder 404s in dev | `onerror` swaps to existing SVG placeholder |

---

## References

- [@astrojs/sitemap docs](https://docs.astro.build/en/guides/integrations-guide/sitemap/)
- [astro:assets Picture](https://docs.astro.build/en/guides/images/#the-picture-component)
- [Astro config `site` option](https://docs.astro.build/en/reference/configuration-reference/#site)