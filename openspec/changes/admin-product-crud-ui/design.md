# Design: Admin Product CRUD UI

## Technical Approach

Server-rendered Astro pages with standard HTML forms (`method="POST"`), zero client-side JavaScript for core flows. Leverages existing admin API endpoints (`POST /api/admin/products`, `PATCH /api/admin/products/[id]`, `DELETE /api/admin/products/[id]`), the `verifyAdminSession()` guard, and Zod validation schemas (`ProductCreateSchema`, `ProductUpdateSchema`). Image upload uses the existing `/api/upload` endpoint. Optional Astro islands only for image preview and related-product search autocomplete.

## Architecture Decisions

### Decision: Server-Rendered Forms with Page Reloads

**Choice**: Standard `<form method="POST">` submissions with full page reloads
**Alternatives considered**: HTMX, Alpine.js islands for form handling, React island
**Rationale**: Aligns with project's zero-JS philosophy for <1 Mbps connections; admin users tolerate page reloads; simpler auditing and debugging; no hydration complexity

### Decision: Admin Layout Separate from Public Layout

**Choice**: New `src/layouts/Admin.astro` with sidebar navigation, not extending `Base.astro`
**Alternatives considered**: Extend `Base.astro` with conditional header/footer, single layout with admin flag
**Rationale**: Admin UI has different chrome (sidebar, no public header/footer), different auth context, noindex/no-follow robots; separation avoids conditional complexity in public layout

### Decision: Form Actions Target API Endpoints Directly

**Choice**: `<form action="/api/admin/products" method="POST">` and `<form action="/api/admin/products/[id]?_method=PATCH" method="POST">`
**Alternatives considered**: Server-side form actions in Astro page frontmatter (`Astro.request.formData()`)
**Rationale**: Keeps API as single source of truth; same validation runs for API and UI; enables future non-UI consumers; follows existing API patterns

### Decision: Image Upload Flow

**Choice**: Multiple file `<input type="file" multiple>` → client uploads each to `/api/upload` → returned URLs included in product form submit
**Alternatives considered**: Single multipart upload to product API, base64 encoding, direct Supabase Storage from client
**Rationale**: Reuses existing validated upload endpoint; 5MB/file limit enforced server-side; signed URLs expire in 1hr; parallel uploads for speed

### Decision: Soft Delete via Form POST to `/admin/products/[id]/delete`

**Choice**: Dedicated Astro page `src/pages/admin/products/[id]/delete.astro` with confirmation form
**Alternatives considered**: Modal with JS fetch, same page with hidden form, DELETE API call from UI
**Rationale**: Zero-JS confirmation; clear UX ("Archive" not "Delete"); follows RESTful pattern; server sets `availability='out-of-stock'` + `deleted_at=now()`

## Data Flow

```
Admin Browser → GET /admin/products → Admin.astro layout + index.astro
    │                                            │
    │         verifyAdminSession() (cookie)      │
    │                    ↓                       │
    │         GET /api/admin/products            │
    │         (page, search, category,           │
    │          availability)                     │
    │                    ↓                       │
    │         ProductTable.astro                 │
    │         (rows + pagination)                │
    └────────────────────────────────────────────┘

Create Flow:
Admin Browser → GET /admin/products/new → Admin.astro + new.astro
    │                                            │
    │         verifyAdminSession()               │
    │         GET /api/categories (for dropdown) │
    │                    ↓                       │
    │         ProductForm.astro                  │
    │         (ImageUpload.astro embedded)       │
    │                    ↓                       │
    │         POST /api/upload (per image)       │
    │         → signed URLs                      │
    │                    ↓                       │
    │         POST /api/admin/products           │
    │         (multipart/form-data with URLs)    │
    │                    ↓                       │
    │         Redirect → /admin/products/[id]    │

Edit Flow:
Admin Browser → GET /admin/products/[id] → Admin.astro + [id].astro
    │                                            │
    │         verifyAdminSession()               │
    │         GET /api/admin/products/[id]       │
    │         GET /api/categories                │
    │                    ↓                       │
    │         ProductForm.astro (pre-filled)     │
    │         (ImageUpload.astro with existing)  │
    │                    ↓                       │
    │         PATCH /api/admin/products/[id]     │
    │         (_method=PATCH + multipart)        │
    │                    ↓                       │
    │         Redirect → /admin/products/[id]    │
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/pages/api/admin/products/index.ts` | Modify | Add `GET` export for paginated/filtered listing |
| `src/lib/api/validation.ts` | Modify | Add `ProductAdminListQuerySchema` for list query validation |
| `src/layouts/Admin.astro` | Create | Minimal admin layout with sidebar nav, no public header/footer |
| `src/pages/admin/index.astro` | Create | Dashboard page — redirects to `/admin/products` |
| `src/pages/admin/products/index.astro` | Create | Product list page with table, filters, pagination |
| `src/pages/admin/products/new.astro` | Create | Create product form page |
| `src/pages/admin/products/[id].astro` | Create | Edit product form page (pre-filled) |
| `src/pages/admin/products/[id]/delete.astro` | Create | Soft-delete confirmation page |
| `src/components/admin/ProductTable.astro` | Create | Reusable table: columns, pagination, filter form |
| `src/components/admin/ProductForm.astro` | Create | Shared form component (create/edit) with dynamic specs/features/related |
| `src/components/admin/ImageUpload.astro` | Create | Multi-file upload zone with preview thumbnails |
| `src/components/admin/ConfirmModal.astro` | Create | Server-rendered confirmation dialog (used by delete page) |
| `src/styles/components.css` | Modify | Add admin table, form grid, badge utilities |
| `src/styles/main.css` | Modify | Import admin-specific utilities if needed |

