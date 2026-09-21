# Delta Spec: Admin Product CRUD UI

**Change**: `admin-product-crud-ui`  
**Proposal**: `openspec/changes/admin-product-crud-ui/proposal.md`  
**Version**: 1.0.0

---

## Capability 1: Admin Product List

### Requirement

Provide a server-rendered admin page to list products with pagination, search, and filters (category, availability). Each row includes Edit and Delete actions. Data is fetched via `GET /api/admin/products` with query parameters.

### Scenarios

#### Scenario 1.1: List products with pagination
- **Given** the admin is authenticated and on `/admin/products`
- **When** the page loads
- **Then** the first page of products (20 per page) renders in a table
- **And** pagination controls show current page, total pages, and next/previous links
- **And** each row shows: thumbnail, name, slug, category, price, availability badge, actions (Edit, Delete)

#### Scenario 1.2: Search products by name or slug
- **Given** the admin is on `/admin/products`
- **When** they enter a search term in the search input and submit
- **Then** the URL updates to `?search=<term>&page=1`
- **And** the table shows only products matching the term in name or slug (case-insensitive)
- **And** pagination resets to page 1

#### Scenario 1.3: Filter by category
- **Given** the admin is on `/admin/products`
- **When** they select a category from the dropdown and submit
- **Then** the URL updates to `?category=<slug>&page=1`
- **And** the table shows only products in that category
- **And** the selected category is reflected in the dropdown

#### Scenario 1.4: Filter by availability
- **Given** the admin is on `/admin/products`
- **When** they select an availability filter (in-stock, out-of-stock, low-stock) and submit
- **Then** the URL updates to `?availability=<value>&page=1`
- **And** the table shows only products with that availability status

#### Scenario 1.5: Combined filters and pagination
- **Given** the admin has applied search and category filters
- **When** they click "Next page"
- **Then** the URL includes all active filters plus `page=2`
- **And** the second page of filtered results renders

#### Scenario 1.6: Unauthorized access redirected
- **Given** a non-admin user (or unauthenticated) visits `/admin/products`
- **When** the request is processed
- **Then** they are redirected to `/login?redirect=/admin/products` with 302
- **And** no product data is exposed

### Acceptance Criteria

| ID | Criterion |
|----|-----------|
| AC-1.1 | Page renders HTML-only (zero client JS for table, pagination, filters) |
| AC-1.2 | `GET /api/admin/products` accepts `page`, `limit`, `search`, `category`, `availability` query params |
| AC-1.3 | Response includes `products[]`, `pagination: { page, limit, total, totalPages }` |
| AC-1.4 | Table columns: Image, Name/Slug, Category, Price, Availability, Actions |
| AC-1.5 | Availability badge uses semantic colors: green (in-stock), red (out-of-stock), yellow (low-stock) |
| AC-1.6 | Edit link → `/admin/products/[id]`, Delete button → POST to `/admin/products/[id]/delete` |
| AC-1.7 | Page loads < 2s on 1 Mbps throttling (no heavy assets) |
| AC-1.8 | All admin routes protected by `verifyAdminSession()` middleware |

### Out of Scope

- Category management UI (separate change)
- Bulk actions (select multiple, bulk delete/archive)
- Column sorting (server-side sort deferred)
- Export to CSV/Excel
- Product variants/sub-products

---

## Capability 2: Create Product

### Requirement

Provide a server-rendered form at `/admin/products/new` to create a new product. Form submits via `POST /api/admin/products` with all fields from `ProductCreateSchema`. Includes multiple image upload via existing `/api/upload` endpoint.

### Scenarios

#### Scenario 2.1: Load empty create form
- **Given** the admin is authenticated and visits `/admin/products/new`
- **When** the page loads
- **Then** a form renders with all `ProductCreateSchema` fields:
  - Required: `name`, `slug`, `description`, `price`, `categoryId`
  - Optional: `compareAtPrice`, `images[]`, `specs[]`, `features[]`, `relatedProductIds[]`, `availability`, `featured`, `bestSeller`
- **And** category dropdown is populated from `GET /api/categories`
- **And** related products field is a searchable multi-select
- **And** specs and features are dynamic row editors (add/remove rows)
- **And** image upload zone accepts multiple files

