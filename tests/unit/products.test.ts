/// Unit tests for product helpers
/// Run: pnpm test tests/unit/products.test.ts

import { describe, it, expect } from 'vitest';
import { filterProducts, sortProducts, paginateProducts } from '@/data/helpers/products';
import {
  createProductListItem,
  canPower,
  generateWhatsAppMessage,
  groupFaqsByCategory,
} from '@/lib/data/helpers/products';
import type { Product } from '@/data/types';

const mockProducts: Product[] = [
  {
    id: '1',
    name: 'Solar Panel 450W',
    slug: 'solar-panel-450w',
    description: 'High efficiency panel',
    shortDescription: '450W mono panel',
    price: 189.99,
    compareAtPrice: 229.99,
    currency: 'USD',
    category: 'energia-solar',
    images: ['@/assets/panel.webp'],
    specs: { Potencia: '450W' },
    features: ['Alta eficiencia', 'Garantía 25 años'],
    availability: 'in-stock',
    featured: true,
    bestSeller: true,
    kitOnly: false,
    whatsappMessage: 'Hola, interesado en panel solar',
    tags: ['solar', 'panel'],
    seo: { title: 'Panel Solar', description: 'Best panel' },
    batteryWh: 500,
    relatedProducts: ['2'],
  },
  {
    id: '2',
    name: 'Battery 200Ah LiFePO4',
    slug: 'battery-200ah',
    description: 'Deep cycle battery',
    shortDescription: '200Ah LiFePO4',
    price: 599.99,
    compareAtPrice: undefined,
    currency: 'USD',
    category: 'respaldo-almacenamiento',
    images: ['@/assets/battery.webp'],
    specs: { Capacidad: '200Ah', Voltaje: '12.8V' },
    features: ['Larga vida', 'Seguro'],
    availability: 'limited',
    featured: false,
    bestSeller: false,
    kitOnly: false,
    whatsappMessage: 'Hola, interesado en batería',
    tags: ['bateria', 'lifepo4'],
    seo: { title: 'Batería LiFePO4', description: 'Best battery' },
    batteryWh: 2560,
    relatedProducts: ['1'],
  },
  {
    id: '3',
    name: 'LED Bulb 10W',
    slug: 'led-bulb-10w',
    description: 'Efficient LED',
    shortDescription: '10W LED bulb',
    price: 4.99,
    compareAtPrice: 6.99,
    currency: 'USD',
    category: 'iluminacion',
    images: ['@/assets/bulb.webp'],
    specs: { Potencia: '10W', Lúmenes: '800' },
    features: ['Bajo consumo'],
    availability: 'out-of-stock',
    featured: false,
    bestSeller: false,
    kitOnly: false,
    whatsappMessage: 'Hola, interesado en LED',
    tags: ['led', 'iluminacion'],
    seo: { title: 'LED Bulb', description: 'Efficient bulb' },
    batteryWh: undefined,
    relatedProducts: [],
  },
];

describe('filterProducts', () => {
  it('returns all products when no filters', () => {
    const result = filterProducts(mockProducts, {});
    expect(result).toHaveLength(3);
  });

  it('filters by search term', () => {
    const result = filterProducts(mockProducts, { search: 'solar' });
    expect(result).toHaveLength(1);
    expect(result[0].slug).toBe('solar-panel-450w');
  });

  it('filters by category', () => {
    const result = filterProducts(mockProducts, { categories: ['energia-solar'] });
    expect(result).toHaveLength(1);
    expect(result[0].category).toBe('energia-solar');
  });

  it('filters by price range', () => {
    const result = filterProducts(mockProducts, { priceMin: 100, priceMax: 300 });
    expect(result).toHaveLength(1);
    expect(result[0].price).toBe(189.99);
  });

  it('filters by availability', () => {
    const result = filterProducts(mockProducts, { availability: ['in-stock'] });
    expect(result).toHaveLength(1);
    expect(result[0].availability).toBe('in-stock');
  });

  it('combines multiple filters (AND logic)', () => {
    const result = filterProducts(mockProducts, {
      search: 'panel',
      categories: ['energia-solar'],
      priceMin: 100,
    });
    expect(result).toHaveLength(1);
  });
});

describe('sortProducts', () => {
  it('sorts by price ascending', () => {
    const result = sortProducts([...mockProducts], 'price-asc');
    expect(result[0].price).toBe(4.99);
    expect(result[2].price).toBe(599.99);
  });

  it('sorts by price descending', () => {
    const result = sortProducts([...mockProducts], 'price-desc');
    expect(result[0].price).toBe(599.99);
    expect(result[2].price).toBe(4.99);
  });

  it('sorts by name ascending', () => {
    const result = sortProducts([...mockProducts], 'name-asc');
    expect(result[0].name).toBe('Battery 200Ah LiFePO4');
    expect(result[2].name).toBe('Solar Panel 450W');
  });

  it("preserves order for 'newest'", () => {
    const result = sortProducts([...mockProducts], 'newest');
    expect(result).toEqual(mockProducts);
  });
});

describe('paginateProducts', () => {
  it('returns correct page data', () => {
    const result = paginateProducts(mockProducts, 1, 2);
    expect(result.data).toHaveLength(2);
    expect(result.currentPage).toBe(1);
    expect(result.totalPages).toBe(2);
  });

  it('handles page out of bounds', () => {
    const result = paginateProducts(mockProducts, 5, 2);
    expect(result.currentPage).toBe(2); // Clamped to last page
  });

  it('handles empty array', () => {
    const result = paginateProducts([], 1, 10);
    expect(result.data).toHaveLength(0);
    expect(result.totalPages).toBe(0);
  });
});

describe('createProductListItem', () => {
  it('creates lightweight item from full product', () => {
    const item = createProductListItem(mockProducts[0]);
    expect(item.id).toBe('1');
    expect(item.name).toBe('Solar Panel 450W');
    expect(item.slug).toBe('solar-panel-450w');
    expect(item.price).toBe(189.99);
    expect(item.batteryWh).toBe(500);
  });
});

describe('canPower', () => {
  it('returns power estimates for battery products', () => {
    const powers = canPower(mockProducts[1]); // 2560Wh battery
    expect(powers).toContain('51 carga(s) de celular');
    expect(powers).toContain('8 carga(s) de laptop');
    expect(powers).toContain('25h de bombilla LED (10W)');
  });

  it('returns empty array for products without batteryWh', () => {
    const powers = canPower(mockProducts[2]); // No batteryWh
    expect(powers).toHaveLength(0);
  });
});

describe('generateWhatsAppMessage', () => {
  it('generates correct message', () => {
    const msg = generateWhatsAppMessage(mockProducts[0]);
    expect(msg).toBe('Hola, estoy interesado en el producto "Solar Panel 450W". ¿Está disponible?');
  });
});

describe('groupFaqsByCategory', () => {
  it("groups FAQs under 'general'", () => {
    const faqs = [
      { id: '1', question: 'Q1', answer: 'A1' },
      { id: '2', question: 'Q2', answer: 'A2' },
    ];
    const result = groupFaqsByCategory(faqs);
    expect(result.general).toHaveLength(2);
  });
});
