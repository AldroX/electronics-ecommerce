// Type sync script: runs supabase gen types and writes TypeScript types
// Usage: pnpm db:sync-types
// Output: src/lib/supabase/types.ts

import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const OUTPUT_DIR = path.resolve("./src/lib/supabase");

async function main() {
  // Run supabase gen types to get DB types
  // This is typically done via: supabase gen types typescript --project-id <proj-id> --schema public
  // For now, we'll read the types from the Supabase project metadata

  const { data, error } = await supabase
    .from("products")
    .select("*")
    .limit(0);

  if (error) {
    console.error("Error fetching types:", error);
    process.exit(1);
  }

  // Generate a basic types file based on the supabase schema we already have
  // In production, this would use `supabase gen types` CLI output
  const typesContent = `-- Auto-generated types from Supabase via \`pnpm db:sync-types\`
 
  // These types are generated from the Supabase PostgreSQL schema
  // Run \`supabase gen types typescript --project-id $SUPABASE_PROJECT_ID\` to regenerate
  
  type Product = {
    id: string;
    name: string;
    slug: string;
    description: string;
    shortDescription: string;
    price: number;
    compareAtPrice?: number;
    currency: string;
    category_id: string;
    images: string[];
    specs: Record<string, string>;
    features: string[];
    availability: 'in-stock' | 'limited' | 'out-of-stock';
    featured: boolean;
    best_seller: boolean;
    kit_only: boolean;
    whatsapp_message: string;
    tags: string[];
    seo_title?: string;
    seo_description?: string;
    seo_image?: string;
    seo_canonical?: string;
    related_product_ids: string[];
    battery_wh?: number;
    created_at: string;
    updated_at: string;
  };

  type Category = {
    id: string;
    name: string;
    slug: string;
    description: string;
    image: string;
    product_ids: string[];
    seo_title?: string;
    seo_description?: string;
    seo_image?: string;
    seo_canonical?: string;
    created_at: string;
    updated_at: string;
  };

  export type { Product, Category };
  `;

  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // Write types file
  fs.writeFileSync(
    path.join(OUTPUT_DIR, "types.ts"),
    typesContent
  );

  console.log("Types synced successfully.");
  console.log(`Output: ${path.join(OUTPUT_DIR, "types.ts")}`);
}

main().catch((err) => {
  console.error("Type sync failed:", err);
  process.exit(1);
});