#### Scenario 2.2: Successful product creation
- **Given** the admin fills all required fields and optionally optional fields
- **When** they click "Create Product"
- **Then** form submits `POST /api/admin/products` with `multipart/form-data`
- **And** server validates via `ProductCreateSchema`
- **And** on success: redirects to `/admin/products/[id]` with success toast
- **And** product appears in list with correct data

#### Scenario 2.3: Validation errors displayed
- **Given** the admin submits invalid data (e.g., missing name, duplicate slug, negative price)
- **When** the server validates via `ProductCreateSchema`
- **Then** page re-renders with field-level error messages
- **And** user input is preserved (no data loss)
- **And** errors are announced to screen readers

#### Scenario 2.4: Image upload flow
- **Given** the admin selects 3 image files in the upload zone
- **When** they click "Create Product"
- **Then** images are uploaded to `/api/upload` (parallel or sequential)
- **And** returned Supabase Storage URLs are included in `images[]` payload
- **And** product is created with those image URLs

#### Scenario 2.5: Slug auto-generation
- **Given** the admin enters a product name but leaves slug empty
- **When** they tab out of the name field
- **Then** slug is auto-generated from name (lowercase, hyphenated, unique)
- **And** admin can override the generated slug

#### Scenario 2.6: Dynamic specs editor
- **Given** the admin is on the create form
- **When** they click "Add Spec"
- **Then** a new row appears with Key and Value inputs
- **And** they can add multiple spec rows
- **And** on submit, specs are sent as `[{key, value}, ...]`

#### Scenario 2.7: Dynamic features editor
- **Given** the admin is on the create form
- **When** they click "Add Feature"
- **Then** a new text input appears for a feature string
- **And** they can add/remove feature rows
- **And** on submit, features are sent as `string[]`

#### Scenario 2.8: Related products search
- **Given** the admin types in the related products field
- **When** the input has ≥ 2 characters
- **Then** a server-side search `GET /api/admin/products?search=<term>&limit=10` is triggered
- **And** matching products appear as selectable options
- **And** selected products are shown as chips with remove buttons

### Acceptance Criteria

| ID | Criterion |
|----|-----------|
| AC-2.1 | Form uses `<form method="POST" action="/api/admin/products" enctype="multipart/form-data">` |
| AC-2.2 | All `ProductCreateSchema` fields represented in form |
| AC-2.3 | Category dropdown loads from `GET /api/categories` (server-rendered options) |
| AC-2.4 | Image upload uses existing `/api/upload` endpoint, supports multiple files |
| AC-2.5 | Specs rendered as dynamic key-value rows; Features as dynamic string array |
| AC-2.6 | Related products: searchable multi-select with server-side search |
| AC-2.7 | Slug auto-generated from name on blur; editable; uniqueness validated server-side |
| AC-2.8 | Server-side validation only; error messages rendered inline per field |
| AC-2.9 | Success redirects to edit page `/admin/products/[id]` |
| AC-2.10 | Zero JS required for core flow; optional island only for image previews |

### Out of Scope

- Drag-and-drop image reordering (v2)
- Image crop/rotate editor
- Rich text editor for description (plain textarea only)
- SEO fields (meta title/description) — separate change
- Variant/option management
- Draft state (products publish immediately)

---

## Capability 3: Edit Product

### Requirement

Provide a server-rendered form at `/admin/products/[id]` pre-filled with existing product data. Form submits via `PATCH /api/admin/products/[id]`. Includes image management (add, remove, reorder).

### Scenarios

#### Scenario 3.1: Load pre-filled edit form
- **Given** the admin visits `/admin/products/[valid-id]`
- **When** the page loads
- **Then** `GET /api/admin/products/[id]` fetches the product
- **And** all form fields are pre-filled with current values
- **And** existing images render as preview thumbnails with remove buttons
- **And** current specs, features, related products are pre-populated
- **And** category dropdown shows current category selected

#### Scenario 3.2: Successful product update
- **Given** the admin modifies one or more fields
- **When** they click "Save Changes"
- **Then** form submits `PATCH /api/admin/products/[id]` with `multipart/form-data`
- **And** server validates via `ProductUpdateSchema` (partial)
- **And** on success: redirects back to edit page with success toast
- **And** changes reflected in product list

