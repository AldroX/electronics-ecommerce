import type { Kit } from '../types';
import kitsData from '../kits.json';

const kits: Kit[] = kitsData as unknown as Kit[];

export function getAllKits(): Kit[] {
  return kits;
}

export function getKitBySlug(slug: string): Kit | undefined {
  return kits.find((kit) => kit.slug === slug);
}