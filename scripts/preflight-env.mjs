/**
 * preflight-env.mjs — refuse to build a site that is silently half-configured.
 *
 * ⚠️ WHY THIS EXISTS. Astro inlines `PUBLIC_*` at BUILD time, and Cloudflare
 * supplies them as build variables — so a variable that was never added there
 * produces a build that looks completely normal, deploys cleanly, and is quietly
 * broken. On 2026-09-03 the live site was serving pages with
 * `PUBLIC_POSTHOG_KEY` empty: `lib/analytics.ts` guards on `if (!KEY) return`,
 * so every `track()` call in the funnel was a no-op and the website had sent
 * **zero events in thirty days**. Nothing was wrong with the code, and nobody
 * could have noticed by looking at the site.
 *
 * The same shape is one Cloudflare variable away from taking real money and
 * granting nothing: `PUBLIC_PADDLE_TOKEN` on `live_` while the webhook still
 * verifies against the sandbox secret (see PADDLE_GO_LIVE.md).
 *
 * So the build refuses. A failed deploy is loud, immediate and fixed in a
 * minute; a successful deploy that lost a month of funnel data is none of those.
 *
 * ⚠️ REQUIRED vs WARNING is a real distinction, not tidiness. Anything the site
 * CANNOT DO ITS JOB WITHOUT is required. Anything whose absence degrades a
 * feature but leaves the page honest is a warning — a preview branch should not
 * be unbuildable because it has no analytics key.
 */
import fs from 'node:fs';
import path from 'node:path';

const REQUIRED = [
  ['PUBLIC_SUPABASE_URL', 'accounts cannot be created without it — the whole funnel is dead'],
  ['PUBLIC_SUPABASE_ANON_KEY', 'same: sign-up and sign-in both fail'],
];

const WARN = [
  ['PUBLIC_POSTHOG_KEY', 'the funnel ships UNMEASURED — exactly what was wrong on 2026-09-03'],
  ['PUBLIC_PADDLE_TOKEN', 'the pricing page renders its "unavailable" state and sells nothing'],
  ['PUBLIC_PADDLE_PRICE_MONTHLY', 'monthly checkout cannot open'],
  ['PUBLIC_PADDLE_PRICE_YEARLY', 'yearly checkout cannot open'],
];

/**
 * ⚠️ READ `.env` OURSELVES. Astro loads env files through Vite, which does NOT
 * put them on `process.env` — so a preflight reading only `process.env` would
 * pass on Cloudflare (where build variables really are process env) and FAIL on
 * every developer machine, which is the fastest way to get a check deleted.
 * `process.env` wins where both exist: a Cloudflare build variable is the
 * deployed truth, and a stale local `.env` must never mask it.
 */
const fileEnv = {};
for (const name of ['.env', '.env.local', '.env.production']) {
  const file = path.join(process.cwd(), name);
  if (!fs.existsSync(file)) continue;
  for (const raw of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq < 1) continue;
    const key = line.slice(0, eq).trim();
    // Strip one layer of surrounding quotes, the way dotenv does.
    const value = line.slice(eq + 1).trim().replace(/^(['"])([\s\S]*)\1$/, '$2');
    if (!(key in fileEnv)) fileEnv[key] = value;
  }
}

const get = (k) => (process.env[k] ?? fileEnv[k] ?? '').trim();

const missing = REQUIRED.filter(([k]) => !get(k));
const soft = WARN.filter(([k]) => !get(k));

// ── The Paddle pair check ────────────────────────────────────────────────────
// A `live_` token with a sandbox environment (or the reverse) is the most
// expensive misconfiguration available here: checkout opens, the customer is
// charged in the wrong environment, and the webhook never matches. The pricing
// page already refuses to render prices in that state — the BUILD should refuse
// too, because a site that shows "unavailable" to every visitor is not worth
// deploying.
const env = get('PUBLIC_PADDLE_ENV') || 'sandbox';
const token = get('PUBLIC_PADDLE_TOKEN');
const pairErrors = [];
if (token) {
  const wantsLive = env === 'production';
  const isLive = token.startsWith('live_');
  if (wantsLive !== isLive) {
    pairErrors.push(
      `PUBLIC_PADDLE_ENV=${env} but PUBLIC_PADDLE_TOKEN starts with "${token.slice(0, 5)}" — ` +
      'production needs a live_ token and sandbox needs a test_ one.',
    );
  }
}

for (const [k, why] of soft) console.warn(`preflight-env: WARNING — ${k} is not set: ${why}`);

if (missing.length || pairErrors.length) {
  console.error('\npreflight-env: REFUSING TO BUILD.\n');
  for (const [k, why] of missing) console.error(`  missing ${k} — ${why}`);
  for (const e of pairErrors) console.error(`  ${e}`);
  console.error(
    '\nThese live in Cloudflare -> Settings -> Build -> Build variables. Astro\n' +
    'inlines PUBLIC_* at build time, so changing one without rebuilding does\n' +
    'nothing at all.\n',
  );
  process.exit(1);
}

console.log(`preflight-env: ok (paddle env=${env}${token ? `, token=${token.slice(0, 5)}...` : ', token unset'})`);
