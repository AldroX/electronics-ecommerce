/// ============================================================
/// Fix FAQs migration only (uses question as upsert key)
/// Usage: pnpm tsx scripts/fix-faqs.ts
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
  console.error("❌ Missing env vars");
  process.exit(1);
}

const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const DATA_DIR = path.join(__dirname, "..", "src", "data");

async function loadJson(filename: string) {
  const filePath = path.join(DATA_DIR, filename);
  const content = await fs.readFile(filePath, "utf-8");
  return JSON.parse(content);
}

async function fixFaqs() {
  console.log("🔧 Fixing FAQs migration...\n");

  // 1. Delete existing FAQs
  const { error: delError } = await supabase.from("faqs").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  if (delError) {
    console.error("❌ Delete failed:", delError.message);
    return;
  }
  console.log("  🗑️  Old FAQs deleted");

  // 2. Load JSON
  const faqs = await loadJson("faq.json");
  console.log(`  📥 Loaded ${faqs.length} FAQs from JSON`);

  // 3. Insert with new UUIDs (simple insert since we deleted all)
  for (const faq of faqs) {
    const mapped = {
      id: randomUUID(),
      question: faq.question,
      answer: faq.answer,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from("faqs")
      .insert(mapped as Database["public"]["Tables"]["faqs"]["Insert"]);

    if (error) {
      console.error(`  ❌ FAQ "${faq.question}":`, error.message);
    } else {
      console.log(`  ✅ ${faq.question.slice(0, 50)}...`);
    }
  }

  console.log("\n✅ FAQs fixed!");
}

fixFaqs().catch((err) => {
  console.error("💥 Fix failed:", err);
  process.exit(1);
});