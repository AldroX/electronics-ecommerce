# Implementation Tasks: Admin Product CRUD UI

**Change**: `admin-product-crud-ui`  
**Version**: 1.0.0  
**Total Tasks**: 16

---

## Task Summary

| ID | Title | Estimate | Dependencies |
|----|-------|----------|--------------|
| T01 | Add GET /api/admin/products endpoint with pagination, search, filters | M | — |
| T02 | Add ProductAdminListQuerySchema to validation.ts | S | — |
| T03 | Extend types.ts with admin list response types | S | — |
| T04 | Create Admin layout (src/layouts/Admin.astro) with sidebar nav, auth guard | M | — |
| T05 | Create admin dashboard redirect page (src/pages/admin/index.astro) | S | T04 |
| T06 | Create ProductTable component (src/components/admin/ProductTable.astro) | M | T01, T04 |
| T07 | Create ProductForm component (src/components/admin/ProductForm.astro) | L | T04 |
| T08 | Create ImageUpload component (src/components/admin/ImageUpload.astro) | M | T04 |
| T09 | Create ConfirmModal component (src/components/admin/ConfirmModal.astro) | S | T04 |
| T10 | Create product list page (src/pages/admin/products/index.astro) | M | T04, T06, T01 |
| T11 | Create product create page (src/pages/admin/products/new.astro) | M | T04, T07, T08 |
| T12 | Create product edit page (src/pages/admin/products/[id].astro) | M | T04, T07, T08 |
| T13 | Create delete/confirm page (src/pages/admin/products/[id]/delete.astro) | S | T04, T09 |
| T14 | Add admin-specific styling utilities | S | T04 |
| T15 | Add toast/flash message mechanism for success/error feedback | S | T04 |
| T16 | Verify all admin routes protected by verifyAdminSession() | S | T04, T10, T11, T12, T13 |

---

## Task Details

### T01: Add GET /api/admin/products endpoint with pagination, search, filters

**Description**: Implement the `GET` export in `src/pages/api/admin/products/index.ts` to handle paginated, filtered product listing for admin. Use `ProductAdminListQuerySchema` for query validation. Query the database with joins to include category name. Return `ProductAdminListResponse` shape.

**Dependencies**: T02, T03

**Estimate**: M

**Files to Create/Modify**:
- `src/pages/api/admin/products/index.ts` — Add `export async function GET({ url, locals })` handler

**Acceptance Criteria** (from spec):
- AC-1.2: `GET /api/admin/products` accepts `page`, `limit`, `search`, `category`, `availability` query params
- AC-1.3: Response includes `products[]`, `pagination: { page, limit, total, totalPages }`
- AC-1.7: Page loads < 2s on 1 Mbps throttling

---

### T02: Add ProductAdminListQuerySchema to validation.ts

**Description**: Add the `ProductAdminListQuerySchema` Zod schema to `src/lib/api/validation.ts` for validating list query parameters. Export the inferred type `ProductAdminListQuery`.

**Dependencies**: —

**Estimate**: S

**Files to Create/Modify**:
- `src/lib/api/validation.ts` — Add schema and type export

**Acceptance Criteria** (from spec):
- AC-1.2: Query params validated per schema in design.md §Interfaces

---

### T03: Extend types.ts with admin list response types

**Description**: Add TypeScript interfaces for `ProductAdminListItem`, `ProductAdminListResponse`, and `ProductAdminDetail` (if not already present) to `src/data/types.ts`. These types are used by the API endpoint and admin pages.

**Dependencies**: —

**Estimate**: S

**Files to Create/Modify**:
- `src/data/types.ts` — Add admin-specific product types

**Acceptance Criteria** (from spec):
- AC-1.3: Response shape matches `ProductAdminListResponse` interface
- AC-3.1: `GET /api/admin/products/[id]` returns `ProductAdminDetail`

---

### T04: Create Admin layout (src/layouts/Admin.astro) with sidebar nav, auth guard

