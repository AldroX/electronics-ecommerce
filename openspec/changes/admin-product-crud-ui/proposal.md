# Proposal: Admin Product CRUD UI

## Intent

Currently, product management requires direct Supabase dashboard access — non-technical admins cannot easily create, edit, or manage products. This change introduces a dedicated admin UI for product CRUD operations, integrated with the existing admin API, auth guard, and validation schemas, following the project's static-first, zero-JS architecture for <1 Mbps connections.

## Scope

### In Scope
- Admin product listing with pagination, search, and filters (category, availability)
- Create product form with all fields from `ProductCreateSchema`
- Edit product form with all fields from `ProductUpdateSchema`
- Soft delete (set availability=out-of-stock) with confirmation
- Multiple image upload via existing `/api/upload` endpoint
- Category selection dropdown (from `/api/categories`)
- Related products multi-select (searchable)
- Specs (key-value) and Features (array) dynamic editors
- Admin layout with sidebar navigation (separate from public site)

### Out of Scope
- Category CRUD (separate change)
- Solution/Kit/Guide CRUD (separate changes)
- Bulk operations (import/export)
- Advanced analytics or reporting
- User management / role assignment
- Draft/publish workflow (products go live immediately)

## Capabilities

### New Capabilities
- `admin-product-list`: Admin product listing with pagination, search, filters
- `admin-product-create`: Create product form with validation and image upload
- `admin-product-edit`: Edit product form with pre-filled data
- `admin-product-delete`: Soft delete action with confirmation

### Modified Capabilities
- `admin-auth`: Extends to cover admin UI routes (already handles API)
- `product-validation`: Reuses existing Zod schemas for form validation

## Approach

**Server-rendered forms (Approach 1 from exploration)** — Standard Astro pages with `<form method="POST">` actions calling existing admin API endpoints. Zero client-side JS for form submission. Progressive enhancement: optional islands only for image preview and related product search if needed.

| Pros | Cons |
|------|------|
| Fits Astro 7 static-first, zero-JS philosophy | Page reloads on form actions (acceptable for admin) |
| Works on <1 Mbps connections | Server-side validation only (no inline feedback) |
| Leverages existing API, auth-guard, Zod schemas | Image previews need minimal client-side handling |
| Simple, auditable, easy to extend | |

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/pages/api/admin/products/index.ts` | Modified | Add `GET` export for admin product listing |
| `src/layouts/Admin.astro` | New | Minimal admin layout with sidebar nav |
| `src/pages/admin/index.astro` | New | Admin dashboard redirect to products |
| `src/pages/admin/products/index.astro` | New | Product list page with table, actions |
| `src/pages/admin/products/new.astro` | New | Create product form |
| `src/pages/admin/products/[id].astro` | New | Edit product form |
| `src/components/admin/ProductTable.astro` | New | Reusable product table component |
| `src/components/admin/ProductForm.astro` | New | Reusable form component (create/edit) |
| `src/components/admin/ImageUpload.astro` | New | Multiple image upload with previews |
| `src/lib/api/validation.ts` | Modified | Add `ProductAdminListQuerySchema` |
| `src/styles/main.css` | Modified | Admin-specific styles (or Tailwind utilities) |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Missing GET endpoint blocks UI | High | Build API GET first as slice 1 |
| Image upload UX (multi-file, previews) | Medium | Simple dropzone + preview grid; optional island for previews |
| Related products selector (many products) | Medium | Searchable combobox; server-side search endpoint |
| Specs/Features dynamic editors | Medium | Dynamic row components with add/remove buttons |
| Slug uniqueness validation | Low | Server-side check with friendly error message |
| Soft delete UX clarity | Low | Clear labeling "Archived" vs "Deleted", restore action later |

## Rollback Plan

1. Delete `openspec/changes/admin-product-crud-ui/` folder
2. Remove created files: `src/pages/admin/`, `src/layouts/Admin.astro`, `src/components/admin/`
3. Revert `src/pages/api/admin/products/index.ts` to remove GET export
4. Revert `src/lib/api/validation.ts` to remove `ProductAdminListQuerySchema`
5. No database migrations needed (reads/writes existing tables)

## Dependencies

- Existing admin API (POST/PATCH/DELETE at `/api/admin/products`)
- Admin auth guard (`src/lib/auth/admin-guard.ts` with `verifyAdminSession()`)
- Image upload API (`/api/upload` → Supabase Storage)
- Zod validation schemas (`ProductCreateSchema`, `ProductUpdateSchema`)
- Categories API (`/api/categories` for dropdown)
- Astro 7 + Tailwind 4 + TypeScript stack

## Success Criteria

- [ ] Admin can list products with pagination, search, category/availability filters
- [ ] Admin can create a product with all required fields + images
- [ ] Admin can edit an existing product (pre-filled form)
- [ ] Admin can soft-delete a product (availability=out-of-stock)
- [ ] All forms validate via Zod schemas server-side
- [ ] Image upload works end-to-end (multiple files, previews)
- [ ] Pages load without JS on <1 Mbps connection (verify with throttling)
- [ ] Admin routes protected by `verifyAdminSession()` (401 if not admin)