/**
 * analytics.ts — the website funnel, measured.
 *
 * ⚠️ THE SITE HAD NO ANALYTICS AT ALL. Not "thin" — none. So the question the
 * funnel exists to answer, *where do people drop out between landing on the site
 * and paying*, could not be answered even in principle. Every decision about this
 * page has been made from first principles because there was nothing else.
 *
 * ⚠️ NO SDK, ON PURPOSE. `posthog-js` is ~60 KB on a static marketing site whose
 * LCP is the funnel, and it brings autocapture, session replay and feature flags
 * we do not use. This is four fetches to a documented public endpoint. It also
 * makes the consent gate trivial: no consent, no request, nothing loaded.
 *
 * ⚠️ THE `distinct_id` IS `public.users.id` ONCE THEY HAVE AN ACCOUNT — the same
 * id `track.identify()` uses in the app. That is what makes "signed up on the web
 * → ran in the app" a single person in one funnel rather than two strangers.
 *
 * ⚠️ PROJECT 315638 IS SHARED with another app. Every event here is prefixed
 * `web_` and carries `surface: 'website'`, and the app's own names are never
 * reused — `onboarding_step`, `sign_in`, `paywall_viewed` belong to the other one.
 */
import { analyticsAllowed } from './consent';

/**
 * ⚠️ `.trim()` ON EVERY ONE, AND IT IS NOT DEFENSIVE PROGRAMMING FOR ITS OWN
 * SAKE. These values are pasted by a human into a Cloudflare dashboard field,
 * and on 2026-09-03 the live site rendered
 * `data-checkout="pri_01m1gaapfrhydp3kwebssdh7df "` — a real trailing space that
 * came straight through the build and into the markup. A trailing space happens
 * to survive `.startsWith()`, so the price ids passed validation; a LEADING one
 * would have failed it silently and disabled checkout with no error anywhere,
 * and a trailing space in the token is handed to `Paddle.Initialize` verbatim.
 * The whole failure mode of this file is silence, so normalise at the boundary.
 */
const KEY = (import.meta.env.PUBLIC_POSTHOG_KEY ?? '').trim();
const HOST = (import.meta.env.PUBLIC_POSTHOG_HOST ?? 'https://us.i.posthog.com').trim();

const ANON_KEY = 'tr.aid.v1';

function anonId(): string {
  try {
    let id = localStorage.getItem(ANON_KEY);
    if (!id) {
      id = 'w_' + (crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(36).slice(2));
      localStorage.setItem(ANON_KEY, id);
    }
    return id;
  } catch {
    // No storage → a per-page id. The session will not stitch, which is a worse
    // funnel but never a broken page.
    return 'w_' + Math.random().toString(36).slice(2);
  }
}

/** The account id, once there is one — set by the funnel after sign-up/sign-in. */
let identified: string | null = null;

function post(body: Record<string, unknown>): void {
  // ⚠️ keepalive: a click that navigates would otherwise cancel the request in
  // flight, and the events that matter most here are the ones on a navigation.
  try {
    fetch(`${HOST}/i/v0/e`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      keepalive: true,
      // Analytics must never hold a page open or surface an error to a visitor.
      mode: 'cors',
    }).catch(() => {});
  } catch { /* blocked by an extension — silently fine */ }
}

export function track(event: string, properties: Record<string, unknown> = {}): void {
  if (!KEY || !analyticsAllowed()) return;
  post({
    api_key: KEY,
    event,
    distinct_id: identified ?? anonId(),
    properties: {
      ...properties,
      surface: 'website',
      // ⚠️ ANONYMOUS UNTIL THERE IS AN ACCOUNT. Without this every visitor
      // creates a person profile, which is both a privacy question we do not
      // need to answer and a bill we do not need to pay.
      ...(identified ? {} : { $process_person_profile: false }),
      $current_url: location.href,
      $pathname: location.pathname,
    },
    timestamp: new Date().toISOString(),
  });
}

/** Called once the account exists. Stitches the anonymous session onto the real
 *  person so the funnel is continuous across the sign-up step. */
export function identify(userId: string): void {
  if (!KEY || !analyticsAllowed() || !userId) return;
  const prev = anonId();
  identified = userId;
  post({
    api_key: KEY,
    event: '$identify',
    distinct_id: userId,
    properties: { $anon_distinct_id: prev, surface: 'website' },
    timestamp: new Date().toISOString(),
  });
}

/** PostHog's own funnel tooling keys off `$pageview`, so it is sent by name
 *  rather than invented. */
export function pageview(): void {
  track('$pageview');
}
