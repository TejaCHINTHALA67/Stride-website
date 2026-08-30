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

const URL_ = import.meta.env.PUBLIC_SUPABASE_URL ?? '';
const KEY = import.meta.env.PUBLIC_SUPABASE_ANON_KEY ?? '';

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