#### Scenario 3.3: Add new images
- **Given** the admin is on the edit form
- **When** they select new image files and click "Save Changes"
- **Then** new images uploaded to `/api/upload`
- **And** new URLs appended to existing `images[]` array
- **And** product updated with combined image list

#### Scenario 3.4: Remove existing images
- **Given** the admin clicks "Remove" on an existing image thumbnail
- **When** they then click "Save Changes"
- **Then** the removed image URL is excluded from the `images[]` payload
- **And** product updated with remaining images
- **Note**: Actual file deletion from Supabase Storage is deferred (orphan cleanup job)

#### Scenario 3.5: Reorder images
- **Given** the admin sees image thumbnails
- **When** they drag to reorder (optional JS island) or use up/down buttons
- **And** click "Save Changes"
- **Then** `images[]` array order reflects the new order

#### Scenario 3.6: Update specs/features/related products
- **Given** the admin adds/removes spec rows, feature rows, related products
- **When** they click "Save Changes"
- **Then** full updated arrays sent in payload
- **And** server replaces existing arrays with new ones

#### Scenario 3.7: Product not found
- **Given** the admin visits `/admin/products/[invalid-id]`
- **When** the page loads
- **Then** 404 page renders with "Product not found" message
- **And** link back to product list

#### Scenario 3.8: Validation errors on update
- **Given** the admin submits invalid data (e.g., empty name, duplicate slug)
- **When** the server validates via `ProductUpdateSchema`
- **Then** page re-renders with pre-filled data + field-level errors
- **And** no data loss

### Acceptance Criteria

| ID | Criterion |
|----|-----------|
| AC-3.1 | `GET /api/admin/products/[id]` returns full product with images, specs, features, related |
| AC-3.2 | Form uses `<form method="POST" action="/api/admin/products/[id]?_method=PATCH" enctype="multipart/form-data">` |
| AC-3.3 | All fields pre-filled; images shown as removable thumbnails |
| AC-3.4 | Image management: add (upload), remove (exclude from payload), reorder (order in payload) |
| AC-3.5 | Specs/Features/Related Products editors match create form behavior |
| AC-3.6 | `ProductUpdateSchema` validates partial updates |
| AC-3.7 | Slug uniqueness checked excluding current product |
| AC-3.8 | 404 for non-existent product ID |
| AC-3.9 | Zero JS for core flow; optional island for drag-reorder |

### Out of Scope

- Image deletion from Supabase Storage (cleanup job separate)
- Version history / audit log
- Compare changes diff view
- Scheduled publishing

---

## Capability 4: Delete Product (Soft Delete)

### Requirement

Provide a delete action on the product list and edit page that soft-deletes a product by setting `availability = 'out-of-stock'` and `deleted_at = now()`. Requires confirmation step.

### Scenarios

#### Scenario 4.1: Delete from list page
- **Given** the admin is on `/admin/products`
- **When** they click "Delete" on a product row
- **Then** a confirmation modal/page asks: "Archive this product? It will be hidden from the store but can be restored later."
- **And** on confirm: `POST /admin/products/[id]/delete` (or `DELETE /api/admin/products/[id]`)
- **And** server sets `availability = 'out-of-stock'` and `deleted_at = now()`
- **And** redirects to `/admin/products` with success toast
- **And** product no longer appears in default list (availability filter excludes out-of-stock)

#### Scenario 4.2: Delete from edit page
- **Given** the admin is on `/admin/products/[id]`
- **When** they click "Delete" button in the form footer
- **Then** same confirmation flow as Scenario 4.1
- **And** on success: redirects to `/admin/products`

#### Scenario 4.3: Cancel deletion
- **Given** the admin clicks "Delete" and sees confirmation
- **When** they click "Cancel"
- **Then** they return to the previous page with no changes

#### Scenario 4.4: Delete non-existent product
- **Given** the admin submits delete for invalid ID
- **When** the server processes the request
- **Then** 404 response with "Product not found"
- **And** redirect to `/admin/products` with error toast

#### Scenario 4.5: Soft delete vs hard delete clarity
- **Given** the admin sees "Delete" button
- **When** they hover or read the confirmation text
- **Then** it clearly says "Archive" / "Set as out-of-stock" not "Permanently delete"
- **And** a "Restore" action is mentioned as available later

### Acceptance Criteria

