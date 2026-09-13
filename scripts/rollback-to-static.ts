/// ============================================================
/// Rollback migration: Flip feature flags back to "static"
/// Task 4.6
/// Usage: pnpm tsx scripts/rollback-to-static.ts
/// ============================================================

import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FEATURES_PATH = path.join(__dirname, "..", "src", "config", "features.json");

async function rollback() {
  console.log("🔄 Rolling back to static data source...\n");

  try {
    const content = await fs.readFile(FEATURES_PATH, "utf-8");
    const features = JSON.parse(content);

    const staticFeatures = {
      products: "static",
      categories: "static",
      solutions: "static",
      kits: "static",
      offers: "static",
      guides: "static",
      faqs: "static",
    };

    await fs.writeFile(FEATURES_PATH, JSON.stringify(staticFeatures, null, 2), "utf-8");
    
    console.log("✅ Feature flags rolled back to 'static':");
    for (const [key, value] of Object.entries(staticFeatures)) {
      console.log(`   ${key}: ${value}`);
    }
    
    console.log("\n📝 Next steps:");
    console.log("   1. Rebuild: pnpm build");
    console.log("   2. Verify pages work with local JSON data");
    console.log("   3. API routes remain available for future re-enable");
    
  } catch (err) {
    console.error("❌ Rollback failed:", err);
    process.exit(1);
  }
}

rollback().catch((err) => {
  console.error("💥 Rollback failed:", err);
  process.exit(1);
});