import { z } from 'zod';

// ============================================================
// Query Parameter Schemas
// ============================================================

// Product list query parameters
export const ProductListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  perPage: z.coerce.number().int().positive().max(100).default(12),
  category: z.string().optional(),
  search: z.string().optional(),
  sort: z.enum(['price-asc', 'price-desc', 'name-asc', 'newest']).default('newest'),
  availability: z.array(z.enum(['in-stock', 'limited', 'out-of-stock'])).optional(),
  featured: z.coerce.boolean().optional(),
  bestSeller: z.coerce.boolean().optional(),
  minPrice: z.coerce.number().positive().optional(),
  maxPrice: z.coerce.number().positive().optional(),
  solution: z.string().uuid().optional(),
});

export type ProductListQuery = z.infer<typeof ProductListQuerySchema>;

// Extended product list query (with "popular" sort)
export const ProductListQueryExtendedSchema = ProductListQuerySchema.extend({
  sort: z.enum(['price-asc', 'price-desc', 'name-asc', 'newest', 'popular']).default('newest'),
});

export type ProductListQueryExtended = z.infer<typeof ProductListQueryExtendedSchema>;

// Category query params
export const CategoryQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  perPage: z.coerce.number().int().positive().max(100).default(12),
  search: z.string().optional(),
});

export type CategoryQuery = z.infer<typeof CategoryQuerySchema>;

// Category slug params
export const CategorySlugSchema = z.object({
  slug: z.string().min(1),
});

export type CategorySlug = z.infer<typeof CategorySlugSchema>;

// Offer list query params (with validUntil filter)
export const OfferListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  perPage: z.coerce.number().int().positive().max(100).default(12),
  availability: z.array(z.enum(['in-stock', 'limited', 'out-of-stock'])).optional(),
  validUntil: z.string().optional(),
  active: z.coerce.boolean().optional(),
});

export type OfferListQuery = z.infer<typeof OfferListQuerySchema>;

// FAQ query params
export const FAQQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  perPage: z.coerce.number().int().positive().max(100).default(12),
  categoria: z.string().optional(),
});

export type FAQQuery = z.infer<typeof FAQQuerySchema>;

// Guide list query params
export const GuideQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  perPage: z.coerce.number().int().positive().max(100).default(12),
  search: z.string().optional(),
  categoria: z.string().optional(),
});

export type GuideQuery = z.infer<typeof GuideQuerySchema>;

// Solution list query params
export const SolutionQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  perPage: z.coerce.number().int().positive().max(100).default(12),
  search: z.string().optional(),
});

export type SolutionQuery = z.infer<typeof SolutionQuerySchema>;

// Kits query params
export const KitQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  perPage: z.coerce.number().int().positive().max(100).default(12),
});

export type KitQuery = z.infer<typeof KitQuerySchema>;

// Slug param
export const SlugSchema = z.object({
  slug: z.string().min(1),
});

export type SlugParam = z.infer<typeof SlugSchema>;

// ============================================================
// Response Schemas
// ============================================================

// Product list item (lightweight for grids)
export const ProductListItemSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  description: z.string().optional(),
  price: z.number().positive(),
  compareAtPrice: z.number().positive().optional(),
  currency: z.string().length(3),
  category: z.string().regex(/^[a-z0-9-]+$/),
  images: z.array(z.string()),
  specs: z.record(z.string(), z.string()),
  features: z.array(z.string()),
  availability: z.enum(['in-stock', 'limited', 'out-of-stock']),
  featured: z.boolean(),
  bestSeller: z.boolean(),
  kitOnly: z.boolean(),
  whatsappMessage: z.string(),
  tags: z.array(z.string()),
  seo: z
    .object({
      title: z.string(),
      description: z.string(),
      image: z.string().optional(),
      canonical: z.string().optional(),
    })
    .optional(),
  batteryWh: z.number().positive().optional(),
});

export type ProductListItem = z.infer<typeof ProductListItemSchema>;

// Product list response
export const ProductListResponseSchema = z.object({
  data: z.array(ProductListItemSchema),
  totalPages: z.number().int(),
  currentPage: z.number().int(),
  totalCount: z.number().int(),
});

export type ProductListResponse = z.infer<typeof ProductListResponseSchema>;