**Description**: Create a new admin layout at `src/layouts/Admin.astro` with:
- Minimal HTML shell (no public header/footer)
- Sidebar navigation with links: Products, Categories, Solutions, Kits, Guides, Settings
- `verifyAdminSession()` guard in frontmatter (imported from `@/lib/auth/admin-guard`)
- Redirect to `/login?redirect=...` on auth failure
- Dark mode support via theme.json CSS variables
- Consistent with Tailwind 4 design tokens from theme.json
- `<meta name="robots" content="noindex, nofollow">`

**Dependencies**: —

**Estimate**: M

**Files to Create/Modify**:
- `src/layouts/Admin.astro` — New file

**Acceptance Criteria** (from spec):
- AC-1.8: All admin routes protected by `verifyAdminSession()` middleware
- AC-1.1: Page renders HTML-only (zero client JS)
- Design decision: Admin layout separate from public (design.md §Decision)

---

### T05: Create admin dashboard redirect page (src/pages/admin/index.astro)

**Description**: Create a simple dashboard page at `src/pages/admin/index.astro` that redirects to `/admin/products`. Uses `Admin.astro` layout. Minimal content — just a redirect or a simple welcome card with link to products.

**Dependencies**: T04

**Estimate**: S

**Files to Create/Modify**:
- `src/pages/admin/index.astro` — New file

**Acceptance Criteria** (from design.md):
- File Map: `src/pages/admin/index.astro` — Dashboard page redirects to `/admin/products`

---

### T06: Create ProductTable component (src/components/admin/ProductTable.astro)

**Description**: Create a reusable table component at `src/components/admin/ProductTable.astro` that renders:
- Table with columns: Image (thumbnail), Name/Slug, Category, Price, Availability, Actions
- Availability badge with semantic colors: green (in-stock), yellow (limited/low-stock), red (out-of-stock)
- Pagination controls (prev/next, page numbers, total pages)
- Filter form: search input, category dropdown, availability dropdown — submits via GET to same URL
- All rows/links use standard HTML (no JS)
- Edit link → `/admin/products/[id]`
- Delete button → form POST to `/admin/products/[id]/delete`

**Dependencies**: T01, T04

**Estimate**: M

**Files to Create/Modify**:
- `src/components/admin/ProductTable.astro` — New file

**Acceptance Criteria** (from spec):
- AC-1.1: Zero client JS for table, pagination, filters
- AC-1.4: Table columns: Image, Name/Slug, Category, Price, Availability, Actions
- AC-1.5: Availability badge uses semantic colors
- AC-1.6: Edit link → `/admin/products/[id]`, Delete button → POST to `/admin/products/[id]/delete`

---

### T07: Create ProductForm component (src/components/admin/ProductForm.astro)

**Description**: Create a shared form component at `src/components/admin/ProductForm.astro` used by both create and edit pages. Handles all `ProductCreateSchema` / `ProductUpdateSchema` fields:
- Required: `name`, `slug`, `description`, `price`, `categoryId`
- Optional: `compareAtPrice`, `images[]`, `specs[]`, `features[]`, `relatedProductIds[]`, `availability`, `featured`, `bestSeller`
- Category dropdown populated from `GET /api/categories` (server-rendered options)
- Dynamic specs editor: key-value rows with "Add Spec" / remove buttons
- Dynamic features editor: string array rows with "Add Feature" / remove buttons
- Related products searchable multi-select: server-side search via `GET /api/admin/products?search=<term>&limit=10` (Astro island for autocomplete)
- Slug auto-generation from name on blur (optional JS island for preview)
- Form uses `<form method="POST" enctype="multipart/form-data">` with action set by parent page
- Field-level error rendering via `errors` prop mapped to `aria-describedby`
- Hidden `_method=PATCH` input for edit mode
- Submit button with loading state (disabled + spinner)

**Dependencies**: T04

**Estimate**: L

**Files to Create/Modify**:
- `src/components/admin/ProductForm.astro` — New file

