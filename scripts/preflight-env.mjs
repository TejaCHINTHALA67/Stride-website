/**
 * preflight-env.mjs — say loudly what a build is missing; block only what is
 * dangerous to ship.
 *
 * ⚠️ WHY THIS EXISTS. Astro inlines `PUBLIC_*` at BUILD time, and Cloudflare
 * supplies them as build variables — so a variable that was never added there
 * produces a build that looks completely normal, deploys cleanly, and is quietly
 * broken. On 2026-09-03 the live site was serving pages with
 * `PUBLIC_POSTHOG_KEY` empty: every `track()` call guards on `if (!KEY) return`,
 * so the bundler eliminated the whole analytics module as dead code — the
 * deployed file was **58 bytes of empty function bodies** — and the website had
 * sent zero events in thirty days. Nothing was wrong with the code, and nobody
 * could have seen it by looking at the site.
 *
 * ⚠️ NOTHING MISSING IS FATAL — ONLY SOMETHING WRONG IS. The first version of
 * this file hard-failed on a missing `PUBLIC_SUPABASE_URL`, and that is the
 * wrong trade: a site missing its Supabase keys renders an honest "not
 * configured" state and loses sign-ups, while a site that CANNOT DEPLOY loses
 * everything — including the fix for whatever else is broken — and leaves the
 * person deploying to work out why from a CI log. Within hours of shipping that
 * version the site stopped deploying and this gate was the prime suspect.
 *
 * A build gate earns a hard failure only when SHIPPING would do damage that NOT
 * shipping would not. Exactly one case here qualifies: a `live_` Paddle token
 * against a sandbox environment (or the reverse), which opens checkout in one
 * environment while the webhook verifies against the other's secret — the
 * customer is charged and never granted Pro. Everything else is a loud warning
 * in the build log.
 */
import fs from 'node:fs';
import path from 'node:path';

/** Missing → a prominent warning in the build log. The build still ships. */
const WARN = [
  ['PUBLIC_SUPABASE_URL', 'sign-up and sign-in will not work — the funnel is dead'],
  ['PUBLIC_SUPABASE_ANON_KEY', 'same: sign-up and sign-in both fail'],
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
 * `process.env` wins where both exist: measured on 2026-09-03 by building with a
 * `.env.production` and a conflicting shell value, and the SHELL value is what
 * Astro inlined. A Cloudflare build variable is the deployed truth.
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
    const value = line.slice(eq + 1).trim().replace(/^(['"])([\s\S]*)\1$/, '$2');
    if (!(key in fileEnv)) fileEnv[key] = value;
  }
}

const get = (k) => (process.env[k] ?? fileEnv[k] ?? '').trim();

for (const [k, why] of WARN) {
  if (!get(k)) console.warn(`preflight-env: WARNING — ${k} is not set: ${why}`);
}

// ── The one fatal case ───────────────────────────────────────────────────────
const env = get('PUBLIC_PADDLE_ENV') || 'sandbox';
const token = get('PUBLIC_PADDLE_TOKEN');
if (token && (env === 'production') !== token.startsWith('live_')) {
  console.error(
    '\npreflight-env: REFUSING TO BUILD.\n\n' +
    `  PUBLIC_PADDLE_ENV=${env} but PUBLIC_PADDLE_TOKEN starts with "${token.slice(0, 5)}".\n` +
    '  Production needs a live_ token and sandbox needs a test_ one. Shipping this\n' +
    '  pair charges customers in one Paddle environment while the webhook verifies\n' +
    '  against the other one, so they pay and are never granted Pro.\n\n' +
    '  Fix in Cloudflare -> Workers & Pages -> stridewebsite -> Settings -> Build\n' +
    '  -> Build variables. Astro inlines PUBLIC_* at build time, so a variable\n' +
    '  change without a rebuild does nothing.\n',
  );
  process.exit(1);
}

console.log(`preflight-env: ok (paddle env=${env}${token ? `, token=${token.slice(0, 5)}...` : ', token unset'})`);