// Product detail response
export const ProductDetailSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  description: z.string(),
  shortDescription: z.string(),
  price: z.number().positive(),
  compareAtPrice: z.number().positive().optional(),
  currency: z.string().length(3),
  category: z
    .object({
      id: z.string().uuid(),
      name: z.string(),
      slug: z.string(),
    })
    .nullable(),
  images: z.array(z.string()),
  specs: z.record(z.string(), z.string()),
  features: z.array(z.string()),
  availability: z.enum(['in-stock', 'limited', 'out-of-stock']),
  featured: z.boolean(),
  bestSeller: z.boolean(),
  kitOnly: z.boolean(),
  whatsappMessage: z.string(),
  tags: z.array(z.string()),
  seo: z.object({
    title: z.string(),
    description: z.string(),
    image: z.string().optional(),
    canonical: z.string().optional(),
  }),
  relatedProducts: z.array(z.string()),
  canPower: z.array(z.string()),
  batteryWh: z.number().positive().optional(),
});

export type ProductDetail = z.infer<typeof ProductDetailSchema>;

// Product detail response wrapper
export const ProductDetailResponseSchema = z.object({
  ok: z.literal(true),
  data: ProductDetailSchema,
});

export type ProductDetailResponse = z.infer<typeof ProductDetailResponseSchema>;

// Category list item
export const CategoryListItemSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  description: z.string(),
  image: z.string(),
  productCount: z.number().int().optional(),
  seo: z
    .object({
      title: z.string().optional(),
      description: z.string().optional(),
      image: z.string().optional(),
      canonical: z.string().optional(),
    })
    .optional(),
});

export type CategoryListItem = z.infer<typeof CategoryListItemSchema>;

// Category list response
export const CategoryListResponseSchema = z.object({
  data: z.array(CategoryListItemSchema),
  totalPages: z.number().int(),
  currentPage: z.number().int(),
  totalCount: z.number().int(),
});

export type CategoryListResponse = z.infer<typeof CategoryListResponseSchema>;

// Category detail response
export const CategoryDetailSchema = z.object({
  category: z.object({
    id: z.string().uuid(),
    name: z.string().min(1),
    slug: z.string().regex(/^[a-z0-9-]+$/),
    description: z.string(),
    image: z.string(),
  }),
  products: z.array(ProductListItemSchema),
  totalProducts: z.number().int(),
});

export type CategoryDetail = z.infer<typeof CategoryDetailSchema>;

// Category detail response wrapper
export const CategoryDetailResponseSchema = z.object({
  ok: z.literal(true),
  data: CategoryDetailSchema,
});

export type CategoryDetailResponse = z.infer<typeof CategoryDetailResponseSchema>;

// Solution list item
export const SolutionListItemSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  description: z.string(),
  icon: z.string(),
  productCount: z.number().int(),
  seo: z
    .object({
      title: z.string().optional(),
      description: z.string().optional(),
      image: z.string().optional(),
      canonical: z.string().optional(),
    })
    .optional(),
});

export type SolutionListItem = z.infer<typeof SolutionListItemSchema>;

// Solution list response
export const SolutionListResponseSchema = z.object({
  data: z.array(SolutionListItemSchema),
  totalPages: z.number().int(),
  currentPage: z.number().int(),
  totalCount: z.number().int(),
});

export type SolutionListResponse = z.infer<typeof SolutionListResponseSchema>;

// Solution detail response
export const SolutionDetailSchema = z.object({
  solution: z.object({
    id: z.string().uuid(),
    name: z.string().min(1),
    slug: z.string().regex(/^[a-z0-9-]+$/),
    description: z.string(),
    icon: z.string(),
  }),
  products: z.array(ProductListItemSchema),
  featuredKit: z
    .object({
      id: z.string().uuid(),
      name: z.string(),
      slug: z.string(),
      price: z.number().positive(),
      discount: z.string(),
    })
    .nullable(),
  totalProducts: z.number().int(),
});

export type SolutionDetail = z.infer<typeof SolutionDetailSchema>;

// Solution detail response wrapper
export const SolutionDetailResponseSchema = z.object({
  ok: z.literal(true),
  data: SolutionDetailSchema,
});

export type SolutionDetailResponse = z.infer<typeof SolutionDetailResponseSchema>;

