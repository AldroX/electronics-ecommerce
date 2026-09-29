/// Seed row builders: the mapping from `src/data/*.json` (camelCase, legacy
/// string ids) to Postgres rows (snake_case, uuid keys).
///
/// Pure and I/O free on purpose: every mapping rule is unit-testable, and the
/// seed reuses exactly the same rules on every run.
///
/// Two invariants matter for a re-runnable seed:
///  1. Primary keys are never part of a payload. Existing rows keep their uuid,
///     so a re-seed cannot break `whatsapp_clicks` / `product_margins` foreign
///     keys. Fresh rows fall back to the schema default.
///  2. Cross-entity id lists (`product_ids`, `related_product_ids`) are left out
///     and resolved in a second pass, once the generated uuids are readable.

import { createHash } from 'crypto';

export type SeedRow = Record<string, unknown>;

export interface JsonSeo {
  title?: string;
  description?: string;
  image?: string;
  canonical?: string;
}

export interface JsonEntity {
  id: string;
  slug?: string;
  category?: string;
  products?: string[];
  relatedProducts?: string[];
  seo?: JsonSeo;
  [key: string]: unknown;
}

/** Columns that are NOT NULL arrays: default to empty, never to null. */
const ARRAY_COLUMNS = ['images', 'features', 'tags'];

/** JSONB columns with a NOT NULL object default. */
const OBJECT_COLUMNS = ['specs'];

const PRODUCT_COLUMNS: Record<string, string> = {
  name: 'name',
  slug: 'slug',
  description: 'description',
  shortDescription: 'short_description',
  price: 'price',
  compareAtPrice: 'compare_at_price',
  currency: 'currency',
  images: 'images',
  specs: 'specs',
  features: 'features',
  availability: 'availability',
  featured: 'featured',
  bestSeller: 'best_seller',
  kitOnly: 'kit_only',
  whatsappMessage: 'whatsapp_message',
  tags: 'tags',
  batteryWh: 'battery_wh',
};

const CATEGORY_COLUMNS: Record<string, string> = {
  name: 'name',
  slug: 'slug',
  description: 'description',
  image: 'image',
};

const SOLUTION_COLUMNS: Record<string, string> = {
  name: 'name',
  slug: 'slug',
  description: 'description',
  icon: 'icon',
};

const KIT_COLUMNS: Record<string, string> = {
  name: 'name',
  slug: 'slug',
  description: 'description',
  price: 'price',
  compareAtPrice: 'compare_at_price',
};

const GUIDE_COLUMNS: Record<string, string> = {
  title: 'title',
  slug: 'slug',
  description: 'description',
  image: 'image',
  content: 'content',
  readTime: 'read_time',
};

const OFFER_COLUMNS: Record<string, string> = {
  name: 'name',
  slug: 'slug',
  description: 'description',
  image: 'image',
  originalPrice: 'original_price',
  currentPrice: 'current_price',
  discountPercent: 'discount_percent',
  availability: 'availability',
  validUntil: 'valid_until',
  currency: 'currency',
  whatsappMessage: 'whatsapp_message',
  productSlug: 'product_slug',
};

/** Copy the declared columns across, normalizing absent values. */
function mapColumns(source: JsonEntity, columns: Record<string, string>): SeedRow {
  const row: SeedRow = {};
  for (const [key, column] of Object.entries(columns)) {
    const value = source[key];
    if (value !== undefined && value !== null) {
      row[column] = value;
    } else if (ARRAY_COLUMNS.includes(column)) {
      row[column] = [];
    } else if (OBJECT_COLUMNS.includes(column)) {
      row[column] = {};
    } else {
      row[column] = null;
    }
  }
  return row;
}

function seoColumns(seo: JsonSeo | undefined): SeedRow {
  return {
    seo_title: seo?.title ?? null,
    seo_description: seo?.description ?? null,
    seo_image: seo?.image ?? null,
    seo_canonical: seo?.canonical ?? null,
  };
}

/** Deterministic UUID (v5 layout) so repeated runs target the same FAQ row. */
export function deterministicUuid(namespace: string, key: string): string {
  const bytes = Buffer.from(createHash('sha1').update(`${namespace}:${key}`).digest('hex').slice(0, 32), 'hex');
  bytes[6] = (bytes[6] & 0x0f) | 0x50; // version 5
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // RFC 4122 variant
  const hex = bytes.toString('hex');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export function buildProductRow(
  source: JsonEntity,
  categoryIds: ReadonlyMap<string, string>
): SeedRow {
  const categoryId = categoryIds.get(source.category ?? '');
  if (!categoryId) {
    throw new Error(
      `Unknown category "${source.category}" referenced by product "${source.slug ?? source.id}"`
    );
  }

  const row: SeedRow = {
    ...mapColumns(source, PRODUCT_COLUMNS),
    ...seoColumns(source.seo),
    category_id: categoryId,
  };

  // Only written when the JSON provides it, so "not backfilled yet" stays NULL.
  if (source.details !== undefined && source.details !== null) {
    row.details = source.details;
  }

  // `rating` and `rating_count` are deliberately never written: the JSON has no
  // source of truth for reviews, so the seed must neither fabricate nor erase
  // them. The product page only renders a rating when rating_count > 0.

  return row;
}

export function buildCategoryRow(source: JsonEntity): SeedRow {
  return { ...mapColumns(source, CATEGORY_COLUMNS), ...seoColumns(source.seo) };
}

export function buildSolutionRow(source: JsonEntity): SeedRow {
  return { ...mapColumns(source, SOLUTION_COLUMNS), ...seoColumns(source.seo) };
}

export function buildKitRow(source: JsonEntity): SeedRow {
  return { ...mapColumns(source, KIT_COLUMNS), ...seoColumns(source.seo) };
}

export function buildGuideRow(source: JsonEntity): SeedRow {
  return { ...mapColumns(source, GUIDE_COLUMNS), ...seoColumns(source.seo) };
}

export function buildOfferRow(source: JsonEntity): SeedRow {
  return { ...mapColumns(source, OFFER_COLUMNS), ...seoColumns(source.seo) };
}

/** FAQs have no unique slug, so the JSON id becomes a stable primary key. */
export function buildFaqRow(source: JsonEntity): SeedRow {
  return {
    id: deterministicUuid('faq', source.id),
    question: source.question ?? null,
    answer: source.answer ?? null,
  };
}

/** Index entities by their JSON id so legacy references can be resolved. */
export function indexByLegacyId(entities: readonly JsonEntity[]): Map<string, string> {
  return new Map(
    entities
      .filter((entity) => typeof entity.slug === 'string')
      .map((entity) => [entity.id, entity.slug as string])
  );
}

/** JSON legacy id -> database uuid. Unresolvable references are dropped. */
export function resolveProductIds(
  refs: readonly string[] | undefined,
  slugByLegacyId: ReadonlyMap<string, string>,
  uuidBySlug: ReadonlyMap<string, string>
): string[] {
  const resolved = new Set<string>();
  for (const ref of refs ?? []) {
    const slug = slugByLegacyId.get(ref);
    if (!slug) continue;
    const uuid = uuidBySlug.get(slug);
    if (uuid) resolved.add(uuid);
  }
  return [...resolved];
}
