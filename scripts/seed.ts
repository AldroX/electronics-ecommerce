// Idempotent seed script: imports JSON data files into Supabase
// Runs via: pnpm db:seed
// Usage: node scripts/seed.ts [entity]

import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import type { Product, Category, Solution, Kit, Offer, Guide, FAQItem } from "@/data/types";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const DATA_DIR = path.resolve("./src/data");

async function upsertEntity(
  table: string,
  data: any[],
  slugField: string
) {
  for (const item of data) {
    const slug = item[slugField];
    await supabase
      .from(table)
      .upsert({ ...item, [slugField]: slug }, {
        onConflict: slugField,
      })
      .select();
  }
}

async function main() {
  // Seed products
  const products = JSON.parse(
    fs.readFileSync(path.join(DATA_DIR, "products.json"), "utf-8")
  );
  await upsertEntity("products", products, "slug");
  console.log(`Seeded ${products.length} products`);

  // Seed categories
  const categories = JSON.parse(
    fs.readFileSync(path.join(DATA_DIR, "categories.json"), "utf-8")
  );
  await upsertEntity("categories", categories, "slug");
  console.log(`Seeded ${categories.length} categories`);

  // Seed solutions
  const solutions = JSON.parse(
    fs.readFileSync(path.join(DATA_DIR, "solutions.json"), "utf-8")
  );
  await upsertEntity("solutions", solutions, "slug");
  console.log(`Seeded ${solutions.length} solutions`);

  // Seed kits
  const kits = JSON.parse(
    fs.readFileSync(path.join(DATA_DIR, "kits.json"), "utf-8")
  );
  await upsertEntity("kits", kits, "slug");
  console.log(`Seeded ${kits.length} kits`);

  // Seed offers
  const offers = JSON.parse(
    fs.readFileSync(path.join(DATA_DIR, "ofertas.json"), "utf-8")
  );
  await upsertEntity("offers", offers, "slug");
  console.log(`Seeded ${offers.length} offers`);

  // Seed guides
  const guias = JSON.parse(
    fs.readFileSync(path.join(DATA_DIR, "guias.json"), "utf-8")
  );
  await upsertEntity("guides", guias, "slug");
  console.log(`Seeded ${guias.length} guides`);

  // Seed faqs
  const faq = JSON.parse(
    fs.readFileSync(path.join(DATA_DIR, "faq.json"), "utf-8")
  );
  await upsertEntity("faqs", faq, "id");
  console.log(`Seeded ${faq.length} faqs`);

  console.log("Seed complete.");
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});