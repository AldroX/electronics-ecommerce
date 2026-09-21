/// ============================================================
/// src/lib/api/fetchers.ts - Funciones para getStaticPaths (server-side)
/// Usan Supabase client directamente (no HTTP) para funcionar en build time
/// ============================================================

import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

type ProductListRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  short_description: string | null;
  price: number;
  currency: string;
  category_id: string | null;
  availability: string;
  featured: boolean;
  best_seller: boolean;
  kit_only: boolean;
  whatsapp_message: string;
  images: string[] | null;
  specs: Record<string, string> | null;
  features: string[] | null;
  tags: string[] | null;
  compare_at_price: number | null;
  battery_wh: number | null;
  related_product_ids: string[] | null;
  seo_title: string | null;
  seo_description: string | null;
  seo_image: string | null;
  seo_canonical: string | null;
};

type CategoryRow = {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
};

function getPublicClient() {
  const url = import.meta.env.PUBLIC_SUPABASE_URL;
  const key = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error(
      'Supabase configuration is missing: PUBLIC_SUPABASE_URL and PUBLIC_SUPABASE_ANON_KEY are required.'
    );
  }

  return createClient<Database>(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

// ============================================================
// Types
// ============================================================

export interface FetchProductsResult {
  data: Array<{
    id: string;
    name: string;
    slug: string;
    description: string;
    shortDescription: string;
    price: number;
    currency: string;
    category: string;
    availability: string;
    featured: boolean;
    bestSeller: boolean;
    kitOnly: boolean;
    whatsappMessage: string;
    images: string[];
    specs: Record<string, string>;
    features: string[];
    tags: string[];
    compareAtPrice?: number;
    batteryWh?: number;
    relatedProducts: string[];
    seo: {
      title: string;
      description: string;
      image?: string;
      canonical?: string;
    };
  }>;
  meta: {
    totalPages: number;
    currentPage: number;
    totalCount: number;
  };
}

export interface FetchProductResult {
  id: string;
  name: string;
  slug: string;
  price: number;
  currency: string;
  images: string[];
  specs: Record<string, string>;
  features: string[];
  availability: string;
  whatsappMessage: string;
  relatedProducts: string[];
  canPower: string[];
  seo: {
    title: string;
    description: string;
    image?: string;
    canonical?: string;
  };
}

export interface FetchCategoriesResult {
  data: Array<{
    id: string;
    name: string;
    slug: string;
    description: string;
    image: string;
    productCount: number;
  }>;
  meta: {
    totalPages: number;
    currentPage: number;
    totalCount: number;
  };
}

export interface FetchCategoryResult {
  category: {
    id: string;
    name: string;
    slug: string;
    description: string;
    image: string;
  };
  products: Array<{
    id: string;
    name: string;
    slug: string;
    price: number;
    currency: string;
    images: string[];
    featured: boolean;
  }>;
  totalProducts: number;
}

// ============================================================
// Server-side fetchers (usar en getStaticPaths)
// ============================================================

/**
 * fetchProducts - Lista de productos con filtros para getStaticPaths
 * Usa Supabase directamente (funciona en build time)
 */
export async function fetchProducts(filters?: {
  search?: string;
  category?: string;
  solution?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: 'price-asc' | 'price-desc' | 'name-asc' | 'newest' | 'popular';
  page?: number;
  limit?: number;
}): Promise<FetchProductsResult> {
  const supabase = getPublicClient();
  
  let query = supabase
    .from('products')
    .select(
      'id, name, slug, description, short_description, price, currency, category_id, availability, featured, best_seller, kit_only, whatsapp_message, images, specs, features, tags, compare_at_price, battery_wh, related_product_ids, seo_title, seo_description, seo_image, seo_canonical',
      { count: 'exact' }
    );

  // Filtros
  if (filters?.search) {
    query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%,short_description.ilike.%${filters.search}%`);
  }
  if (filters?.category) {
    query = query.eq('category_id', filters.category);
  }
  if (filters?.minPrice !== undefined) {
    query = query.gte('price', filters.minPrice);
  }
  if (filters?.maxPrice !== undefined) {
    query = query.lte('price', filters.maxPrice);
  }

  // Sorting
  const sortMap = {
    'price-asc': { col: 'price', asc: true },
    'price-desc': { col: 'price', asc: false },
    'name-asc': { col: 'name', asc: true },
    'newest': { col: 'created_at', asc: false },
    'popular': { col: 'best_seller', asc: false },
  };
  const sort = sortMap[filters?.sort || 'newest'];
  query = query.order(sort.col, { ascending: sort.asc });

  // Pagination
  const page = filters?.page || 1;
  const limit = filters?.limit || 12;
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  query = query.range(from, to);

  const { data, error, count } = await query;

  if (error) throw new Error(`Supabase error: ${error.message}`);

  const products = (data as ProductListRow[] | null | undefined) ?? [];

  const { data: categoriesData } = await supabase.from('categories').select('id, slug').returns<{ id: string; slug: string }[]>();
  const categorySlugMap = new Map((categoriesData ?? []).map((category) => [category.id, category.slug]));

  return {
    data: products.map(p => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      description: p.description || '',
      shortDescription: p.short_description || p.description || '',
      price: p.price,
      currency: p.currency,
      category: categorySlugMap.get(p.category_id ?? '') || p.category_id || '',
      availability: p.availability,
      featured: p.featured,
      bestSeller: p.best_seller,
      kitOnly: p.kit_only,
      whatsappMessage: p.whatsapp_message,
      images: p.images || [],
      specs: p.specs || {},
      features: p.features || [],
      tags: p.tags || [],
      compareAtPrice: p.compare_at_price || undefined,
      batteryWh: p.battery_wh || undefined,
      relatedProducts: p.related_product_ids || [],
      seo: {
        title: p.seo_title || p.name,
        description: p.seo_description || p.short_description || p.description || '',
        image: p.seo_image || p.images?.[0],
        canonical: p.seo_canonical || `/producto/${p.slug}`,
      },
    })),
    meta: {
      totalPages: Math.ceil((count || 0) / limit),
      currentPage: page,
      totalCount: count || 0,
    },
  };
}

/**
 * fetchProduct - Detalle de producto por slug para getStaticPaths
 */
export async function fetchProduct(slug: string): Promise<FetchProductResult | null> {
  const supabase = getPublicClient();

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error || !data) return null;

  const product = data as {
    id: string;
    name: string;
    slug: string;
    price: number;
    currency: string;
    images: string[] | null;
    specs: Record<string, string> | null;
    features: string[] | null;
    availability: string;
    whatsapp_message: string;
    related_product_ids: string[] | null;
    battery_wh: number | null;
    seo_title: string | null;
    seo_description: string | null;
    short_description: string | null;
    seo_image: string | null;
    seo_canonical: string | null;
  };

  // Fetch related products
  const relatedIds = product.related_product_ids || [];
  let relatedProducts: string[] = [];
  if (relatedIds.length > 0) {
    const relatedResult = await supabase
      .from('products')
      .select('slug')
      .in('id', relatedIds) as { data: Array<{ slug: string }> | null };

    const related = relatedResult.data ?? [];
    relatedProducts = related.map(r => r.slug);
  }

  // Compute canPower
  const canPower: string[] = [];
  const batteryWh = product.battery_wh || 0;
  if (batteryWh > 0) {
    const phoneCharges = Math.floor(batteryWh / 50);
    const laptopCharges = Math.floor(batteryWh / 300);
    const bulbHours = Math.floor(batteryWh / 100);
    if (phoneCharges >= 1) canPower.push(`${phoneCharges} carga(s) de celular`);
    if (laptopCharges >= 1) canPower.push(`${laptopCharges} carga(s) de laptop`);
    if (bulbHours >= 1) canPower.push(`${bulbHours}h de bombilla LED (10W)`);
  }

  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    price: product.price,
    currency: product.currency,
    images: product.images || [],
    specs: product.specs || {},
    features: product.features || [],
    availability: product.availability,
    whatsappMessage: product.whatsapp_message,
    relatedProducts,
    canPower,
    seo: {
      title: product.seo_title || product.name,
      description: product.seo_description || product.short_description || '',
      image: product.seo_image || product.images?.[0],
      canonical: product.seo_canonical || `/producto/${product.slug}`,
    },
  };
}

/**
 * fetchCategories - Lista de categorías para getStaticPaths
 */
export async function fetchCategories(filters?: {
  search?: string;
  page?: number;
  limit?: number;
}): Promise<FetchCategoriesResult> {
  const supabase = getPublicClient();
  
  let query = supabase
    .from('categories')
    .select('id, name, slug, description, image', { count: 'exact' });

  if (filters?.search) {
    query = query.ilike('name', `%${filters.search}%`);
  }

  query = query.order('name', { ascending: true });

  const page = filters?.page || 1;
  const limit = filters?.limit || 12;
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  query = query.range(from, to);

  const { data, error, count } = await query;

  if (error) throw new Error(`Supabase error: ${error.message}`);

  const categories = (data as CategoryRow[] | null | undefined) ?? [];

  return {
    data: categories.map(c => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      description: c.description,
      image: c.image,
      productCount: 0, // Could be computed separately if needed
    })),
    meta: {
      totalPages: Math.ceil((count || 0) / limit),
      currentPage: page,
      totalCount: count || 0,
    },
  };
}

/**
 * fetchCategory - Categoría con productos para getStaticPaths
 */
export async function fetchCategory(slug: string, options?: {
  page?: number;
  perPage?: number;
}): Promise<FetchCategoryResult | null> {
  const supabase = getPublicClient();

  // Get category
  const categoryResult = await supabase
    .from('categories')
    .select('id, name, slug, description, image')
    .eq('slug', slug)
    .maybeSingle();

  const category = categoryResult.data as {
    id: string;
    name: string;
    slug: string;
    description: string;
    image: string;
  } | null;
  const catError = categoryResult.error;

  if (catError || !category) return null;

  // Get products in category
  const productsResult = await supabase
    .from('products')
    .select('id, name, slug, price, currency, images, featured', { count: 'exact' })
    .eq('category_id', category.id)
    .order('created_at', { ascending: false });

  const products = (productsResult.data as Array<{
    id: string;
    name: string;
    slug: string;
    price: number;
    currency: string;
    images: string[] | null;
    featured: boolean;
  }> | null) ?? [];
  const count = productsResult.count ?? 0;

  const page = options?.page || 1;
  const perPage = options?.perPage || 12;

  return {
    category: {
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description,
      image: category.image,
    },
    products: (products || []).map(p => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      price: p.price,
      currency: p.currency,
      images: p.images || [],
      featured: p.featured,
    })),
    totalProducts: count || 0,
  };
}