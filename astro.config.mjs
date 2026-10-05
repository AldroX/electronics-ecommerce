// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from "@tailwindcss/vite";
import sitemap from "@astrojs/sitemap";
import vercel from '@astrojs/vercel';

// https://astro.build/config
export default defineConfig({
  site: "https://energiatotal.cu",
  output: "server",
  adapter: vercel(),
  vite: {
    plugins: [tailwindcss()],
  },
  integrations: [
    sitemap({
      filter: (page) => {
        return (
          !page.includes('/admin/') &&
          !page.includes('/login') &&
          !page.includes('/auth/') &&
          !page.includes('/api/')
        );
      },
    }),
  ],
  // API routes will use Supabase via Kysely for type-safe queries
  // Database types are in src/lib/supabase/types.ts
});