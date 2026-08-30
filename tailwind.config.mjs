/**
 * TAILWIND — the website's half of RELIEF.
 *
 * ⚠️ THE SITE USED TO BE THE APP'S OLD SKIN: a near-black canvas, frosted glass
 * panels and mint GLOW shadows. The app abandoned all three in the 2026-08 relief
 * pass, and glow specifically is now machine-banned there (`scripts/check-glow.js`
 * — "colour lives in the FACE of a thing, never in the air around it"). A website
 * still wearing the old look does not read as the same product.
 *
 * ⚠️ THE CLASS NAMES ARE DELIBERATELY UNCHANGED. `.glass`, `shadow-glow`,
 * `text-gradient` and friends are used ~40 times across 28 pages (blog, city
 * landers, legal). Renaming them would mean touching every file and would leave
 * the two trees able to drift. Instead the NAMES stay and the MEANING changes, so
 * one config plus one stylesheet reskins the entire site — including pages nobody
 * has to remember to update.
 *
 * Every value below is copied from `apps/mobile/src/theme/index.ts`. When that
 * file moves, this one moves with it — they are one design system.
 */

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,ts,tsx,md}'],
  theme: {
    extend: {
      colors: {
        // ── the clubhouse ground (theme `light`) ────────────────────────────
        // The whole site is carved out of ONE colour. Nothing floats on it.
        canvas: '#E7ECEA',   // light.bg — cool off-white; both neu shadows read on it
        surface: '#E7ECEA',  // light.surface — tiles extrude from the same colour
        elevated: '#EEF2F0', // light.raised
        sunken: '#DDE3E0',   // light.sunken — wells, inputs, pressed states

        // ⚠️ `ink` is now DARK. It is used 124× across the site as the body
        // colour, so flipping it here is what turns every existing page light.
        ink: {
          DEFAULT: '#0F1714',  // light.text.primary
          soft: '#586A63',     // light.text.secondary
          // ⚠️ NOT light.text.tertiary (#8A9791) — that is 3.04:1 on this ground
          // and is banned in the app for anything under 14px. `relief.wellInk`
          // is the AA-safe secondary (4.55:1) and is what small copy must use.
          faint: '#566861',    // relief.wellInk
          on: '#04231B',       // light.text.onAccent
        },

        mint: { DEFAULT: '#06D6A0', dark: '#059669' }, // light.accent / accentDeep
        flame: { DEFAULT: '#FF6B35', hover: '#F97316' },
        gold: '#E0A400',
        danger: '#E5484D',

        // ── the band: the app's ONE green surface (relief.band) ─────────────
        // ⚠️ This ramp is deliberately deeper than brand mint. White on flat
        // #06D6A0 is 1.89:1; every stop here clears 4.8:1, which is why any
        // green surface carrying text uses the band and never the raw accent.
        band: {
          top: '#04815F',
          mid: '#046B4D',
          deep: '#03503A',
          accent: '#5FF3C0', // bright mint FOR USE ON the band (4.75:1 on mid)
        },
      },

      fontFamily: {
        display: ['"Clash Display"', 'system-ui', 'sans-serif'],
        sans: ['Satoshi', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },

      boxShadow: {
        // ⚠️ `glow` NO LONGER GLOWS, and the name is kept only so the six
        // existing `shadow-glow` call sites reskin themselves. It is now the
        // neumorphic PAIR from `relief.key.rest`: ink down-right, white
        // up-left — a surface raised out of the ground, not a light behind it.
        glow: '4px 5px 10px rgba(160,176,169,0.60), -4px -5px 10px rgba(255,255,255,0.95)',
        'glow-flame': '4px 5px 10px rgba(160,176,169,0.60), -4px -5px 10px rgba(255,255,255,0.95)',
        // A tight contact shadow — for something resting ON the ground.
        contact: '0 2px 6px rgba(15,23,20,0.22)',
        // Debossed: the same pair inverted and drawn inside. Selection is a WELL.
        well: 'inset 3px 4px 8px rgba(160,176,169,0.55), inset -3px -4px 8px rgba(255,255,255,0.90)',
      },

      keyframes: {
        'fade-up': { '0%': { opacity: '0', transform: 'translateY(16px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        float: { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-10px)' } },
        'pulse-glow': { '0%,100%': { opacity: '0.55' }, '50%': { opacity: '1' } },
        sheen: { '0%': { transform: 'translateX(-120%)' }, '100%': { transform: 'translateX(220%)' } },
      },
      animation: {
        'fade-up': 'fade-up 0.7s cubic-bezier(0.16,1,0.3,1) both',
        float: 'float 6s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 2.4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