// Kit list item
export const KitListItemSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  description: z.string(),
  price: z.number().positive(),
  compareAtPrice: z.number().positive().nullable(),
  discount: z.string(),
  productCount: z.number().int(),
  seo: z
    .object({
      title: z.string().optional(),
      description: z.string().optional(),
      image: z.string().optional(),
      canonical: z.string().optional(),
    })
    .optional(),
});

export type KitListItem = z.infer<typeof KitListItemSchema>;

// Kit list response
export const KitListResponseSchema = z.object({
  data: z.array(KitListItemSchema),
  totalPages: z.number().int(),
  currentPage: z.number().int(),
  totalCount: z.number().int(),
});

export type KitListResponse = z.infer<typeof KitListResponseSchema>;

// Offer list item
export const OfferListItemSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  description: z.string(),
  image: z.string(),
  originalPrice: z.number().positive(),
  currentPrice: z.number().positive(),
  discountPercent: z.number().int().positive(),
  availability: z.enum(['in-stock', 'limited', 'out-of-stock']),
  validUntil: z.string().datetime(),
  productSlug: z.string(),
  whatsappMessage: z.string(),
});

export type OfferListItem = z.infer<typeof OfferListItemSchema>;

// Offer list response
export const OfferListResponseSchema = z.object({
  data: z.array(OfferListItemSchema),
  totalPages: z.number().int(),
  currentPage: z.number().int(),
  totalCount: z.number().int(),
});

export type OfferListResponse = z.infer<typeof OfferListResponseSchema>;

// Offer detail response
export const OfferDetailSchema = z.object({
  offer: z.object({
    id: z.string().uuid(),
    name: z.string().min(1),
    slug: z.string().regex(/^[a-z0-9-]+$/),
    description: z.string(),
    image: z.string(),
    originalPrice: z.number().positive(),
    currentPrice: z.number().positive(),
    discountPercent: z.number().int().positive(),
    availability: z.enum(['in-stock', 'limited', 'out-of-stock']),
    validUntil: z.string().datetime(),
    timeRemaining: z.number().int(),
    product: z
      .object({
        id: z.string().uuid(),
        name: z.string(),
        slug: z.string(),
        price: z.number().positive(),
        currency: z.string().length(3),
        images: z.array(z.string()),
      })
      .nullable(),
    whatsappMessage: z.string(),
  }),
});

export type OfferDetail = z.infer<typeof OfferDetailSchema>;

// Offer detail response wrapper
export const OfferDetailResponseSchema = z.object({
  ok: z.literal(true),
  data: OfferDetailSchema,
});

export type OfferDetailResponse = z.infer<typeof OfferDetailResponseSchema>;

// Guide list item
export const GuideListItemSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  description: z.string(),
  image: z.string(),
  productCount: z.number().int(),
  seo: z
    .object({
      title: z.string().optional(),
      description: z.string().optional(),
      image: z.string().optional(),
      canonical: z.string().optional(),
    })
    .optional(),
});

export type GuideListItem = z.infer<typeof GuideListItemSchema>;

// Guide list response
export const GuideListResponseSchema = z.object({
  data: z.array(GuideListItemSchema),
  totalPages: z.number().int(),
  currentPage: z.number().int(),
  totalCount: z.number().int(),
});

export type GuideListResponse = z.infer<typeof GuideListResponseSchema>;

// Guide detail response
export const GuideDetailSchema = z.object({
  guide: z.object({
    id: z.string().uuid(),
    title: z.string().min(1),
    slug: z.string().regex(/^[a-z0-9-]+$/),
    description: z.string(),
    image: z.string(),
    content: z.string(),
    readTime: z.number().int(),
  }),
  relatedGuides: z.array(
    z.object({
      id: z.string().uuid(),
      title: z.string(),
      slug: z.string(),
    })
  ),
});

export type GuideDetail = z.infer<typeof GuideDetailSchema>;

// Guide detail response wrapper
export const GuideDetailResponseSchema = z.object({
  ok: z.literal(true),
  data: GuideDetailSchema,
});

export type GuideDetailResponse = z.infer<typeof GuideDetailResponseSchema>;

// FAQ item
export const FAQItemSchema = z.object({
  id: z.string().uuid(),
  question: z.string(),
  answer: z.string(),
});

export type FAQItem = z.infer<typeof FAQItemSchema>;

// FAQ grouped by category
export const FAQGroupSchema = z.object({
  category: z.string(),
  faqs: z.array(FAQItemSchema),
});

