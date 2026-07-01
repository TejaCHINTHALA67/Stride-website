import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

import cloudflare from "@astrojs/cloudflare";

// Static site → Cloudflare Pages. Build command: `npm run build`, output: `dist`.
// Sitemap is a static file in /public (simpler + reliable for a small site).
export default defineConfig({
  site: 'https://striderunning.run',

  // Cloudflare Pages serves directory index files at a trailing-slash URL
  // (/terms → 308 → /terms/). Force trailing slashes everywhere so our
  // canonicals, sitemap and internal links all match the URL Google actually
  // crawls — fixes "Alternative page with proper canonical tag" in GSC.
  trailingSlash: 'always',

  integrations: [tailwind()],
  compressHTML: true,
  build: { inlineStylesheets: 'auto' },
  output: "hybrid",
  adapter: cloudflare()
});