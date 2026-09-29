/// ============================================================
/// Seed Supabase from `src/data/*.json`.
/// Usage: pnpm db:seed
///
/// Replaces the invalid `supabase/seed.json` (it contained `// ... more
/// products` placeholders and was never parseable). The JSON files in
/// `src/data` are the single source of truth for catalog content.
///
/// Idempotent by construction:
///  - payloads never carry a primary key, so re-seeding keeps existing uuids
///    and cannot break `whatsapp_clicks` / `product_margins` references;
///  - every entity is upserted on its unique key, so a second run converges to
///    the same row count;
///  - FAQs have no unique slug, so they get a deterministic uuid from the JSON
///    id and are upserted on `id`;
///  - cross-entity id lists are resolved in a second pass, after the generated
///    uuids are readable;
///  - `rating` / `rating_count` are never written: the JSON carries no reviews,
///    so a seed must neither fabricate nor erase them.
/// ============================================================

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import path from 'path';
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
  type SeedRow,
} from './db/seed-rows';

dotenv.config({ path: '.env' });

const DATA_DIR = path.resolve(process.cwd(), 'src', 'data');

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('❌ Missing env vars: PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  console.error('   The seed needs the service role key so it can write past RLS.');
  process.exit(1);
}

// Seed payloads are built dynamically from JSON, so the generated row types
// cannot be satisfied statically.
const db = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
}) as any;

function readJson(file: string): JsonEntity[] {
  return JSON.parse(readFileSync(path.join(DATA_DIR, file), 'utf8')) as JsonEntity[];
}

function fail(message: string): never {
  console.error(`❌ ${message}`);
  process.exit(1);
}

async function upsert(table: string, rows: SeedRow[], onConflict: string): Promise<void> {
  if (rows.length === 0) return;
  const { error } = await db.from(table).upsert(rows, { onConflict });
  if (error) throw new Error(`${table}: ${error.message}`);
}

/** slug -> uuid for every row of a table, read back after the upsert. */
async function uuidBySlug(table: string): Promise<Map<string, string>> {
  const { data, error } = await db.from(table).select('id, slug');
  if (error) throw new Error(`${table}: ${error.message}`);
  return new Map((data ?? []).map((row: { id: string; slug: string }) => [row.slug, row.id]));
}

/**
 * Second pass: translate JSON references into uuids now that the generated ids
 * are readable. Uses UPDATE rather than a partial upsert so a typo can never
 * insert a half-populated row.
 */
async function linkRows(
  table: string,
  entities: JsonEntity[],
  referenceKey: 'products' | 'relatedProducts',
  column: 'product_ids' | 'related_product_ids',
  slugByProductId: ReadonlyMap<string, string>,
  uuidByProductSlug: ReadonlyMap<string, string>
): Promise<void> {
  const results = await Promise.all(
    entities.map((entity) =>
      db
        .from(table)
        .update({
          [column]: resolveProductIds(entity[referenceKey], slugByProductId, uuidByProductSlug),
        })
        .eq('slug', entity.slug)
    )
  );
  const failure = results.find((result) => result.error);
  if (failure) throw new Error(`${table}: ${failure.error.message}`);
}

async function main() {
  // The application SELECTs rating, rating_count and details, so a database
  // without them would fail every product query. Detect it before writing
  // anything and point at the migration instead of letting Postgres fail
  // halfway through the run.
  const { error: probeError } = await db
    .from('products')
    .select('rating, rating_count, details')
    .limit(1);
  if (probeError) {
    fail(
      `products.rating / rating_count / details are missing (${probeError.message}).\n` +
        '   Run `pnpm db:migrate` first: migration 004 creates them.'
    );
  }

  const categories = readJson('categories.json');
  const products = readJson('products.json');
  const solutions = readJson('solutions.json');
  const kits = readJson('kits.json');
  const offers = readJson('ofertas.json');
  const guides = readJson('guias.json');
  const faqs = readJson('faq.json');

  await upsert('categories', categories.map(buildCategoryRow), 'slug');
  const categoryIds = await uuidBySlug('categories');

  await upsert(
    'products',
    products.map((product) => buildProductRow(product, categoryIds)),
    'slug'
  );
  await upsert('solutions', solutions.map(buildSolutionRow), 'slug');
  await upsert('kits', kits.map(buildKitRow), 'slug');
  await upsert('offers', offers.map(buildOfferRow), 'slug');
  await upsert('guides', guides.map(buildGuideRow), 'slug');
  await upsert('faqs', faqs.map(buildFaqRow), 'id');

  // Link pass: the uuids now exist, so JSON references can be translated.
  const productIds = await uuidBySlug('products');
  const slugByProductId = indexByLegacyId(products);

  await linkRows(
    'products',
    products,
    'relatedProducts',
    'related_product_ids',
    slugByProductId,
    productIds
  );

  for (const [table, entities] of [
    ['categories', categories],
    ['solutions', solutions],
    ['kits', kits],
    ['guides', guides],
  ] as const) {
    await linkRows(table, entities, 'products', 'product_ids', slugByProductId, productIds);
  }

  console.log(
    `✅ Seed complete: ${categories.length} categories, ${products.length} products, ` +
      `${solutions.length} solutions, ${kits.length} kits, ${offers.length} offers, ` +
      `${guides.length} guides, ${faqs.length} faqs.`
  );
}

main().catch((error) => {
  console.error('💥 Seed failed:', error instanceof Error ? error.message : error);
  process.exit(1);
});
