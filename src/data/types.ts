import { z } from 'zod';

export interface SEOData {
  title: string;
  description: string;
  image?: string;
  canonical?: string;
}

export const SEODataSchema = z.object({
  title: z.string(),
  description: z.string(),
  image: z.string().optional(),
  canonical: z.string().optional(),
});

export type SEODataZod = z.infer<typeof SEODataSchema>;

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  price: number;
  compareAtPrice?: number;
  currency: string;
  category: string;
  images: string[];
  specs: Record<string, string>;
  features: string[];
  availability: 'in-stock' | 'limited' | 'out-of-stock';
  featured: boolean;
  bestSeller: boolean;
  kitOnly: boolean;
  whatsappMessage: string;
  tags: string[];
  seo: SEOData;
  relatedProducts: string[];
  /** Battery capacity in watt-hours, only for products that store energy (power stations, batteries, battery kits). */
  batteryWh?: number;
}

export const ProductSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  description: z.string(),
  shortDescription: z.string(),
  price: z.number().positive(),
  compareAtPrice: z.number().positive().optional(),
  currency: z.string().length(3).default('ARS'),
  category: z.string(),
  images: z.array(z.string().url()).min(1),
  specs: z.record(z.string(), z.string()),
  features: z.array(z.string()),
  availability: z.enum(['in-stock', 'limited', 'out-of-stock']),
  featured: z.boolean(),
  bestSeller: z.boolean(),
  kitOnly: z.boolean(),
  whatsappMessage: z.string(),
  tags: z.array(z.string()),
  seo: SEODataSchema,
  relatedProducts: z.array(z.string().uuid()),
  batteryWh: z.number().positive().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type ProductZod = z.infer<typeof ProductSchema>;

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  products: string[];
  seo: SEOData;
}

export interface Solution {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  products: string[];
  seo: SEOData;
}

export interface Kit {
  id: string;
  name: string;
  slug: string;
  description: string;
  products: string[];
  price: number;
  compareAtPrice?: number;
  seo: SEOData;
}

export interface Guide {
  id: string;
  title: string;
  slug: string;
  description: string;
  image: string;
  content: string; // RAW HTML article body
  products: string[];
  readTime: number;
  seo: SEOData;
}

export interface FAQItem {
  id: string;
  question: string;
  /** Plain text with optional inline HTML anchors, e.g. <a href="/guias/...">. */
  answer: string;
}

export interface Offer {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  originalPrice: number;
  currentPrice: number;
  discountPercent: number;
  availability: 'in-stock' | 'limited' | 'out-of-stock';
  validUntil: string; // ISO date string
  currency: string;
  whatsappMessage: string;
  productSlug: string;
  seo?: SEOData;
}

// ============================================================
// Admin Product Types (Task T03)
// ============================================================

/** Lightweight product item for admin list table */
export interface ProductAdminListItem {
  id: string;
  name: string;
  slug: string;
  categoryName: string;
  price: number;
  currency: string;
  availability: 'in-stock' | 'limited' | 'out-of-stock';
  featured: boolean;
  bestSeller: boolean;
  thumbnail?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

/** Paginated admin product list response */
export interface ProductAdminListResponse {
  products: ProductAdminListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/** Full product detail for admin edit page */
export interface ProductAdminDetail {
  id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  price: number;
  compareAtPrice?: number | null;
  currency: string;
  categoryId: string;
  categoryName: string;
  images: string[];
  specs: Record<string, string>;
  features: string[];
  availability: 'in-stock' | 'limited' | 'out-of-stock';
  featured: boolean;
  bestSeller: boolean;
  kitOnly: boolean;
  whatsappMessage: string;
  tags: string[];
  seo: SEOData;
  relatedProductIds: string[];
  batteryWh?: number | null;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}
