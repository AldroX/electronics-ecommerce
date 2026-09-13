/// ============================================================
/// Verify migration: JSON counts vs DB counts (by slug)
/// Task 4.2
/// Usage: pnpm tsx scripts/verify-migration.ts
/// ============================================================

import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

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

async function loadJson(filename: string) {
  const filePath = path.join(DATA_DIR, filename);
  const content = await fs.readFile(filePath, "utf-8");
  return JSON.parse(content);
}

interface TableCheck {
  table: string;
  jsonFile: string;
  slugField: string;
  jsonCount: number;
  dbCount: number;
  match: boolean;
  missingInDb: string[];
  extraInDb: string[];
}

async function verify() {
  console.log("🔍 Verifying migration: JSON vs Database (by slug)...\n");

  const tables = [
    { table: "categories", jsonFile: "categories.json", slugField: "slug" },
    { table: "products", jsonFile: "products.json", slugField: "slug" },
    { table: "solutions", jsonFile: "solutions.json", slugField: "slug" },
    { table: "kits", jsonFile: "kits.json", slugField: "slug" },
    { table: "offers", jsonFile: "ofertas.json", slugField: "slug" },
    { table: "guides", jsonFile: "guias.json", slugField: "slug" },
    { table: "faqs", jsonFile: "faq.json", slugField: "question" }, // FAQs use question as unique key
  ];

  const results: TableCheck[] = [];

  for (const t of tables) {
    console.log(`  Checking ${t.table}...`);
    
    const jsonData = await loadJson(t.jsonFile);
    const jsonSlugs = new Set<string>(
      jsonData
        .map((d: any) => d[t.slugField])
        .filter((slug: unknown): slug is string => typeof slug === "string")
    );
    const jsonCount = jsonData.length;

    const { data: dbData, error } = await supabase
      .from(t.table)
      .select(t.slugField);

    if (error) {
      console.error(`    ❌ DB query failed:`, error.message);
      results.push({
        table: t.table,
        jsonFile: t.jsonFile,
        slugField: t.slugField,
        jsonCount,
        dbCount: -1,
        match: false,
        missingInDb: [],
        extraInDb: [],
      });
      continue;
    }

    const dbSlugs = new Set(dbData.map((d: any) => d[t.slugField]).filter(Boolean));
    const dbCount = dbData.length;

    const missingInDb: string[] = [...jsonSlugs].filter((slug) => !dbSlugs.has(slug));
    const extraInDb: string[] = [...dbSlugs].filter((slug) => !jsonSlugs.has(slug));
    const match = jsonCount === dbCount && missingInDb.length === 0 && extraInDb.length === 0;

    results.push({
      table: t.table,
      jsonFile: t.jsonFile,
      slugField: t.slugField,
      jsonCount,
      dbCount,
      match,
      missingInDb,
      extraInDb,
    });

    if (match) {
      console.log(`    ✅ ${t.table}: ${jsonCount} records match`);
    } else {
      console.log(`    ❌ ${t.table}: JSON=${jsonCount}, DB=${dbCount}`);
      if (missingInDb.length) console.log(`       Missing in DB: ${missingInDb.slice(0, 5).join(", ")}${missingInDb.length > 5 ? "..." : ""}`);
      if (extraInDb.length) console.log(`       Extra in DB: ${extraInDb.slice(0, 5).join(", ")}${extraInDb.length > 5 ? "..." : ""}`);
    }
  }

  // Summary
  console.log("\n📊 Summary:");
  const allMatch = results.every(r => r.match);
  
  if (allMatch) {
    console.log("  ✅ All tables match perfectly!");
    process.exit(0);
  } else {
    console.log("  ❌ Mismatches found:");
    for (const r of results) {
      if (!r.match) {
        console.log(`    ${r.table}: JSON=${r.jsonCount}, DB=${r.dbCount}, missing=${r.missingInDb.length}, extra=${r.extraInDb.length}`);
      }
    }
    process.exit(1);
  }
}

verify().catch((err) => {
  console.error("💥 Verification failed:", err);
  process.exit(1);
});