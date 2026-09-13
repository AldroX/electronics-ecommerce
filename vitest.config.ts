/// Vitest config with path aliases matching Astro
/// Run: pnpm test

import { defineConfig } from "vitest/config";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["tests/**/*.test.ts"],
    alias: {
      "@": path.resolve(__dirname, "src"),
      "@/lib/data/helpers": path.resolve(__dirname, "src/lib/data/helpers"),
      "@/data/helpers": path.resolve(__dirname, "src/lib/data/helpers"),
      "@/data/types": path.resolve(__dirname, "src/data/types"),
      "@/data": path.resolve(__dirname, "src/data"),
      "@/config": path.resolve(__dirname, "src/config"),
      "@/lib": path.resolve(__dirname, "src/lib"),
    },
  },
});