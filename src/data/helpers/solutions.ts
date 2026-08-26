import type { Solution } from '../types';
import solutionsData from '../solutions.json';

const solutions: Solution[] = solutionsData as Solution[];

export function getAllSolutions(): Solution[] {
  return solutions;
}

export function getSolutionBySlug(slug: string): Solution | undefined {
  return solutions.find((solution) => solution.slug === slug);
}

export function getSolutionByProduct(productId: string): Solution | undefined {
  return solutions.find((solution) => solution.products.includes(productId));
}