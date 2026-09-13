/// ============================================================
/// Migrate JSON files → Supabase (idempotent upsert with UUID generation)
/// Task 4.1
/// Usage: pnpm tsx scripts/migrate-json-to-db.ts
/// ============================================================

import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { randomUUID } from "crypto";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SUPABASE_URL = process.env.PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("❌ Missing env vars: PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase: any = createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const DATA_DIR = path.join(__dirname, "..", "src", "data");

// Maps from old string IDs to new UUIDs
const idMaps = {
  categories: new Map<string, string>(),
  products: new Map<string, string>(),
  solutions: new Map<string, string>(),
  kits: new Map<string, string>(),
  offers: new Map<string, string>(),
  guides: new Map<string, string>(),
  faqs: new Map<string, string>(),
};

function generateId() {
  return randomUUID();
}

function getMappedId(map: Map<string, string>, oldId: string | string[]): string[] {
  if (Array.isArray(oldId)) {
    return oldId
      .map((id) => map.get(id))
      .filter((id): id is string => Boolean(id));
  }

  const mapped = map.get(oldId);
  return mapped ? [mapped] : [];
}

function getSingleMappedId(map: Map<string, string>, oldId: string | undefined): string | undefined {
  if (!oldId) return undefined;
  return map.get(oldId) ?? undefined;
}

async function migrate() {
  console.log("🚀 Starting JSON → Supabase migration (UUID generation)...\n");

  // 1. Load all JSON files
  const files = {
    categories: await loadJson("categories.json"),
    products: await loadJson("products.json"),
    solutions: await loadJson("solutions.json"),
    kits: await loadJson("kits.json"),
    offers: await loadJson("ofertas.json"),
    guides: await loadJson("guias.json"),
    faqs: await loadJson("faq.json"),
  };

  // 2. Generate UUIDs for all entities (preserving slug-based upsert)
  console.log("🔑 Generating UUIDs...\n");
  
  // Categories: map old id → new UUID, AND slug → SAME UUID (for product mapping)
  for (const cat of files.categories) {
    const uuid = generateId();
    idMaps.categories.set(cat.id, uuid);
    idMaps.categories.set(cat.slug, uuid); // same UUID for slug lookup
  }
  
  // Products: map old id → new UUID
  for (const prod of files.products) {
    idMaps.products.set(prod.id, generateId());
  }
  
  // Solutions
  for (const sol of files.solutions) {
    idMaps.solutions.set(sol.id, generateId());
  }
  
  // Kits
  for (const kit of files.kits) {
    idMaps.kits.set(kit.id, generateId());
  }
  
  // Offers
  for (const off of files.offers) {
    idMaps.offers.set(off.id, generateId());
  }
  
  // Guides
  for (const guide of files.guides) {
    idMaps.guides.set(guide.id, generateId());
  }
  
  // FAQs
  for (const faq of files.faqs) {
    idMaps.faqs.set(faq.id, generateId());
  }

  console.log(`  Categories: ${idMaps.categories.size} UUIDs`);
  console.log(`  Products: ${idMaps.products.size} UUIDs`);
  console.log(`  Solutions: ${idMaps.solutions.size} UUIDs`);
  console.log(`  Kits: ${idMaps.kits.size} UUIDs`);
  console.log(`  Offers: ${idMaps.offers.size} UUIDs`);
  console.log(`  Guides: ${idMaps.guides.size} UUIDs`);
  console.log(`  FAQs: ${idMaps.faqs.size} UUIDs\n`);

  // 3. Migrate in dependency order
  await migrateCategories(files.categories);
  await migrateProducts(files.products);
  await migrateSolutions(files.solutions);
  await migrateKits(files.kits);
  await migrateOffers(files.offers);
  await migrateGuides(files.guides);
  await migrateFaqs(files.faqs);

  console.log("\n✅ Migration complete!");
}

async function loadJson(filename: string) {
  const filePath = path.join(DATA_DIR, filename);
  const content = await fs.readFile(filePath, "utf-8");
  return JSON.parse(content);
}

async function migrateCategories(data: any[]) {
  console.log(`📦 Migrating ${data.length} categories...`);
  
  const mapped: Database["public"]["Tables"]["categories"]["Insert"][] = data.map((cat) => ({
    id: idMaps.categories.get(cat.id)!,
    name: cat.name,
    slug: cat.slug,
    description: cat.description,
    image: cat.image,
    product_ids: getMappedId(idMaps.products, cat.products || []),
    seo_title: cat.seo?.title ?? null,
    seo_description: cat.seo?.description ?? null,
    seo_image: cat.seo?.image ?? null,
    seo_canonical: cat.seo?.canonical ?? null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }));

  const { error } = await supabase
    .from("categories")
    .upsert(mapped, { onConflict: "slug" });

  if (error) throw error;
  console.log("  ✅ Categories done");
}

async function migrateProducts(data: any[]) {
  console.log(`📦 Migrating ${data.length} products...`);
  let success = 0, failed = 0;

  for (const p of data) {
    const mapped: Database["public"]["Tables"]["products"]["Insert"] = {
      id: idMaps.products.get(p.id)!,
      name: p.name,
      slug: p.slug,
      description: p.description,
      short_description: p.shortDescription,
      price: p.price,
      compare_at_price: p.compareAtPrice ?? null,
      currency: p.currency,
      category_id: getSingleMappedId(idMaps.categories, p.category) ?? "",
      images: p.images || [],
      specs: p.specs || {},
      features: p.features || [],
      availability: p.availability,
      featured: p.featured ?? false,
      best_seller: p.bestSeller ?? false,
      kit_only: p.kitOnly ?? false,
      whatsapp_message: p.whatsappMessage,
      tags: p.tags || [],
      seo_title: p.seo?.title ?? null,
      seo_description: p.seo?.description ?? null,
      seo_image: p.seo?.image ?? null,
      seo_canonical: p.seo?.canonical ?? null,
      related_product_ids: getMappedId(idMaps.products, p.relatedProducts || []),
      battery_wh: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from("products")
      .upsert(mapped, { onConflict: "slug" });

    if (error) {
      console.error(`  ❌ Product ${p.slug}:`, error.message);
      failed++;
    } else {
      success++;
    }
  }
  console.log(`  ✅ Products: ${success} ok, ${failed} failed`);
}

async function migrateSolutions(data: any[]) {
  console.log(`📦 Migrating ${data.length} solutions...`);
  
  const mapped: Database["public"]["Tables"]["solutions"]["Insert"][] = data.map((sol) => ({
    id: idMaps.solutions.get(sol.id)!,
    name: sol.name,
    slug: sol.slug,
    description: sol.description,
    icon: sol.icon,
    product_ids: getMappedId(idMaps.products, sol.products || []),
    seo_title: sol.seo?.title ?? null,
    seo_description: sol.seo?.description ?? null,
    seo_image: sol.seo?.image ?? null,
    seo_canonical: sol.seo?.canonical ?? null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }));

  const { error } = await supabase
    .from("solutions")
    .upsert(mapped, { onConflict: "slug" });

  if (error) throw error;
  console.log("  ✅ Solutions done");
}

async function migrateKits(data: any[]) {
  console.log(`📦 Migrating ${data.length} kits...`);
  
  const mapped: Database["public"]["Tables"]["kits"]["Insert"][] = data.map((kit) => ({
    id: idMaps.kits.get(kit.id)!,
    name: kit.name,
    slug: kit.slug,
    description: kit.description,
    product_ids: getMappedId(idMaps.products, kit.products || []),
    price: kit.price,
    compare_at_price: kit.compareAtPrice ?? null,
    seo_title: kit.seo?.title ?? null,
    seo_description: kit.seo?.description ?? null,
    seo_image: kit.seo?.image ?? null,
    seo_canonical: kit.seo?.canonical ?? null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }));

  const { error } = await supabase
    .from("kits")
    .upsert(mapped, { onConflict: "slug" });

  if (error) throw error;
  console.log("  ✅ Kits done");
}

async function migrateOffers(data: any[]) {
  console.log(`📦 Migrating ${data.length} offers...`);
  
  const mapped: Database["public"]["Tables"]["offers"]["Insert"][] = data.map((off) => ({
    id: idMaps.offers.get(off.id)!,
    name: off.name,
    slug: off.slug,
    description: off.description,
    image: off.image,
    original_price: off.originalPrice,
    current_price: off.currentPrice,
    discount_percent: off.discountPercent,
    availability: off.availability,
    valid_until: off.validUntil,
    currency: off.currency,
    whatsapp_message: off.whatsappMessage,
    product_slug: off.productSlug,
    seo_title: off.seo?.title ?? null,
    seo_description: off.seo?.description ?? null,
    seo_image: off.seo?.image ?? null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }));

  const { error } = await supabase
    .from("offers")
    .upsert(mapped, { onConflict: "slug" });

  if (error) throw error;
  console.log("  ✅ Offers done");
}

async function migrateGuides(data: any[]) {
  console.log(`📦 Migrating ${data.length} guides...`);
  
  const mapped: Database["public"]["Tables"]["guides"]["Insert"][] = data.map((guide) => ({
    id: idMaps.guides.get(guide.id)!,
    title: guide.title,
    slug: guide.slug,
    description: guide.description,
    image: guide.image,
    content: guide.content,
    product_ids: getMappedId(idMaps.products, guide.products || []),
    read_time: guide.readTime ?? 5,
    seo_title: guide.seo?.title ?? null,
    seo_description: guide.seo?.description ?? null,
    seo_image: guide.seo?.image ?? null,
    seo_canonical: guide.seo?.canonical ?? null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }));

  const { error } = await supabase
    .from("guides")
    .upsert(mapped, { onConflict: "slug" });

  if (error) throw error;
  console.log("  ✅ Guides done");
}

async function migrateFaqs(data: any[]) {
  console.log(`📦 Migrating ${data.length} FAQs...`);
  
  const mapped: Database["public"]["Tables"]["faqs"]["Insert"][] = data.map((faq) => ({
    id: idMaps.faqs.get(faq.id)!,
    question: faq.question,
    answer: faq.answer,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }));

  const { error } = await supabase
    .from("faqs")
    .upsert(mapped, { onConflict: "question" });

  if (error) throw error;
  console.log("  ✅ FAQs done");
}

// Run
migrate().catch((err) => {
  console.error("💥 Migration failed:", err);
  process.exit(1);
});