/**
 * verify-dual-write.ts
 * Compares JSON data files against Supabase database to detect drift.
 * Exit code: 0 = no drift, 1 = drift detected, 2 = error
 */

import { createServiceSupabaseClient } from "@/lib/supabase/client";
import { readFileSync } from "fs";
import { join } from "path";

interface DriftResult {
  entity: string;
  jsonCount: number;
  dbCount: number;
  missingInDb: string[];      // slugs in JSON but not in DB
  extraInDb: string[];        // slugs in DB but not in JSON
  fieldMismatches: Array<{ slug: string; field: string; jsonValue: any; dbValue: any }>;
}

async function main() {
  const supabase = createServiceSupabaseClient();
  const dataDir = join(process.cwd(), "src", "data");

  const entities = [
    { table: "products", jsonFile: "products.json", idField: "slug" },
    { table: "categories", jsonFile: "categories.json", idField: "slug" },
    { table: "solutions", jsonFile: "solutions.json", idField: "slug" },
    { table: "kits", jsonFile: "kits.json", idField: "slug" },
    { table: "offers", jsonFile: "offers.json", idField: "slug" },
    { table: "guides", jsonFile: "guides.json", idField: "slug" },
    { table: "faqs", jsonFile: "faqs.json", idField: "slug" },
  ];

  let allClean = true;
  const allResults: DriftResult[] = [];

  for (const { table, jsonFile, idField } of entities) {
    console.log(`\n🔍 Checking ${table}...`);

    // Load JSON data
    const jsonPath = join(dataDir, jsonFile);
    let jsonData: any[] = [];
    try {
      jsonData = JSON.parse(readFileSync(jsonPath, "utf-8"));
    } catch (e) {
      console.error(`  ❌ Failed to read ${jsonFile}: ${e}`);
      allClean = false;
      continue;
    }

    // Load DB data
    const { data: dbData, error } = await supabase
      .from(table)
      .select("*");

    if (error) {
      console.error(`  ❌ DB query failed for ${table}: ${error.message}`);
      allClean = false;
      continue;
    }

    const jsonSlugs = new Set<string>(jsonData.map((d) => d[idField]));
    const dbSlugs = new Set<string>(dbData.map((d) => d[idField]));

    const missingInDb = [...jsonSlugs].filter((s) => !dbSlugs.has(s));
    const extraInDb = [...dbSlugs].filter((s) => !jsonSlugs.has(s));

    // Compare fields for matching slugs
    const fieldMismatches: DriftResult["fieldMismatches"] = [];
    const commonSlugs = [...jsonSlugs].filter((s) => dbSlugs.has(s));

    for (const slug of commonSlugs) {
      const jsonItem = jsonData.find((d) => d[idField] === slug);
      const dbItem = dbData.find((d) => d[idField] === slug);

      if (!jsonItem || !dbItem) continue;

      // Compare key fields (adjust based on entity)
      const fieldsToCompare = [
        "name",
        "description",
        "price",
        "currency",
        "availability",
        "featured",
        "best_seller",
        "bestSeller",
      ];

      for (const field of fieldsToCompare) {
        const jsonVal = jsonItem[field];
        const dbVal = dbItem[field];
        if (JSON.stringify(jsonVal) !== JSON.stringify(dbVal)) {
          fieldMismatches.push({ slug, field, jsonValue: jsonVal, dbValue: dbVal });
        }
      }
    }

    const result: DriftResult = {
      entity: table,
      jsonCount: jsonData.length,
      dbCount: dbData.length,
      missingInDb,
      extraInDb,
      fieldMismatches,
    };

    allResults.push(result);

    // Report
    if (missingInDb.length > 0) {
      console.log(`  ⚠️  ${missingInDb.length} in JSON but MISSING in DB: ${missingInDb.slice(0, 5).join(", ")}${missingInDb.length > 5 ? "..." : ""}`);
      allClean = false;
    }
    if (extraInDb.length > 0) {
      console.log(`  ⚠️  ${extraInDb.length} in DB but NOT in JSON: ${extraInDb.slice(0, 5).join(", ")}${extraInDb.length > 5 ? "..." : ""}`);
      allClean = false;
    }
    if (fieldMismatches.length > 0) {
      console.log(`  ⚠️  ${fieldMismatches.length} field mismatches:`);
      for (const m of fieldMismatches.slice(0, 10)) {
        console.log(`     - ${m.slug}.${m.field}: JSON="${m.jsonValue}" vs DB="${m.dbValue}"`);
      }
      if (fieldMismatches.length > 10) console.log(`     ... and ${fieldMismatches.length - 10} more`);
      allClean = false;
    }
    if (missingInDb.length === 0 && extraInDb.length === 0 && fieldMismatches.length === 0) {
      console.log(`  ✅ ${table}: ${jsonData.length} items - OK`);
    }
  }

  // Summary
  console.log("\n" + "=".repeat(50));
  console.log("DUAL-WRITE VERIFICATION SUMMARY");
  console.log("=".repeat(50));

  for (const r of allResults) {
    const status = r.missingInDb.length === 0 && r.extraInDb.length === 0 && r.fieldMismatches.length === 0 ? "✅" : "❌";
    console.log(`${status} ${r.entity}: JSON=${r.jsonCount}, DB=${r.dbCount}`);
    if (r.missingInDb.length > 0) console.log(`    Missing in DB: ${r.missingInDb.join(", ")}`);
    if (r.extraInDb.length > 0) console.log(`    Extra in DB: ${r.extraInDb.join(", ")}`);
    if (r.fieldMismatches.length > 0) console.log(`    Field mismatches: ${r.fieldMismatches.length}`);
  }

  if (allClean) {
    console.log("\n✅ ALL CLEAN - No drift detected");
    process.exit(0);
  } else {
    console.log("\n❌ DRIFT DETECTED - Run seed.ts to sync");
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(2);
});