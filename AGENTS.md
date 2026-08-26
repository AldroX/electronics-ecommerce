# electronics-ecommerce

Astro 7 electronics e-commerce site. Early stage — starter template, no frameworks integrated yet.

## Project context

Full product spec lives in `prompt.md` (802 lines, 29 sections). Read it before any feature work.

**Business model**: NOT a traditional cart-based store. It's a digital commercial system:

```
Social media → Ecommerce → WhatsApp → Sale
```

WhatsApp is the primary CTA on every product, every page. There is no checkout flow, no user accounts, no cart.

**Target audience**: Homes and small businesses needing backup power, solar, efficient lighting. Users are non-technical — explain jargon (MPPT, Wh, LiFePO4) in plain language.

**Performance constraint**: Target audience may have connections <1 Mbps. This is non-negotiable and affects every implementation decision:
- Astro static generation preferred
- Zero framework JS for content rendering
- WebP/AVIF images, lazy loading, responsive sizes
- No heavy sliders, background videos, or costly animations
- No unnecessary dependencies

**Mobile-first**: Design for 360px → 390px → 430px first, then tablet/desktop. Touch targets must be large enough.

**Tech stack** (from prompt.md §29): Astro 7 + TypeScript + Tailwind CSS 4 (`@tailwindcss/vite`).

**Data layer**: Static initially. Architecture must support future evolution (visits, WhatsApp clicks, conversions, margins). Do not hardcode product data into components — prepare a data structure that can be swapped later.

**Planned routes** (12+):
- `/` — Home (hero, categories, solutions, featured, best sellers, offers, kits)
- `/productos` — Catalog with search, filters, sort
- `/producto/[slug]` — Product detail (images, specs, "what can it power", related)
- `/soluciones` and `/soluciones/[slug]` — Solution-oriented landing pages
- `/kits` — Bundle pages
- `/ofertas` — Weekly offers (direct-link destination from social posts)
- `/guias` and `/guias/[slug]` — Educational content + SEO
- `/faq` — Frequently asked questions
- `/categoria/[slug]` — Category pages

**Reusable components** (13+): Header, Footer, ProductCard, CategoryCard, SolutionCard, ProductGrid, CTAWhatsApp, OfferCard, KitCard, FAQ, Testimonial, ProductSpecs, RelatedProducts.

**URL design**: Clean, SEO-friendly, direct-linkable from social posts. Example: `/soluciones/respaldo-hogar`, `/ofertas`.

**SEO from day one**: schema.org Product structured data, Open Graph, sitemap, robots.txt, optimized images, indexable pages.

## Runtime

- **Node >=22.12.0** (enforced in `package.json` engines)
- **pnpm** — do not use npm or yarn
- **Astro 7.2.7** — current version

## Commands

