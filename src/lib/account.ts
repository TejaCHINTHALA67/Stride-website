/**
 * account.ts — the website's half of Terrarun identity.
 *
 * ⚠️ NO `@supabase/supabase-js`, ON PURPOSE. The library is ~110 KB on a static
 * marketing site whose whole job is to load fast, and everything below is five
 * REST calls. GoTrue and PostgREST are plain HTTP; a dependency here would buy
 * nothing and cost the LCP the funnel depends on.
 *
 * ⚠️ `users.id` IS NOT `auth.uid()`. This is the single easiest thing to get
 * wrong in this codebase and it silently breaks payment: `public.users` has its
 * OWN uuid and an `auth_id` pointing at the auth row, and every gate in the app
 * — `current_user_id()`, `is_premium`, the Paddle webhook — keys off
 * `public.users.id`. Attaching the auth uid to a checkout means the payment
 * arrives for an account that does not exist.
 *
 * ⚠️ AND THE CLIENT NEVER GRANTS ANYTHING. Nothing here writes entitlement;
 * `is_premium` is locked to the service role (migration 033) and only the
 * webhook may set it. The browser's job ends at "here is who is paying".
 */

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
const URL_ = (import.meta.env.PUBLIC_SUPABASE_URL ?? '').trim();
const KEY = (import.meta.env.PUBLIC_SUPABASE_ANON_KEY ?? '').trim();

export const configured = Boolean(URL_ && KEY);

export interface Account {
  /** `public.users.id` — the id EVERYTHING else keys off. */
  userId: string;
  /** The auth session token, for authenticated PostgREST writes. */
  accessToken: string;
  email: string;
}

/** Matches the app's `HANDLE_RE` exactly. A handle accepted here and rejected
 *  there would leave somebody paid-up and unable to finish signing in. */
export const HANDLE_RE = /^[a-z0-9_]{3,20}$/;

/** The app's own `colors.userPalette`. Kept in step by hand — twelve values that
 *  have not changed since the palette was introduced. */
export const PALETTE = [
  '#15E6A6', '#4DA6FF', '#FF5C5C', '#FFC24D', '#B68CFF', '#FF6FD8',
  '#2FE3D0', '#FF8A3D', '#7C8CFF', '#3DDC84', '#FF5C8A', '#36C6FF',
];

function headers(token?: string): Record<string, string> {
  return {
    apikey: KEY,
    Authorization: `Bearer ${token || KEY}`,
    'Content-Type': 'application/json',
  };
}

/** Advisory only — the DB's unique index is the authority, exactly as in the
 *  app. A `false` here is a fast no; a `true` is not a reservation. */
export async function usernameAvailable(name: string): Promise<boolean> {
  if (!HANDLE_RE.test(name)) return false;
  try {
    const r = await fetch(`${URL_}/rest/v1/rpc/username_available`, {
      method: 'POST', headers: headers(), body: JSON.stringify({ p_name: name }),
    });
    if (!r.ok) return true; // can't tell → let the unique index decide
    return (await r.json()) === true;
  } catch {
    return true;
  }
}

/** Resolve `public.users.id` for a signed-in auth user.
 *
 *  ⚠️ It retries. The row is created by the `on_auth_user_created` trigger, and
 *  although that runs inside the signup transaction, PostgREST reads through a
 *  pooled connection — a first read landing empty is rare but survivable, and a
 *  failure here means a paid account with nothing to attach the payment to. */
async function resolveUserId(authId: string, token: string): Promise<string> {
  for (let attempt = 0; attempt < 4; attempt++) {
    const r = await fetch(`${URL_}/rest/v1/users?auth_id=eq.${authId}&select=id&limit=1`, { headers: headers(token) });
    if (r.ok) {
      const rows = await r.json();
      if (Array.isArray(rows) && rows[0]?.id) return rows[0].id as string;
    }
    await new Promise((res) => setTimeout(res, 250 * (attempt + 1)));
  }
  throw new Error('Your account was created but is still setting up. Try signing in again in a moment.');
}

