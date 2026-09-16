/**
 * The marketing site's Worker entry point — and it exists for exactly one reason:
 * TO STOP DEEP LINKS LOSING THEIR PATH.
 *
 * ── THE BUG THIS FIXES (found 2026-09-16, live) ────────────────────────────────────────────
 *
 * `public/_redirects` carried these, and every one of them was silently broken:
 *
 *     /i/*  /invite.html?code=:splat  200
 *     /e/*  /go.html                  200      (and /c/*, /u/*, /r/*)
 *
 * Cloudflare Workers static assets does NOT serve a 200 rewrite in place. It answers with a
 * 307 to the canonical asset URL — and that redirect drops both the original path and the
 * query string. Measured against the live site:
 *
 *     GET /i/ALEX5K      ->  307  Location: /invite     (the code is gone)
 *     GET /e/EVENT123    ->  307  Location: /go         (the path is gone)
 *
 * Both destination pages read the thing that just got thrown away: `invite.html` reads the
 * code, and `go.html` reads `location.pathname` to say whether the link was an event, a club,
 * a profile or a run. So every shared invite landed on "Ask your friend for their code", and
 * the Android Play referrer — which is how an invite is attributed on Android at all — was
 * never built.
 *
 * ⚠️ AND THE `?code=:splat` REWRITE COULD NEVER HAVE WORKED. Cloudflare's own `_redirects`
 * documentation lists query parameters as unsupported: a destination may contain a STATIC
 * query string, but a captured `:splat` cannot be substituted into one. The rule was
 * describing an intention the platform does not implement, which is why the comment above it
 * described behaviour nobody had verified.
 *
 * ── THE FIX ────────────────────────────────────────────────────────────────────────────────
 *
 * Serve the fallback page IN PLACE, from the Worker, with no redirect at all. The browser's
 * URL stays `/i/ALEX5K`, so the page's own script reads the code straight off the path exactly
 * as it was always written to.
 *
 * ⚠️ THE MATCHING `_redirects` RULES MUST STAY DELETED. Static assets (including `_redirects`)
 * are evaluated BEFORE this Worker unless `run_worker_first` is set, so a rule left behind for
 * any of these prefixes would redirect the request away before this code ever runs.
 *
 * ⚠️ FETCH THE CLEAN URL, NOT THE `.html` ONE. Asking the asset binding for `/invite.html`
 * earns the same 307 canonicalisation this file exists to avoid; `/invite` and `/go` are what
 * the assets are actually served at.
 *
 * Everything that is not a deep link falls straight through to the static site.
 */
interface Env {
  ASSETS: Fetcher;
}

/** First path segment → the page that handles it, at its canonical (extension-less) URL. */
const DEEP_LINKS: Record<string, string> = {
  i: '/invite',
  e: '/go',
  c: '/go',
  u: '/go',
  r: '/go',
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const [, prefix, rest] = url.pathname.split('/');
    const page = DEEP_LINKS[prefix];

    // `rest` must be present: a bare `/i` or `/e` is not a deep link and should 404 through
    // to the static site like any other unknown path.
    if (page && rest) {
      const asset = await env.ASSETS.fetch(new Request(new URL(page, url), request));
      // Re-wrap so the response is returned at the ORIGINAL url with a 200. Copying the body
      // and init keeps the asset's own content-type and cache headers.
      return new Response(asset.body, {
        status: asset.status,
        statusText: asset.statusText,
        headers: asset.headers,
      });
    }

    return env.ASSETS.fetch(request);
  },
};
