import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

// Static site → Cloudflare Pages. Build command: `npm run build`, output: `dist`.
// Sitemap is a static file in /public (simpler + reliable for a small site).
export default defineConfig({
  site: 'https://striderunning.run',
  integrations: [tailwind()],
  compressHTML: true,
  build: { inlineStylesheets: 'auto' },
});
