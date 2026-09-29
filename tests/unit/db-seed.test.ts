/// Unit tests for the seed row builders: the contract between `src/data/*.json`
/// (camelCase, legacy string ids) and the Postgres tables (snake_case, uuid keys).
/// Run: pnpm test tests/unit/db-seed.test.ts

import { describe, it, expect } from 'vitest';
import categories from '../../src/data/categories.json';
import faqs from '../../src/data/faq.json';
import guides from '../../src/data/guias.json';
import kits from '../../src/data/kits.json';
import offers from '../../src/data/ofertas.json';
import products from '../../src/data/products.json';
import solutions from '../../src/data/solutions.json';
import {
  buildCategoryRow,
  buildFaqRow,
  buildGuideRow,
  buildKitRow,
  buildOfferRow,
  buildProductRow,
  buildSolutionRow,
  indexByLegacyId,
  resolveProductIds,
  type JsonEntity,
} from '../../scripts/db/seed-rows';

const catalog = products as unknown as JsonEntity[];
const categoryList = categories as unknown as JsonEntity[];
const solutionList = solutions as unknown as JsonEntity[];
const kitList = kits as unknown as JsonEntity[];
const guideList = guides as unknown as JsonEntity[];
const offerList = offers as unknown as JsonEntity[];
const faqList = faqs as unknown as JsonEntity[];

const panel = catalog.find((product) => product.slug === 'panel-solar-450w-monocristalino')!;
const categoryIds = new Map(
  categoryList.map((category) => [category.slug as string, `uuid-${category.slug}`])
);

describe('buildProductRow', () => {
  it('maps camelCase JSON fields onto snake_case columns', () => {
    const row = buildProductRow(panel, categoryIds);
    expect(row.slug).toBe('panel-solar-450w-monocristalino');
    expect(row.short_description).toBe('Panel 450W alta eficiencia');
    expect(row.best_seller).toBe(true);
    expect(row.kit_only).toBe(false);
    expect(row.seo_title).toBe('Panel Solar 450W Monocristalino | 25 Años Garantía');
  });

  it('resolves the category slug to its uuid', () => {
    expect(buildProductRow(panel, categoryIds).category_id).toBe('uuid-energia-solar');
  });

  it('rejects a product whose category slug is unknown', () => {
    const orphan: JsonEntity = { ...panel, category: 'categoria-inexistente' };
    expect(() => buildProductRow(orphan, categoryIds)).toThrow(/categoria-inexistente/);
  });

  it('never writes rating or rating_count, so real reviews are never overwritten', () => {
    const withRatings: JsonEntity = { ...panel, rating: 4.6, rating_count: 12 };
    const row = buildProductRow(withRatings, categoryIds);
    expect('rating' in row).toBe(false);
    expect('rating_count' in row).toBe(false);
  });

  it('leaves related_product_ids and id to the link pass and the database', () => {
    const row = buildProductRow(panel, categoryIds);
    expect('related_product_ids' in row).toBe(false);
    expect('id' in row).toBe(false);
  });

  it('carries details only when the JSON provides it', () => {
    expect('details' in buildProductRow(panel, categoryIds)).toBe(false);
    const withDetails: JsonEntity = { ...panel, details: { whatIs: 'Panel solar.' } };
    expect(buildProductRow(withDetails, categoryIds).details).toEqual({ whatIs: 'Panel solar.' });
  });

  it('defaults required arrays to empty instead of null', () => {
    const bare: JsonEntity = { ...panel, images: undefined, features: undefined, tags: undefined };
    const row = buildProductRow(bare, categoryIds);
    expect(row.images).toEqual([]);
    expect(row.features).toEqual([]);
    expect(row.tags).toEqual([]);
  });

  it('nulls optional scalars that the JSON omits', () => {
    const bare: JsonEntity = { ...panel, compareAtPrice: undefined, batteryWh: undefined };
    const row = buildProductRow(bare, categoryIds);
    expect(row.compare_at_price).toBeNull();
    expect(row.battery_wh).toBeNull();
  });
});

describe('buildCategoryRow', () => {
  it('maps the category without resolving its product list', () => {
    const row = buildCategoryRow(categoryList[0]);
    expect(row.slug).toBe('energia-solar');
    expect(row.name).toBe('Energía Solar');
    expect('product_ids' in row).toBe(false);
  });
});

describe('buildSolutionRow, buildKitRow, buildGuideRow and buildOfferRow', () => {
  it('maps solutions and defers product_ids', () => {
    const row = buildSolutionRow(solutionList[0]);
    expect(row.slug).toBe(solutionList[0].slug);
    expect('product_ids' in row).toBe(false);
  });

  it('maps kit pricing columns', () => {
    const row = buildKitRow(kitList[0]);
    expect(row.price).toBe(729);
    expect(row.compare_at_price).toBe(894.98);
    expect('product_ids' in row).toBe(false);
  });

  it('maps guide read time', () => {
    expect(buildGuideRow(guideList[0]).read_time).toBe(guideList[0].readTime);
  });

  it('maps offer pricing and the product slug', () => {
    const row = buildOfferRow(offerList[0]);
    expect(row.original_price).toBe(offerList[0].originalPrice);
    expect(row.discount_percent).toBe(offerList[0].discountPercent);
    expect(row.product_slug).toBe(offerList[0].productSlug);
  });
});

describe('buildFaqRow', () => {
  it('derives a stable uuid from the JSON id, so re-seeding is a no-op', () => {
    const first = buildFaqRow(faqList[0]);
    expect(first.id).toBe(buildFaqRow(faqList[0]).id);
    expect(first.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
  });

  it('gives different questions different ids', () => {
    expect(buildFaqRow(faqList[0]).id).not.toBe(buildFaqRow(faqList[1]).id);
  });

  it('keeps the question and answer verbatim', () => {
    const row = buildFaqRow(faqList[0]);
    expect(row.question).toBe(faqList[0].question);
    expect(row.answer).toBe(faqList[0].answer);
  });
});

describe('resolveProductIds', () => {
  const slugByLegacyId = new Map(catalog.map((product) => [product.id, product.slug as string]));
  const uuidBySlug = new Map(
    catalog.map((product) => [product.slug as string, `uuid-${product.id}`])
  );

  it('translates legacy ids into database uuids', () => {
    expect(resolveProductIds(['prod-1', 'prod-3'], slugByLegacyId, uuidBySlug)).toEqual([
      'uuid-prod-1',
      'uuid-prod-3',
    ]);
  });

  it('deduplicates repeated references', () => {
    const repeated = kitList.find((kit) => kit.slug === 'kit-iluminacion-solar')!.products!;
    const resolved = resolveProductIds(repeated, slugByLegacyId, uuidBySlug);
    expect(new Set(resolved).size).toBe(resolved.length);
  });

  it('drops references it cannot resolve instead of writing empty uuids', () => {
    expect(resolveProductIds(['prod-1', 'prod-999'], slugByLegacyId, uuidBySlug)).toEqual([
      'uuid-prod-1',
    ]);
  });

  it('returns an empty list when nothing references a product', () => {
    expect(resolveProductIds([], slugByLegacyId, uuidBySlug)).toEqual([]);
  });
});

describe('indexByLegacyId', () => {
  it('indexes every entity by its JSON id so references can be resolved', () => {
    const index = indexByLegacyId(catalog);
    expect(index.get('prod-1')).toBe('panel-solar-450w-monocristalino');
    expect(index.get('prod-8')).toBe(catalog[7].slug);
  });
});