| ID | Criterion |
|----|-----------|
| AC-4.1 | Delete action uses `POST /admin/products/[id]/delete` (form submission, no JS) |
| AC-4.2 | Server endpoint: `DELETE /api/admin/products/[id]` or `PATCH` with `availability=out-of-stock, deleted_at=now()` |
| AC-4.3 | Confirmation step required (separate page or modal with form) |
| AC-4.4 | Button labeled "Archive" or "Set Out of Stock" not "Delete" |
| AC-4.5 | Success redirects to product list with toast |
| AC-4.6 | Soft-deleted products excluded from default list view (filter `availability != out-of-stock`) |
| AC-4.7 | "Show archived" filter option to view soft-deleted products |

### Out of Scope

- Hard delete (permanent removal from DB)
- Restore/undelete action (future enhancement)
- Bulk archive
- Archive reason/logging

---

## Cross-Cutting Requirements

### Authentication & Authorization
- All admin routes (`/admin/*`) protected by `verifyAdminSession()` middleware
- Returns 401/redirect to login if no valid admin session
- Admin role checked via Supabase Auth `user_role = 'admin'`

### Validation
- `ProductCreateSchema` used for create (all required fields enforced)
- `ProductUpdateSchema` used for edit (partial, all fields optional)
- `ProductAdminListQuerySchema` added for list query params validation
- Errors returned as structured field-level messages

### API Contracts

#### GET /api/admin/products
```
Query: ProductAdminListQuerySchema {
  page?: number (default 1)
  limit?: number (default 20, max 100)
  search?: string
  category?: string (category slug)
  availability?: 'in-stock' | 'out-of-stock' | 'low-stock'
}
Response: {
  products: ProductAdminListItem[]
  pagination: { page, limit, total, totalPages }
}
```

#### GET /api/admin/products/[id]
```
Response: ProductAdminDetail (full product with images, specs, features, related)
```

#### POST /api/admin/products
```
Body: multipart/form-data per ProductCreateSchema
Response: 201 { product: ProductAdminDetail } or 400 { errors: FieldError[] }
```

#### PATCH /api/admin/products/[id]
```
Body: multipart/form-data per ProductUpdateSchema
Response: 200 { product: ProductAdminDetail } or 400/404
```

#### DELETE /api/admin/products/[id] (or PATCH with soft-delete payload)
```
Response: 200 { success: true } or 404
```

### UI/UX Standards
- Admin layout: `src/layouts/Admin.astro` with sidebar navigation
- Consistent with public site design tokens (Tailwind 4, theme.json colors)
- Touch targets ≥ 44px
- Form labels associated with inputs
- Error messages linked via `aria-describedby`
- Loading states for form submissions (disabled button, spinner)
- Success/error toasts via server-rendered flash messages

### Performance
- All pages server-rendered, zero JS for core flows
- Images served via Supabase Storage CDN (WebP/AVIF)
- Page weight < 100 KB HTML + CSS
- Loads < 2s on 1 Mbps throttling

### Out of Scope (Entire Change)

| Area | Reason |
|------|--------|
| Category CRUD | Separate change |
| Solution/Kit/Guide CRUD | Separate changes |
| Bulk import/export | Out of scope per proposal |
| Analytics/reporting | Out of scope per proposal |
| User/role management | Out of scope per proposal |
| Draft/publish workflow | Products go live immediately |
| Image deletion from storage | Orphan cleanup job separate |
| Restore archived products | Future enhancement |
| Rich text description | Plain textarea only |
| SEO fields | Separate change |
| Product variants | Not in current data model |

---

## File Map (Planned)

| Path | Purpose |
|------|---------|
| `src/pages/api/admin/products/index.ts` | Add `GET` export for listing |
| `src/lib/api/validation.ts` | Add `ProductAdminListQuerySchema` |
| `src/layouts/Admin.astro` | Admin layout with sidebar |
| `src/pages/admin/index.astro` | Dashboard redirect |
| `src/pages/admin/products/index.astro` | Product list page |
| `src/pages/admin/products/new.astro` | Create form |
| `src/pages/admin/products/[id].astro` | Edit form |
| `src/components/admin/ProductTable.astro` | Reusable table |
| `src/components/admin/ProductForm.astro` | Shared form component |
| `src/components/admin/ImageUpload.astro` | Multi-image upload zone |
| `src/styles/main.css` | Admin-specific utilities |