**Acceptance Criteria** (from spec):
- AC-2.1: Form uses multipart/form-data POST
- AC-2.2: All ProductCreateSchema fields represented
- AC-2.3: Category dropdown loads from GET /api/categories
- AC-2.5: Specs as dynamic key-value rows; Features as dynamic string array
- AC-2.6: Related products: searchable multi-select with server-side search
- AC-2.7: Slug auto-generated from name on blur; editable
- AC-2.8: Server-side validation only; error messages inline per field
- AC-2.10: Zero JS for core flow; optional island only for image previews/related search
- AC-3.2: Form uses `_method=PATCH` for edit
- AC-3.4: Specs/Features/Related Products editors match create form behavior

---

### T08: Create ImageUpload component (src/components/admin/ImageUpload.astro)

**Description**: Create a multi-file image upload component at `src/components/admin/ImageUpload.astro`:
- `<input type="file" multiple accept="image/*">` for new uploads
- Preview thumbnails for selected files (before upload)
- For edit mode: renders existing images as removable thumbnails with checkbox to exclude from payload
- On form submit: parent page uploads each file to `/api/upload` (parallel), collects returned URLs, includes in `images[]` hidden inputs
- Drag-and-drop reorder (optional JS island) or up/down buttons for order
- Max 5MB/file, image types only (enforced by `/api/upload`)
- Accessible: labels, keyboard navigable, ARIA live region for upload status

**Dependencies**: T04

**Estimate**: M

**Files to Create/Modify**:
- `src/components/admin/ImageUpload.astro` — New file

**Acceptance Criteria** (from spec):
- AC-2.4: Image upload uses existing `/api/upload` endpoint, supports multiple files
- AC-2.10: Zero JS for core flow; optional island for previews/reorder
- AC-3.3: Image management: add (upload), remove (exclude from payload), reorder (order in payload)
- AC-3.4: Images shown as removable thumbnails in edit mode

---

### T09: Create ConfirmModal component (src/components/admin/ConfirmModal.astro)

**Description**: Create a server-rendered confirmation dialog component at `src/components/admin/ConfirmModal.astro`:
- Used by delete page (`/admin/products/[id]/delete`)
- Renders as `<dialog>` element with form inside
- Title: "Archive Product"
- Message: "Archive this product? It will be hidden from the store but can be restored later."
- Two buttons: "Cancel" (link back), "Archive" (form submit)
- No JavaScript — standard form submission
- Accessible: `role="dialog"`, `aria-labelledby`, `aria-describedby`, focus trap on open

**Dependencies**: T04

**Estimate**: S

**Files to Create/Modify**:
- `src/components/admin/ConfirmModal.astro` — New file

**Acceptance Criteria** (from spec):
- AC-4.3: Confirmation step required (separate page or modal with form)
- AC-4.4: Button labeled "Archive" not "Delete"
- AC-4.5: Success redirects to product list with toast

---

### T10: Create product list page (src/pages/admin/products/index.astro)

**Description**: Create the product list page at `src/pages/admin/products/index.astro`:
- Uses `Admin.astro` layout
- Frontmatter: `verifyAdminSession()`, fetch categories for filter dropdown, call `GET /api/admin/products` with query params from `Astro.url.searchParams`
- Renders filter form (search, category, availability) + `ProductTable` with products and pagination
- Passes `products`, `pagination`, `categories`, `filters` to `ProductTable`
- Handles empty state (no products found)

**Dependencies**: T04, T06, T01

**Estimate**: M

**Files to Create/Modify**:
- `src/pages/admin/products/index.astro` — New file

**Acceptance Criteria** (from spec):
- AC-1.1: HTML-only rendering
- AC-1.2–1.5: Filters, pagination, table columns, badges all work
- AC-1.6: Edit/Delete actions correct
- AC-1.7: Performance < 2s on 1 Mbps
- AC-1.8: Auth guard works

---

