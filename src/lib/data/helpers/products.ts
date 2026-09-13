/**
 * Helper functions for product data transformation
 * Used by API routes to format product data for Astro pages
 */
import type { Product, Category, Solution, Kit, Offer, Guide, FAQItem } from '@/data/types';

/**
 * Transforms a full product object into a list item (lighter shape for catalog grids)
 */
export function createProductListItem(product: Product) {
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.shortDescription || product.description,
    price: product.price,
    compareAtPrice: product.compareAtPrice,
    currency: product.currency,
    category: product.category,
    images: product.images,
    specs: product.specs,
    features: product.features,
    availability: product.availability,
    featured: product.featured,
    bestSeller: product.bestSeller,
    kitOnly: product.kitOnly,
    whatsappMessage: product.whatsappMessage,
    tags: product.tags,
    seo: product.seo,
    batteryWh: product.batteryWh,
  };
}

/**
 * Determines what a product can power based on batteryWh and specs
 * Returns array of human-readable use cases
 */
export function canPower(product: Product): string[] {
  if (!product.batteryWh) {
    // Products without battery don't power anything
    return [];
  }

  const wh = product.batteryWh;
  const canPower: string[] = [];

  // Power estimates: ~100Wh per LED bulb-hour, ~50Wh per phone charge, ~300Wh per laptop charge
  const phoneCharges = Math.floor(wh / 50);
  const laptopCharges = Math.floor(wh / 300);
  const bulbHours = Math.floor(wh / 100);
  const routerHours = Math.floor(wh / 10);

  if (phoneCharges >= 1) {
    canPower.push(`${phoneCharges} carga(s) de celular`);
  }
  if (laptopCharges >= 1) {
    canPower.push(`${laptopCharges} carga(s) de laptop`);
  }
  if (bulbHours >= 1) {
    canPower.push(`${bulbHours}h de bombilla LED (10W)`);
  }
  if (routerHours >= 1) {
    canPower.push(`${routerHours}h de router/modem`);
  }

  return canPower;
}

/**
 * Generates WhatsApp message for a product
 */
export function generateWhatsAppMessage(product: Product): string {
  return `Hola, estoy interesado en el producto "${product.name}". ¿Está disponible?`;
}

/**
 * Groups FAQ items by category
 */
export function groupFaqsByCategory(faqs: FAQItem[]): Record<string, FAQItem[]> {
  const grouped: Record<string, FAQItem[]> = {};
  // FAQItems don't have a category field, so we group all under "general"
  // or could be extended to support categories
  grouped['general'] = faqs;
  return grouped;
}

export type { Product, Category, Solution, Kit, Offer, Guide, FAQItem };
