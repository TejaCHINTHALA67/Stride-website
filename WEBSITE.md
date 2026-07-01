# striderunning.run — build & deploy

Astro + Tailwind static site. Build: `npm run build` → `dist/`.
Includes the app deeplink plumbing: `public/.well-known/apple-app-site-association`
(Team ID KD2JWLL2YZ), `public/go.html` app-open fallback, `public/_redirects`
(/e /c /u /r → go.html), `public/_headers` (AASA JSON content-type + security).

## Primary CTA — App Store download
Stride is LIVE on the App Store. The primary call-to-action across the whole
site is the **"Download on the App Store"** badge in `src/components/AppStore.astro`,
linking to the live listing:
`https://apps.apple.com/us/app/conquer-your-city-stride/id6776885395`.
(The old pre-launch waitlist form + Supabase `waitlist_count()` counter has been
removed now that the app is downloadable.)

## Deploy — option A: direct (fastest, works today)
```powershell
cd D:\Terrarun\website
npx wrangler login          # one-time browser auth
npm run build
npx wrangler pages deploy dist --project-name stride-website
```
First deploy creates the Pages project; then attach the custom domain
(Cloudflare dashboard → Pages → stride-website → Custom domains →
striderunning.run). If the site already exists as a Pages project under a
different name, use that name instead so the domain stays attached.

## Deploy — option B: GitHub auto-deploy (push = deploy)
1. Create a GitHub repo (e.g. `stride-website`).
2. From the monorepo, push just this folder:
   ```powershell
   cd D:\Terrarun
   git subtree push --prefix website https://github.com/<you>/stride-website.git main
   ```
3. Cloudflare dashboard → Workers & Pages → Create → Pages →
   **Connect to Git** → pick the repo.
   Build command: `npm run build` · Output directory: `dist` · Root: `/`.
4. Every future `git subtree push` auto-deploys.

## After ANY deploy, verify deeplinks
```
curl -i https://striderunning.run/.well-known/apple-app-site-association
```
→ 200, `content-type: application/json`, JSON containing
`KD2JWLL2YZ.com.teja.stride`. Full checklist in ../DEEPLINKS_SETUP.md.