export type FAQGroup = z.infer<typeof FAQGroupSchema>;

// FAQ list response
export const FAQListResponseSchema = z.object({
  data: z.array(FAQGroupSchema),
  totalCount: z.number().int(),
});

export type FAQListResponse = z.infer<typeof FAQListResponseSchema>;

// FAQ list response wrapper
export const FAQListResponseWrapperSchema = z.object({
  ok: z.literal(true),
  data: FAQListResponseSchema,
});

export type FAQListResponseWrapper = z.infer<typeof FAQListResponseWrapperSchema>;

// Upload response
export const UploadResponseSchema = z.object({
  url: z.string().url(),
  path: z.string(),
  expiresIn: z.number().int(),
  fileName: z.string(),
  size: z.number().int(),
  mimeType: z.string(),
});

export type UploadResponse = z.infer<typeof UploadResponseSchema>;

// Upload response wrapper
export const UploadResponseWrapperSchema = z.object({
  ok: z.literal(true),
  data: UploadResponseSchema,
});

export type UploadResponseWrapper = z.infer<typeof UploadResponseWrapperSchema>;

// Generic paginated response wrapper
export const PaginatedResponseSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    data: z.array(itemSchema),
    totalPages: z.number().int(),
    currentPage: z.number().int(),
    totalCount: z.number().int(),
  });

// Generic success response wrapper
export const SuccessResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    ok: z.literal(true),
    data: dataSchema,
  });

// ============================================================
// Admin Create/Update Schemas (Task 3.3-3.6)
// ============================================================

// Product admin schemas
export const ProductCreateSchema = z.object({
  name: z.string().min(1).max(200),
  slug: z
    .string()
    .regex(/^[a-z0-9-]+$/)
    .min(1)
    .max(200),
  description: z.string().min(1),
  short_description: z.string().min(1).max(500),
  price: z.number().positive(),
  compare_at_price: z.number().positive().nullable().optional(),
  currency: z.enum(['USD', 'ARS', 'EUR']).default('ARS'),
  category_id: z.string().uuid(),
  images: z.array(z.string().url()).min(1),
  specs: z.record(z.string(), z.string()).default({}),
  features: z.array(z.string()).default([]),
  availability: z.enum(['in-stock', 'limited', 'out-of-stock']).default('in-stock'),
  featured: z.boolean().default(false),
  best_seller: z.boolean().default(false),
  kit_only: z.boolean().default(false),
  whatsapp_message: z.string().min(1),
  tags: z.array(z.string()).default([]),
  seo_title: z.string().optional().nullable(),
  seo_description: z.string().optional().nullable(),
  seo_image: z.string().optional().nullable(),
  seo_canonical: z.string().optional().nullable(),
  related_product_ids: z.array(z.string().uuid()).default([]),
  battery_wh: z.number().positive().nullable().optional(),
});

export type ProductCreate = z.infer<typeof ProductCreateSchema>;

export const ProductUpdateSchema = ProductCreateSchema.partial()
  .extend({
    id: z.string().uuid(),
  })
  .omit({ slug: true }); // slug not updatable

export type ProductUpdate = z.infer<typeof ProductUpdateSchema>;

// Category admin schemas
export const CategoryCreateSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z
    .string()
    .regex(/^[a-z0-9-]+$/)
    .min(1)
    .max(100),
  description: z.string().min(1),
  image: z.string().url(),
  product_ids: z.array(z.string().uuid()).default([]),
  seo_title: z.string().optional().nullable(),
  seo_description: z.string().optional().nullable(),
  seo_image: z.string().optional().nullable(),
  seo_canonical: z.string().optional().nullable(),
});

export type CategoryCreate = z.infer<typeof CategoryCreateSchema>;

export const CategoryUpdateSchema = CategoryCreateSchema.partial()
  .extend({
    id: z.string().uuid(),
  })
  .omit({ slug: true });

export type CategoryUpdate = z.infer<typeof CategoryUpdateSchema>;

// Solution admin schemas
export const SolutionCreateSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z
    .string()
    .regex(/^[a-z0-9-]+$/)
    .min(1)
    .max(100),
  description: z.string().min(1),
  icon: z.string().min(1),
  product_ids: z.array(z.string().uuid()).default([]),
  seo_title: z.string().optional().nullable(),
  seo_description: z.string().optional().nullable(),
  seo_image: z.string().optional().nullable(),
  seo_canonical: z.string().optional().nullable(),
});

