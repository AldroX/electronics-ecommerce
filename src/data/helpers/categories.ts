import type { Category } from '../types';
import categoriesData from '../categories.json';

const categories: Category[] = categoriesData as Category[];

export function getAllCategories(): Category[] {
  return categories;
}

export function getCategoryBySlug(slug: string): Category | undefined {
  return categories.find((category) => category.slug === slug);
}