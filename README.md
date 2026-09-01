# Stride — marketing & App Store landing site (striderunning.run).

A fast, SEO- and AI-optimized landing site for **Stride — Run & Own Your City**.
Built with **Astro + Tailwind**, static output, deployed on **Cloudflare Pages**.
The primary CTA links to the live **App Store** listing. Separate from the app
code (`apps/mobile`).

---

## 1. Local development
```bash
cd website
npm install
npm run dev        # http://localhost:4321
npm run build      # outputs to ./dist
npm run preview    # preview the production build
```
Node 18+ recommended.

## 2. One-time Supabase setup (waitlist)
In the Supabase SQL editor (the **same** project as the app), run:
```
website/supabase/waitlist.sql
```
This creates a `waitlist` table that anonymous visitors can **insert** into (via
the public anon key) but **not read**. Export your list anytime from the
dashboard:
```sql
select email, source, created_at from public.waitlist order by created_at desc;
```
The site reads `PUBLIC_SUPABASE_URL` / `PUBLIC_SUPABASE_ANON_KEY` from `.env`
(already filled in locally; the anon key is safe in the browser).

## 3. Deploy to Cloudflare Pages
1. Push this `website/` folder to a Git repo (or use `npx wrangler pages deploy dist`).
2. Cloudflare dashboard → **Workers & Pages → Create → Pages → Connect to Git**.
3. Build settings:
   - **Framework preset:** Astro
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
   - **Root directory:** `website` (if the repo contains the whole monorepo)
4. **Environment variables** (Settings → Environment variables), for Production **and** Preview:
   - `PUBLIC_SUPABASE_URL` = `https://nqcydhogowrrzrarhcha.supabase.co`
   - `PUBLIC_SUPABASE_ANON_KEY` = (your public anon key)
5. Deploy.

## 4. Connect the domain (striderunning.run — Namecheap)
Easiest path = move DNS to Cloudflare (free):
1. Cloudflare → **Add a site** → `striderunning.run` (Free plan).
2. Cloudflare gives you **two nameservers**. In **Namecheap → Domain → Nameservers**, choose **Custom DNS** and paste them. (Propagation: minutes–hours.)
3. In your Pages project → **Custom domains → Set up a domain** → `striderunning.run` (and `www`). Cloudflare adds the records automatically.

## 5. Free custom email (no paid mailbox) — Cloudflare Email Routing
Get `hello@striderunning.run`, `privacy@…`, `legal@…` forwarded to your personal inbox for **free**:
1. Cloudflare → your domain → **Email → Email Routing → Get started**.
2. Add a **destination address** (your personal Gmail/etc.) and verify it.
3. Create routes: `hello@striderunning.run → your@personal.email` (repeat for `privacy@`, `legal@`, or add a **catch-all**).
4. Cloudflare adds the required MX/TXT records automatically.
> To *send* from that address too, add it as a "Send mail as" alias in Gmail using Cloudflare's worker/SMTP guidance — but receiving (forwarding) is free and instant.

## 6. Social image
`public/images/og.png` is the 1200×630 Terrarun social card referenced by the shared layout.

## 7. AI / chatbot discoverability (built in)
So assistants like ChatGPT, Claude, and Perplexity can read & recommend Stride:
- **`/llms.txt`** — a clean, factual markdown summary of the app (the emerging LLM standard), linked from `<head>`.
- **`robots.txt`** explicitly **allows** GPTBot, ClaudeBot, PerplexityBot, Google-Extended, Applebot-Extended, CCBot, etc.
- **Structured data** (JSON-LD): `SoftwareApplication`, `Organization`, and a `FAQPage` with real Q&A — machine-readable facts engines cite.
- Factual, question-style copy throughout so answer engines can extract clean answers.
Keep `llms.txt` and the FAQ accurate as the app evolves — that's what gets quoted.

## Structure
```
website/
  src/pages/        index, privacy, terms, disclaimer, 404
  src/layouts/      Layout (SEO/head), LegalLayout
  src/components/   Nav, Footer, Waitlist
  src/styles/       global.css (theme + animations)
  public/           robots.txt, llms.txt, _headers, favicon
  supabase/         waitlist.sql
```