### T11: Create product create page (src/pages/admin/products/new.astro)

**Description**: Create the product create page at `src/pages/admin/products/new.astro`:
- Uses `Admin.astro` layout
- Frontmatter: `verifyAdminSession()`, fetch categories for dropdown
- Renders `ProductForm` in create mode (no pre-filled data, action="/api/admin/products")
- Embeds `ImageUpload` for new images
- On successful POST redirect: handled by API (302 to `/admin/products/[id]`)
- Displays validation errors if returned (page re-rendered with errors)

**Dependencies**: T04, T07, T08

**Estimate**: M

**Files to Create/Modify**:
- `src/pages/admin/products/new.astro` — New file

**Acceptance Criteria** (from spec):
- AC-2.1–2.10: Create form fully functional
- AC-2.9: Success redirects to edit page `/admin/products/[id]`

---

### T12: Create product edit page (src/pages/admin/products/[id].astro)

**Description**: Create the product edit page at `src/pages/admin/products/[id].astro`:
- Uses `Admin.astro` layout
- Frontmatter: `verifyAdminSession()`, validate `[id]` as UUID, fetch product via `GET /api/admin/products/[id]`, fetch categories
- 404 if product not found
- Renders `ProductForm` in edit mode (pre-filled, action="/api/admin/products/[id]?_method=PATCH")
- Embeds `ImageUpload` with existing images shown as removable thumbnails
- "Delete" button in form footer links to `/admin/products/[id]/delete`
- On successful PATCH: redirect back to same page with success toast
- Displays validation errors inline

**Dependencies**: T04, T07, T08

**Estimate**: M

**Files to Create/Modify**:
- `src/pages/admin/products/[id].astro` — New file

**Acceptance Criteria** (from spec):
- AC-3.1: GET /api/admin/products/[id] returns full product detail
- AC-3.2: Form uses `_method=PATCH` multipart POST
- AC-3.3: All fields pre-filled; images as removable thumbnails
- AC-3.4: Image management (add/remove/reorder)
- AC-3.5: Specs/Features/Related editors match create
- AC-3.6: ProductUpdateSchema validates partial updates
- AC-3.7: Slug uniqueness checked excluding current product
- AC-3.8: 404 for non-existent product ID
- AC-3.9: Zero JS for core flow

---

### T13: Create delete/confirm page (src/pages/admin/products/[id]/delete.astro)

**Description**: Create the soft-delete confirmation page at `src/pages/admin/products/[id]/delete.astro`:
- Uses `Admin.astro` layout
- Frontmatter: `verifyAdminSession()`, validate `[id]`, fetch product for display
- GET: renders `ConfirmModal` with product name, form POST to same URL
- POST: calls `DELETE /api/admin/products/[id]` (or PATCH with soft-delete payload), on success redirects to `/admin/products` with success toast
- 404 if product not found
- "Cancel" button links back to referrer (edit page or list)

**Dependencies**: T04, T09

**Estimate**: S

**Files to Create/Modify**:
- `src/pages/admin/products/[id]/delete.astro` — New file

**Acceptance Criteria** (from spec):
- AC-4.1: Delete uses POST to `/admin/products/[id]/delete` (form submission)
- AC-4.2: Server endpoint soft-deletes (availability=out-of-stock, deleted_at=now())
- AC-4.3: Confirmation step required
- AC-4.4: Button labeled "Archive"
- AC-4.5: Success redirects to list with toast
- AC-4.6: Soft-deleted products excluded from default list
- AC-4.7: "Show archived" filter option (implemented in list page filter)

---

### T14: Add admin-specific styling utilities

**Description**: Add admin-specific CSS utilities to `src/styles/components.css` (and import in `main.css` if needed):
- Admin table styles: responsive, hover rows, sticky header
- Form grid layout: label + input pairs, error states
- Badge variants: availability (in-stock/limited/out-of-stock), featured, best-seller
- Sidebar navigation styles: collapsible, active state, mobile drawer
- Dialog/modal styles for ConfirmModal
- Image upload zone: drag-over state, preview grid, remove buttons
- Toast/flash message styles (success, error, info)
- Touch targets ≥ 44px