export type SolutionCreate = z.infer<typeof SolutionCreateSchema>;

export const SolutionUpdateSchema = SolutionCreateSchema.partial()
  .extend({
    id: z.string().uuid(),
  })
  .omit({ slug: true });

export type SolutionUpdate = z.infer<typeof SolutionUpdateSchema>;

// Kit admin schemas
export const KitCreateSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z
    .string()
    .regex(/^[a-z0-9-]+$/)
    .min(1)
    .max(100),
  description: z.string().min(1),
  product_ids: z.array(z.string().uuid()).min(1),
  price: z.number().positive(),
  compare_at_price: z.number().positive().nullable().optional(),
  seo_title: z.string().optional().nullable(),
  seo_description: z.string().optional().nullable(),
  seo_image: z.string().optional().nullable(),
  seo_canonical: z.string().optional().nullable(),
});

export type KitCreate = z.infer<typeof KitCreateSchema>;

export const KitUpdateSchema = KitCreateSchema.partial()
  .extend({
    id: z.string().uuid(),
  })
  .omit({ slug: true });

export type KitUpdate = z.infer<typeof KitUpdateSchema>;

// Offer admin schemas
export const OfferCreateSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z
    .string()
    .regex(/^[a-z0-9-]+$/)
    .min(1)
    .max(100),
  description: z.string().min(1),
  image: z.string().url(),
  original_price: z.number().positive(),
  current_price: z.number().positive(),
  discount_percent: z.number().int().positive().max(100),
  availability: z.enum(['in-stock', 'limited', 'out-of-stock']).default('in-stock'),
  valid_until: z.string().datetime(),
  currency: z.enum(['USD', 'ARS', 'EUR']).default('ARS'),
  whatsapp_message: z.string().min(1),
  product_slug: z.string().min(1),
  seo_title: z.string().optional().nullable(),
  seo_description: z.string().optional().nullable(),
  seo_image: z.string().optional().nullable(),
});

export type OfferCreate = z.infer<typeof OfferCreateSchema>;

export const OfferUpdateSchema = OfferCreateSchema.partial()
  .extend({
    id: z.string().uuid(),
  })
  .omit({ slug: true });

export type OfferUpdate = z.infer<typeof OfferUpdateSchema>;

// Guide admin schemas
export const GuideCreateSchema = z.object({
  title: z.string().min(1).max(200),
  slug: z
    .string()
    .regex(/^[a-z0-9-]+$/)
    .min(1)
    .max(200),
  description: z.string().min(1),
  image: z.string().url(),
  content: z.string().min(1),
  product_ids: z.array(z.string().uuid()).default([]),
  read_time: z.number().int().positive().default(5),
  seo_title: z.string().optional().nullable(),
  seo_description: z.string().optional().nullable(),
  seo_image: z.string().optional().nullable(),
  seo_canonical: z.string().optional().nullable(),
});

export type GuideCreate = z.infer<typeof GuideCreateSchema>;

export const GuideUpdateSchema = GuideCreateSchema.partial()
  .extend({
    id: z.string().uuid(),
  })
  .omit({ slug: true });

export type GuideUpdate = z.infer<typeof GuideUpdateSchema>;

// FAQ admin schemas
export const FAQCreateSchema = z.object({
  question: z.string().min(1),
  answer: z.string().min(1),
});

export type FAQCreate = z.infer<typeof FAQCreateSchema>;

export const FAQUpdateSchema = FAQCreateSchema.partial().extend({
  id: z.string().uuid(),
});

export type FAQUpdate = z.infer<typeof FAQUpdateSchema>;

// Admin response wrappers
export const AdminCreateResponseSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    ok: z.literal(true),
    data: itemSchema,
  });

export const AdminUpdateResponseSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    ok: z.literal(true),
    data: itemSchema,
  });

export const AdminDeleteResponseSchema = z.object({
  ok: z.literal(true),
  message: z.string(),
});

// Generic error response wrapper
export const ErrorResponseSchema = z.object({
  ok: z.literal(false),
  error: z.object({
    code: z.string(),
    message: z.string(),
    issues: z.array(z.unknown()).optional(),
  }),
});

export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
