# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary: homeowners and small business owners in Cuba who need backup power,
solar energy solutions, or efficient lighting. They are non-technical buyers —
often discovering products through social media (Facebook, Instagram) and
completing purchases via WhatsApp. They may have limited internet connectivity
(<1 Mbps) and are primarily mobile users (360–430px screens).

Secondary: people experiencing power outages who need immediate solutions
(lighting, small device power), and early-stage solar adopters looking for
starter kits.

## Product Purpose

A digital commercial system that connects social media discovery to
WhatsApp-based sales. The ecommerce is NOT a traditional cart-based store — it
is a product showcase and conversion engine where WhatsApp is the primary CTA on
every page, every product, every card.

Success = a visitor lands from a social post, understands what problem a product
solves, sees price and availability, and contacts via WhatsApp to complete the
purchase.

## Positioning

"Aquí encuentro una solución para mi problema energético" — not "aquí venden
productos eléctricos."

The product mechanism: solutions-oriented browsing (not just product catalog).
Users describe their problem ("necesito respaldo para mi hogar") and the site
guides them to the right products or kits. This positions the store as a helpful
energy advisor, not a generic retailer.

## Operating Context

- **Social → Ecommerce → WhatsApp → Sale → Data**: the full business loop.
  Facebook/Instagram posts link directly to product pages, solution pages, or
  `/ofertas`. WhatsApp carries the transaction.
- **No checkout, no cart, no user accounts**: the entire purchase flow happens
  outside the site (WhatsApp conversation + manual payment).
- **Direct-linkable URLs**: every page must be a valid landing destination from
  a social post. Example: `/soluciones/respaldo-hogar`, `/ofertas`,
  `/producto/power-station-500w`.
- **Static-first architecture**: product data is static initially but the data
  structure must support future evolution (visits, WhatsApp clicks, conversions,
  margins, demand).
- **Performance as survival**: target audience may have connections <1 Mbps.
  Static generation, zero framework JS for content, WebP/AVIF images, lazy
  loading, no heavy sliders or animations.

## Capabilities and Constraints

- **12+ planned routes**: Home, `/productos`, `/producto/[slug]`, `/soluciones`,
  `/soluciones/[slug]`, `/kits`, `/ofertas`, `/guias`, `/guias/[slug]`, `/faq`,
  `/categoria/[slug]`.
- **13+ reusable components**: Header, Footer, ProductCard, CategoryCard,
  SolutionCard, ProductGrid, CTAWhatsApp, OfferCard, KitCard, FAQ, Testimonial,
  ProductSpecs, RelatedProducts.
- **4 product categories**: Solar Energy, Backup & Storage, Lighting,
  Accessories.
- **5 solution paths**: Home backup, Lighting during outages, Start with solar,
  Power small devices, Reduce energy consumption.
- **Educational content** (`/guias`): guides that link to related products,
  serving both user education and SEO.
- **Weekly offers** (`/ofertas`): visually differentiated, direct-link
  destination from social posts, with original price, current price, discount,
  and WhatsApp CTA.
- **Bundled kits**: pre-configured product bundles that solve complete needs (so
  users don't have to understand individual components).
- **WhatsApp contextual CTA**: each product generates a pre-filled message:
  "Hola, estoy interesado en [PRODUCTO]. ¿Está disponible?"
- **SEO from day one**: schema.org Product structured data, Open Graph, sitemap,
  robots.txt, optimized images, indexable pages.
- **Technical terms must be explained**: MPPT, Wh, Ah, LiFePO4, etc. get
  plain-language explanations alongside them.

## Brand Commitments

Brand name and visual identity assets to be provided. Voice: modern,
trustworthy, approachable — not corporate, not industrial. The feel should
communicate "energy solutions provider" not "electrical equipment store."

## Evidence on Hand

- `prompt.md` (802 lines, 29 sections) — comprehensive product spec with
  detailed page descriptions, component lists, user journey, and visual
  direction.
- Starter Astro 7 template (default Welcome page, no real content yet).
- Design reference project: `C:\Users\Alejandro\Projects\storeplate` (Astro 7 +
  Tailwind 4 + TypeScript) — CSS architecture, theme system, layout patterns to
  adapt (not copy Shopify/cart/React code).
- No product images, no brand assets, no real product data yet.

## Product Principles

1. **WhatsApp is the conversion mechanism**: every design decision should reduce
   friction to WhatsApp contact, not increase it.
2. **Performance is non-negotiable**: the target audience's connection speed is
   a hard constraint, not a nice-to-have. Every kilobyte matters.
3. **Solutions over products**: guide users by their problem, not by product
   taxonomy. A user who doesn't know what they need should find answers, not a
   search bar.
4. **Mobile-first is the only layout**: design for 360px → 390px → 430px first.
   Desktop is an enhancement, not the default.
5. **Static data, evolving architecture**: build for today's static content but
   design data structures that can support analytics tomorrow.

## Accessibility & Inclusion

No specific accessibility requirements established yet. General web
accessibility (semantic HTML, keyboard navigation, alt text, sufficient
contrast) should be followed as baseline.