**Dependencies**: T04

**Estimate**: S

**Files to Create/Modify**:
- `src/styles/components.css` — Add admin utilities
- `src/styles/main.css` — Ensure import order includes admin utilities

**Acceptance Criteria** (from spec):
- AC-1.5: Availability badge colors
- UI/UX Standards: Touch targets ≥ 44px, form labels associated, error messages linked via aria-describedby
- Design: Consistent with theme.json colors, Tailwind 4

---

### T15: Add toast/flash message mechanism for success/error feedback

**Description**: Implement a server-rendered toast/flash message system for admin pages:
- Option A: Astro session middleware (if sessions configured) — store flash in session, read/clear on next render
- Option B: URL query param `?toast=success&message=...` — simpler, no session dependency
- Render toast in `Admin.astro` layout if present
- Auto-dismiss after 5s (optional CSS-only animation)
- Accessible: `role="alert"`, `aria-live="polite"`

**Dependencies**: T04

**Estimate**: S

**Files to Create/Modify**:
- `src/layouts/Admin.astro` — Add toast rendering slot
- `src/middleware.ts` or page frontmatters — Set/read flash (decide approach)
- `src/styles/components.css` — Toast styles

**Acceptance Criteria** (from spec):
- AC-2.9, AC-3.2, AC-4.5: Success toasts on create/update/delete
- AC-2.3, AC-3.8: Error toasts on validation failure
- Design.md Open Question: Toast mechanism

---

### T16: Verify all admin routes protected by verifyAdminSession()

**Description**: Audit and verify that every admin route (`/admin/*`) includes the `verifyAdminSession()` guard in frontmatter and correctly redirects unauthenticated/non-admin users to `/login?redirect=...`. Test:
- `/admin/` (dashboard)
- `/admin/products` (list)
- `/admin/products/new` (create)
- `/admin/products/[id]` (edit)
- `/admin/products/[id]/delete` (confirm)
- API endpoints already have guard (verify separately)

**Dependencies**: T04, T10, T11, T12, T13

**Estimate**: S

**Files to Create/Modify**:
- No new files — verification only. May add tests or update pages if missing.

**Acceptance Criteria** (from spec):
- AC-1.6: Unauthorized access redirected to `/login?redirect=...` with 302
- AC-1.8: All admin routes protected
- Cross-Cutting: Admin role checked via Supabase Auth `user_role = 'admin'`

---

## Dependency Graph

```
T01 ──┐
T02 ──┼──→ T06 ──┐
T03 ──┘          │
                 ├──→ T10
T04 ─────────────┼──→ T05
                 ├──→ T07 ──┐
                 ├──→ T08 ──┼──→ T11
                 ├──→ T09 ──┤      │
                 │          │      ├──→ T12
                 └──→ T14 ──┘      │
                 └──→ T15 ─────────┘
                                  │
                                  └──→ T13
                                         │
                                         └──→ T16
```

---

## Notes

- **Order of execution**: T02, T03, T01 can run in parallel. T04 is the blocker for all page/component tasks. T07 and T08 can run in parallel after T04. T10, T11, T12, T13 depend on their respective components.
- **API-first**: The GET endpoint (T01) must be deployed before the list page (T10) can be tested end-to-end.
- **Zero-JS philosophy**: All core flows use standard HTML forms. Optional Astro islands only for image previews, related-product search autocomplete, and drag-reorder.
- **Image upload**: Reuses existing `/api/upload` endpoint. Parent pages (T11, T12) handle the upload orchestration before submitting product form.
- **Soft delete**: Uses existing `DELETE /api/admin/products/[id]` endpoint. UI confirms with "Archive" terminology.
- **Validation**: All validation happens server-side. Errors re-render page with field-level messages.