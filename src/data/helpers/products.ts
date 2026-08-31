import type { Product } from '../types';
import productsData from '../products.json';

const products: Product[] = productsData as unknown as Product[];

export function getAllProducts(): Product[] {
  return products;
}

export function getProductBySlug(slug: string): Product | undefined {
  return products.find((product) => product.slug === slug);
}

export function getProductsByCategory(category: string): Product[] {
  return products.filter((product) => product.category === category);
}

export function getFeaturedProducts(): Product[] {
  return products.filter((product) => product.featured);
}

export function getBestSellers(): Product[] {
  return products.filter((product) => product.bestSeller);
}

export function searchProducts(query: string): Product[] {
  const lowerQuery = query.toLowerCase();
  return products.filter(
    (product) =>
      product.name.toLowerCase().includes(lowerQuery) ||
      product.description.toLowerCase().includes(lowerQuery) ||
      product.shortDescription.toLowerCase().includes(lowerQuery)
  );
}

// ============================================================
// Filter / Sort / Paginate helpers for /productos catalog page
// ============================================================

export interface FilterState {
  search?: string;
  categories?: string[];
  priceMin?: number;
  priceMax?: number;
  availability?: ('in-stock' | 'limited' | 'out-of-stock')[];
}

export type SortOption = 'price-asc' | 'price-desc' | 'name-asc' | 'newest';

/**
 * Filter products by search term, categories, price range, and availability.
 * All filters are combined with AND logic.
 */
export function filterProducts(products: Product[], filters: FilterState): Product[] {
  let result = [...products];

  // Search filter
  if (filters.search && filters.search.trim() !== '') {
    const query = filters.search.toLowerCase().trim();
    result = result.filter(
      (product) =>
        product.name.toLowerCase().includes(query) ||
        product.description.toLowerCase().includes(query) ||
        product.shortDescription.toLowerCase().includes(query) ||
        product.tags.some((tag) => tag.toLowerCase().includes(query))
    );
  }

  // Category filter (checkboxes - OR logic within categories)
  if (filters.categories && filters.categories.length > 0) {
    result = result.filter((product) => filters.categories!.includes(product.category));
  }

  // Price range filter
  if (typeof filters.priceMin === 'number' && !Number.isNaN(filters.priceMin)) {
    result = result.filter((product) => product.price >= filters.priceMin!);
  }
  if (typeof filters.priceMax === 'number' && !Number.isNaN(filters.priceMax)) {
    result = result.filter((product) => product.price <= filters.priceMax!);
  }

  // Availability filter (array — any selected value matches)
  if (filters.availability && filters.availability.length > 0) {
    result = result.filter((product) =>
      filters.availability!.includes(product.availability)
    );
  }

  return result;
}

/**
 * Sort products by price (asc/desc), name (A-Z), or newest (by ID as proxy).
 * Default: newest (preserves original order which reflects creation time).
 */
export function sortProducts(products: Product[], sortBy: SortOption): Product[] {
  const sorted = [...products];

  switch (sortBy) {
    case 'price-asc':
      sorted.sort((a, b) => a.price - b.price);
      break;
    case 'price-desc':
      sorted.sort((a, b) => b.price - a.price);
      break;
    case 'name-asc':
      sorted.sort((a, b) => a.name.localeCompare(b.name, 'es'));
      break;
    case 'newest':
    default:
      // Preserve original order (newest first by ID order in JSON)
      break;
  }

  return sorted;
}

/**
 * Paginate an array of items. Compatible with Astro.paginate() return shape.
 * Returns { data: T[]; totalPages: number; currentPage: number }
 */
export function paginateProducts<T>(
  items: T[],
  page: number,
  perPage: number
): { data: T[]; totalPages: number; currentPage: number } {
  const totalPages = Math.ceil(items.length / perPage);
  const currentPage = Math.max(1, Math.min(page, totalPages));
  const start = (currentPage - 1) * perPage;
  const end = start + perPage;

  return {
    data: items.slice(start, end),
    totalPages,
    currentPage,
  };
}
