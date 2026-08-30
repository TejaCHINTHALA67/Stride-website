import type { APIRoute } from 'astro';
import { cities } from '../data/cities';

// Dynamic sitemap — auto-includes every city page + blog post so we never
// hand-maintain XML again. (Replaces the old static public/sitemap.xml.)
const SITE = 'https://striderunning.run';
const TODAY = '2026-06-22';

type Entry = { path: string; lastmod?: string; changefreq?: string; priority?: string };

const blogPosts = [
  'how-to-make-running-fun',
  'best-running-games',
  'how-to-stay-motivated-to-run',
  'couch-to-5k-beginners-guide',
  'best-running-apps',
  'what-is-territory-running',
];

const entries: Entry[] = [
  { path: '/', changefreq: 'weekly', priority: '1.0' },
  { path: '/strava-alternative/', changefreq: 'weekly', priority: '0.9' },
  { path: '/run/', changefreq: 'weekly', priority: '0.8' },
  ...cities.map((c) => ({ path: `/run/${c.slug}/`, changefreq: 'monthly', priority: '0.7' })),
  { path: '/blog/', changefreq: 'weekly', priority: '0.7' },
  ...blogPosts.map((slug) => ({ path: `/blog/${slug}/`, changefreq: 'monthly', priority: '0.8' })),
  // The page Pro is actually sold on — high priority, it is a money page.
  { path: '/pricing/', changefreq: 'weekly', priority: '0.9' },
  { path: '/privacy/', changefreq: 'monthly', priority: '0.4' },
  { path: '/refunds/', changefreq: 'monthly', priority: '0.4' },
  { path: '/terms/', changefreq: 'monthly', priority: '0.4' },
  { path: '/delete-account/', changefreq: 'monthly', priority: '0.3' },
  { path: '/disclaimer/', changefreq: 'monthly', priority: '0.4' },
];

export const GET: APIRoute = () => {
  const urls = entries
    .map(
      (e) =>
        `  <url><loc>${SITE}${e.path}</loc><lastmod>${e.lastmod ?? TODAY}</lastmod><changefreq>${e.changefreq ?? 'monthly'}</changefreq><priority>${e.priority ?? '0.5'}</priority></url>`,
    )
    .join('\n');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