## Interfaces / Contracts

### GET /api/admin/products (New)

```typescript
// Query validation: src/lib/api/validation.ts
export const ProductAdminListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().optional(),
  category: z.string().uuid().optional(), // category ID
  availability: z.enum(['in-stock', 'limited', 'out-of-stock']).optional(),
});

export type ProductAdminListQuery = z.infer<typeof ProductAdminListQuerySchema>;

// Response
interface ProductAdminListResponse {
  products: ProductAdminListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface ProductAdminListItem {
  id: string;
  name: string;
  slug: string;
  price: number;
  currency: string;
  category_id: string;
  category_name: string; // joined
  images: string[];
  availability: 'in-stock' | 'limited' | 'out-of-stock';
  featured: boolean;
  best_seller: boolean;
  created_at: string;
}
```

### GET /api/admin/products/[id] (Exists — returns full detail)

### POST /api/admin/products (Exists — `ProductCreateSchema`)

### PATCH /api/admin/products/[id] (Exists — `ProductUpdateSchema`)

### DELETE /api/admin/products/[id] (Exists — soft delete)

### POST /api/upload (Exists — single file, returns `{ url, path, expiresIn }`)

### GET /api/categories (Exists — for dropdown)

## Auth/Guard Pattern

Every admin page follows this pattern in frontmatter:

```astro
---
import { verifyAdminSession } from '@/lib/auth/admin-guard';

const adminUser = await verifyAdminSession(Astro.request);
if (!adminUser) {
  return Astro.redirect(`/login?redirect=${encodeURIComponent(Astro.url.pathname)}`);
}
// Page renders with adminUser available
---
```

## Validation Strategy

| Layer | Schema | Usage |
|-------|--------|-------|
| List query | `ProductAdminListQuerySchema` | Validates `page`, `limit`, `search`, `category`, `availability` |
| Create body | `ProductCreateSchema` | Full validation, all required fields enforced |
| Update body | `ProductUpdateSchema` | Partial (all optional), `slug` omitted |
| Upload | `UploadResponseWrapperSchema` | Validates upload response shape |
| Params | `IdParamsSchema` (`z.string().uuid()`) | Validates `[id]` route param |

Error rendering: Server re-renders page with `errors` object mapped to field `aria-describedby` ids. Flash success/error via session/cookie (or URL `?toast=success`).

## Threat Matrix

N/A — no routing, shell, subprocess, VCS/PR automation, executable-file classification, or process-integration boundary changes. This change adds server-rendered pages and extends existing API with a GET endpoint.

## Migration / Rollout

No database migration required. Rollout steps:
1. Deploy API GET endpoint (`src/pages/api/admin/products/index.ts`)
2. Deploy admin layout and pages
3. Verify auth guard works on all `/admin/*` routes
4. Test image upload flow end-to-end
5. No feature flag needed — admin routes are inaccessible without admin role

## Open Questions

- [ ] Should list page support server-side column sorting (deferred per spec)?
- [ ] Toast/flash message mechanism — use Astro session middleware or URL param?
- [ ] Related products search: dedicated `/api/admin/products/search?q=&limit=10` endpoint or reuse list with `search` param?
- [ ] Slug auto-generation: server-side on blur (requires JS island) or client-side preview only?

## Summary

- **Approach**: Zero-JS server-rendered Astro forms targeting existing admin API
- **Key Decisions**: 4 (form strategy, layout separation, API-first actions, soft-delete UX)
- **Files Affected**: 13 new, 3 modified, 0 deleted
- **Testing Strategy**: Unit (validation schemas), Integration (API endpoints), E2E (admin flows with Playwright)