async function gotrue(path: string, body: unknown): Promise<{ access_token: string; user: { id: string; email?: string } }> {
  const r = await fetch(`${URL_}/auth/v1/${path}`, { method: 'POST', headers: headers(), body: JSON.stringify(body) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) {
    if (r.status === 429) {
      throw new Error('Too many account attempts from this connection. Wait a minute, then try again.');
    }
    // GoTrue's own message is usually the clearest thing we can say.
    throw new Error(j?.msg || j?.error_description || j?.message || 'Something went wrong. Please try again.');
  }
  if (!j?.access_token) {
    // ⚠️ Reachable only if email confirmation gets turned ON later. Say the true
    // thing rather than failing silently mid-signup.
    throw new Error('Check your email to confirm your account, then come back and sign in.');
  }
  return j;
}

export async function signUp(email: string, password: string): Promise<Account> {
  const s = await gotrue('signup', { email, password });
  return { userId: await resolveUserId(s.user.id, s.access_token), accessToken: s.access_token, email: s.user.email ?? email };
}

export async function signIn(email: string, password: string): Promise<Account> {
  const s = await gotrue('token?grant_type=password', { email, password });
  return { userId: await resolveUserId(s.user.id, s.access_token), accessToken: s.access_token, email: s.user.email ?? email };
}

/** Set the two things the app would otherwise ask for. Deliberately does NOT set
 *  `onboarded_at`: the tutorial is where somebody learns the game, and a runner
 *  who paid on the web should still be taught it. Leaving it null routes them
 *  through the tutorial with their name and colour already chosen. */
export async function setProfile(acc: Account, username: string, color: string): Promise<void> {
  const r = await fetch(`${URL_}/rest/v1/users?id=eq.${acc.userId}`, {
    method: 'PATCH',
    headers: { ...headers(acc.accessToken), Prefer: 'return=minimal' },
    body: JSON.stringify({ username, territory_color: color }),
  });
  if (!r.ok) {
    const t = await r.text();
    // The unique index is the authority — this is the case it catches.
    if (/duplicate|unique/i.test(t)) throw new Error('That name has just been taken. Try another.');
    throw new Error('Could not save your profile. Please try again.');
  }
}

/** Remembered so /pricing can attach it to the checkout, and /welcome can poll.
 *  Session-scoped: this is a purchase flow, not a logged-in web app. */
export function remember(acc: Account): void {
  try {
    sessionStorage.setItem('tr.acc', JSON.stringify({ userId: acc.userId, token: acc.accessToken, email: acc.email }));
  } catch { /* private mode — the flow still works within the page */ }
  (window as unknown as { __terrarunUserId?: string }).__terrarunUserId = acc.userId;
}

export function recall(): { userId: string; token: string; email: string } | null {
  try {
    const raw = sessionStorage.getItem('tr.acc');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/** Has the webhook granted Pro yet? Used by /welcome, which must never claim
 *  Pro on the strength of a redirect — Paddle returning to a success URL means
 *  "paid", and only the webhook means "entitled". */
export async function isPro(userId: string, token: string): Promise<boolean> {
  try {
    const r = await fetch(`${URL_}/rest/v1/users?id=eq.${userId}&select=is_premium,premium_expires_at&limit=1`, { headers: headers(token) });
    if (!r.ok) return false;
    const row = (await r.json())?.[0];
    if (!row?.is_premium) return false;
    const exp = row.premium_expires_at ? Date.parse(row.premium_expires_at) : NaN;
    return Number.isNaN(exp) || exp > Date.now();
  } catch {
    return false;
  }
}

/* ─────────────────────────────────────────────────────────────────────────────
 * WHICH DEVICE IS ASKING, AND WHY IT CHANGES WHAT WE SAY
 *
 * ⚠️ A WEB PURCHASE IS LEGAL ON IPHONE, AND IT ALREADY WORKS. App Review
 * guideline 3.1.3(b) (Multiplatform Services) permits an app to "allow users to
 * access content, subscriptions, or features they have acquired… on other
 * platforms or your web site, provided those items are also available as
 * in-app purchases within the app" — and Pro IS an in-app purchase on iOS. The
 * entitlement lives on `users.is_premium`, which `useIsPro()` short-circuits on
 * before it ever asks the store, so an iPhone signed in to a web-paid account is
 * Pro with no client change. Nothing here needs to block that.
 *
 * ⚠️ WHAT IS NOT PERMITTED IS THE APP STEERING THEM HERE. That is 3.1.1, and the
 * app does not do it — there is no link to this site from inside iOS. The site's
 * own obligation is smaller but real: an iPhone visitor should be told that Pro
 * is one Face ID tap away inside the app they can install for free, because that
 * is genuinely the better route for them, and because a site that funnels iOS
 * users into a card form is the thing that draws attention to a boundary we are
 * currently on the right side of. The web plans stay visible — hiding them would
 * be a lie, and iPads and desktops share this code path — they are just not the
 * recommendation.
 *
 * iPadOS reports itself as a Macintosh, so the touch-point test is not optional.
 */
export type DevicePlatform = 'ios' | 'android' | 'other';

export function devicePlatform(): DevicePlatform {
  if (typeof navigator === 'undefined') return 'other';
  const ua = navigator.userAgent || '';
  if (/Android/i.test(ua)) return 'android';
  if (/iPhone|iPad|iPod/i.test(ua)) return 'ios';
  // iPadOS 13+ ships a desktop UA; only the touch points give it away.
  if (/Macintosh/.test(ua) && (navigator.maxTouchPoints ?? 0) > 1) return 'ios';
  return 'other';
}

/** Canonical origin. Paddle requires `successUrl` to be an absolute URL, and a
 *  preview deployment sending someone to the production /welcome would strand
 *  them in a browser with no session — so this is derived, never typed twice. */
export const SITE = 'https://striderunning.run';
export function successUrl(): string {
  const origin = typeof location !== 'undefined' ? location.origin : SITE;
  return `${origin}/welcome/`;
}

/**
 * The ONE checkout call. Both the funnel and /pricing open Paddle through this
 * so the two can never drift apart on the things that matter.
 *
 * ⚠️ `customData.app_user_id` IS THE ENTIRE INTEGRATION — the only thread tying
 * a payment to a Terrarun account. Without it somebody pays and the webhook has
 * nobody to grant.
 *
 * ⚠️ PREFILLING `customer.email` AND `customer.address.countryCode` SKIPS
 * PADDLE'S FIRST CHECKOUT PAGE and lands them straight on payment — a step
 * removed from a funnel where 90% of traffic is a phone. The country comes from
 * Paddle's own geolocation in the price preview, so it costs no extra question.
 *
 * ⚠️ IT DOES NOT SKIP EVERYWHERE, AND THAT IS NOT A BUG. Paddle also needs a
 * ZIP/postal code in the markets that require one for tax or banking compliance
 * (Australia and the United States among them); there the first page still
 * appears, asking only for that. Never promise "one page" in copy.
 *
 * The email prefill also makes the receipt arrive at the address the account
 * uses — and `allowLogout: false` keeps it that way, so nobody pays under an
 * email they will later try to sign in with and find nothing on.
 */
export function openCheckout(opts: {
  priceId: string;
  userId: string;
  email?: string;
  /** ISO-3166 alpha-2. Paddle geolocated it for the price preview; passing it
   *  back is what lets the checkout skip its first page. */
  countryCode?: string;
  onError?: () => void;
}): boolean {
  const P = (window as unknown as { Paddle?: any }).Paddle;
  if (!P?.Checkout?.open) { opts.onError?.(); return false; }
  // ⚠️ `customer` MUST BE OMITTED ENTIRELY when we know nothing — Paddle rejects
  // an empty customer object, and an empty `address` is worse than no address.
  const customer: Record<string, unknown> = {};
  if (opts.email) customer.email = opts.email;
  if (opts.countryCode) customer.address = { countryCode: opts.countryCode };
  try {
    P.Checkout.open({
      items: [{ priceId: opts.priceId, quantity: 1 }],
      ...(Object.keys(customer).length ? { customer } : {}),
      customData: { app_user_id: opts.userId },
      settings: {
        displayMode: 'overlay',
        theme: 'light',
        variant: 'one-page',
        allowLogout: false,
        successUrl: successUrl(),
      },
    });
    return true;
  } catch {
    opts.onError?.();
    return false;
  }
}
