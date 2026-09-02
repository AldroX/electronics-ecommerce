import type { Guide } from '../types';
import guidesData from '../guias.json';

const guides: Guide[] = guidesData as unknown as Guide[];

export function getAllGuides(): Guide[] {
  return guides;
}

export function getGuideBySlug(slug: string): Guide | undefined {
  return guides.find((guide) => guide.slug === slug);
}