| Command | What it does |
|---|---|
| `pnpm dev` | Dev server at `localhost:4321` |
| `pnpm build` | Production build to `./dist/` |
| `pnpm preview` | Preview the built site locally |
| `pnpm astro check` | Type checking (Astro's built-in) |

**No linting, formatting, or test framework is installed.** Do not run `eslint`, `prettier`, `vitest`, or similar — they will fail. If validation is needed, `pnpm astro check` is the only available step.

## TypeScript

Extends `astro/tsconfigs/strict`. Auto-generated types live in `.astro/types.d.ts` — do not hand-edit.

## Project structure

```
src/
  pages/          → routes (index.astro is the only page)
  components/     → .astro components (Welcome.astro)
  layouts/        → Layout.astro (HTML shell)
  assets/         → images/SVGs imported in components
public/           → static assets served as-is
```

## pnpm quirks

`pnpm-workspace.yaml` explicitly allows builds for `esbuild` and `sharp`. The `allowScripts` field in `package.json` mirrors the esbuild entry. Do not remove these without understanding the pnpm build-allowlist behavior.

`astro@7.2.7` is excluded from `minimumReleaseAge` — this is intentional for the current version pin.

## Design reference: storeplate

Design patterns to follow from `C:\Users\Alejandro\Projects\storeplate` (Astro 7 + Tailwind 4 + TypeScript). Do NOT copy storeplate's Shopify/cart/React code — only adopt the CSS architecture, theme system, and layout patterns.

### Theme system (JSON → CSS variables)

Storeplate uses a JSON-driven theme that generates CSS variables at build time:

- `src/config/theme.json` — colors (light + dark), fonts, font sizes with modular scale
- `scripts/themeGenerator.js` — reads `theme.json`, writes `src/styles/generated-theme.css`
- `src/styles/generated-theme.css` — auto-generated `@theme` block with `--color-*`, `--font-*`, `--text-*` variables
- **Never edit `generated-theme.css` manually** — edit `theme.json` and re-run the generator

For electronics-ecommerce: adapt this pattern. Define colors in `theme.json` (green energy, dark blue, white, gray, yellow accents per prompt.md §21). Generate CSS variables. Use them via Tailwind's `text-primary`, `bg-body`, etc.

### CSS architecture (Tailwind 4 modular)

```
src/styles/
  main.css              → entry: @import "tailwindcss", plugins, imports below
  generated-theme.css   → auto-generated from theme.json (DO NOT EDIT)
  base.css              → @layer base: html, body, headings, typography
  components.css        → @layer components: section, container, forms, accordion, tabs
  navigation.css        → @layer components: header, navbar, nav-link, dropdown
  buttons.css           → @layer components: .btn, .btn-primary, .btn-outline-primary
  utilities.css         → custom utilities: btn-sm/md/lg, section-sm, form-input
  safe.css              → browser quirks: autofill, swiper, navbar toggler
```

Key patterns:
- `.container` → `mx-auto !max-w-[1320px] px-4`
- `.section` → `py-14 xl:py-28`
- `.btn` → `inline-block rounded-md border border-transparent px-5 py-2 font-semibold transition cursor-pointer`
- Dark mode: `@custom-variant dark (&:where(.dark, .dark *))` — class-based, not system preference
- Font loading: `astro-font` package with Google Fonts URL, CSS variables `--font-primary`, `--font-secondary`

### Layout structure

```
src/layouts/
  Base.astro              → HTML shell: <head> (SEO, fonts, OG), <body> (Header + slot + Footer)
  partials/
    Header.astro          → sticky header, sidebar nav (mobile), search, theme switcher
    Footer.astro          → logo, nav links, social icons, copyright
    PageHeader.astro      → page title + breadcrumbs
  components/
    Logo.astro, Price.astro, Breadcrumbs.astro, Pagination.astro, etc.
  shortcodes/             → MDX shortcodes (Accordion, Button, Tabs, Video) — React components
  functional-components/  → interactive React components (SearchBar, Cart, NavUser)
  helpers/                → helper components (Announcement, DynamicIcon)
```

### Component patterns

- **ProductCard**: responsive grid (`col-6 md:col-4 lg:col-3`), image with hover CTA overlay, price with compare-at strikethrough
- **Header**: sticky, shadow on scroll, sidebar nav for mobile with overlay, submenu toggles
- **Footer**: light background, logo + nav + social icons, copyright bar with border-top
- **Buttons**: `.btn-primary` (filled), `.btn-outline-primary` (border only), sizes via `btn-sm`/`btn-lg`

### Config system (JSON-based)

```
src/config/
  config.json    → site settings (title, favicon, logo, announcement, features)
  theme.json     → colors, fonts, font sizes
  menu.json      → navigation structure (main, footer, footerCopyright)
  social.json    → social media links
```

### TypeScript path aliases

```json
{
  "@/components/*": ["./src/layouts/components/*"],
  "@/partials/*": ["./src/layouts/partials/*"],
  "@/shortcodes/*": ["./src/layouts/shortcodes/*"],
  "@/helpers/*": ["./src/layouts/helpers/*"],
  "@/*": ["./src/*"]
}
```

### What NOT to copy from storeplate

- Shopify integration, cart system, React state management (nanostores)
- `@astrojs/react` — we want zero framework JS unless explicitly needed
- Swiper/carousel libraries — performance budget forbids heavy sliders
- Server-side rendering (`output: "server"`) — we want static generation
- Netlify adapter — deployment target TBD

## Gotchas

- Astro components use the `.astro` extension and frontmatter fences (`---`). They are not JSX.
- Assets imported in frontmatter use `.src` (e.g., `import img from './file.svg'; <img src={img.src} />`).
- The `dist/` output directory is gitignored by default.
- Do not add heavy JS frameworks (React, Vue) unless explicitly requested — performance budget is <1 Mbps initial load.
- Product data must stay in a swappable data layer, not hardcoded in components.
- WhatsApp CTA needs a pre-filled contextual message per product: `"Hola, estoy interesado en [PRODUCTO]. ¿Está disponible?"`.
