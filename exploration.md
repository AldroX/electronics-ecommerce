# Exploration: Admin Product CRUD UI

## Current State

### Data Layer
- **Products**: Stored in Supabase `products` table with 30+ fields (name, slug, description, price, specs, features, images[], availability, featured, bestSeller, kitOnly, whatsappMessage, tags, SEO fields, relatedProductIds, batteryWh)
- **Categories**: Separate `categories` table, linked via `category_id` on products
- **Static fallback**: `src/data/products.json` + `src/data/helpers/products.ts` for static generation (but admin API uses Supabase directly)
- **Validation**: Zod schemas in `src/lib/api/validation.ts` (`ProductCreateSchema`, `ProductUpdateSchema`)

### Admin API Endpoints (Existing)
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/admin/products` | POST | Create product (admin only) |
| `/api/admin/products/[id]` | PATCH | Update product (admin only) |
| `/api/admin/products/[id]` | DELETE | Soft delete (sets availability=out-of-stock) |

**Missing**: GET `/api/admin/products` for listing products with pagination/filters in admin context

### Authentication/Authorization
- `src/lib/auth/admin-guard.ts`: `verifyAdminSession(request)` checks Supabase Auth session + `user_metadata.role === 'admin'`
- All admin endpoints use this guard
- Service role key used for database operations (bypasses RLS)

### Image Upload
- `/api/upload` (POST): Accepts multipart form, validates image/* ≤5MB, stores in Supabase Storage `product-images` bucket, returns signed URL (1hr)

### Frontend Structure
- **No admin pages exist** - need to create under `src/pages/admin/`
- Base layout: `src/layouts/Base.astro` with Header/Footer, Tailwind 4, SEO structured data
- Components: ProductCard, CategoryCard, SolutionCard, CTAWhatsApp, etc. in `src/components/`
- Static-first, zero framework JS for content rendering

## Affected Areas

### Files to Create/Modify
1. **`src/pages/api/admin/products/index.ts`** - Add `GET` export for admin product listing (with pagination, search, filters)
2. **`src/pages/admin/index.astro`** - Admin dashboard (product list with actions)
3. **`src/pages/admin/products/index.astro`** - Product list page (table with pagination, search, filters)
4. **`src/pages/admin/products/new.astro`** - Create product form
5. **`src/pages/admin/products/[id].astro`** - Edit product form
6. **`src/components/admin/ProductTable.astro`** - Reusable table component
7. **`src/components/admin/ProductForm.astro`** - Reusable form component (create/edit)
8. **`src/components/admin/ImageUpload.astro`** - Image upload component (multiple images)
9. **`src/lib/api/validation.ts`** - Add `ProductAdminListQuerySchema` for admin list params
10. **`src/styles/main.css`** - Admin-specific styles (or reuse existing Tailwind utilities)

## Approaches

### Approach 1: Full Admin UI with Server-Rendered Forms (Recommended)
**Description**: Build admin pages as standard Astro pages with `<form method="POST">` actions calling admin API endpoints. Zero client-side JS for forms.

| Pros | Cons |
|------|------|
| Fits Astro 7 static-first architecture | More page reloads (but acceptable for admin) |
| Zero framework JS - works on <1 Mbps connections | Form validation mostly server-side |
| Leverages existing API patterns and Zod schemas | Image upload needs client-side handling |
| Progressive enhancement friendly | |
| Easy to secure with existing admin-guard | |

**Effort**: Medium (~8-12 files)

### Approach 2: Hybrid with Island Components for Interactivity
**Description**: Use Astro islands (`client:load`/`client:visible`) for form validation, image preview, dynamic related product selection.

| Pros | Cons |
|------|------|
| Better UX (inline validation, image previews) | Adds client-side JS bundle |
| Reusable interactive components | More complex, harder to maintain |
| Can use existing UI patterns | May violate <1Mbps budget if not careful |

**Effort**: High (~15-20 files)

### Approach 3: External Admin Tool (AdminJS, Forest Admin, etc.)
**Description**: Integrate a headless admin panel that connects to Supabase.

| Pros | Cons |
|------|------|
| Fast to set up | Doesn't match project's custom UI/design system |
| Built-in CRUD, filters, relationships | Another dependency, customization limited |
| | Not tailored to product schema (specs, features, images) |

**Effort**: Low initial, High long-term (customization pain)

## Recommendation

**Approach 1 (Server-Rendered Forms)** is the best fit because:
1. **Architecture alignment**: Astro 7 static-first, zero-JS philosophy for content
2. **Performance**: Works on <1 Mbps connections - no heavy JS bundles
3. **Security**: Existing admin-guard pattern, server-side validation
4. **Maintainability**: Simple Astro pages, easy to audit and extend
5. **Consistency**: Uses same Tailwind 4 design system, components, validation schemas

### Implementation Path
1. **Add GET to admin products API** (`src/pages/api/admin/products/index.ts`) - list with pagination, search, category filter, availability filter
2. **Create admin layout** (`src/layouts/Admin.astro`) - minimal layout with sidebar nav, no Header/Footer from public site
3. **Build product list page** (`src/pages/admin/products/index.astro`) - table with actions (edit/delete), pagination, search
4. **Build create/edit forms** (`new.astro`, `[id].astro`) - use `ProductCreateSchema`/`ProductUpdateSchema` for field definitions
5. **Image upload component** - integrate with `/api/upload`, show previews, handle multiple images
6. **Category selection** - fetch categories from `/api/categories` for dropdown
7. **Related products** - searchable multi-select from existing products

## Risks

1. **Missing GET endpoint** - Admin API needs list endpoint before UI can work
2. **Image handling** - Multiple image upload with previews needs careful UX (consider dropzone, preview grid)
3. **Related products selector** - Could be many products; need searchable select or modal
4. **Specs/Features editors** - Key-value and array editors need custom UI (dynamic rows)
5. **Slug uniqueness** - Client-side check or server validation with friendly error
6. **Soft delete UX** - DELETE sets availability=out-of-stock; UI should reflect this clearly

## Ready for Proposal

**Yes**. The exploration is complete. The orchestrator should:
1. Present the recommendation (Approach 1) to the user
2. If approved, create an SDD proposal with the implementation plan
3. Key decision: confirm server-rendered forms approach and whether to add any islands for specific interactions (image preview, related product search)