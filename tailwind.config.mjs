/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,ts,tsx,md}'],
  theme: {
    extend: {
      colors: {
        // mirrors the app theme (apps/mobile/src/theme)
        canvas: '#0A0E17',
        surface: '#111827',
        elevated: '#1F2937',
        mint: { DEFAULT: '#06D6A0', dark: '#059669' },
        flame: { DEFAULT: '#FF6B35', hover: '#F97316' },
        gold: '#FBBF24',
        ink: { DEFAULT: '#F9FAFB', soft: '#9CA3AF', faint: '#6B7280' },
      },
      fontFamily: {
        // Clash Display = the app's display font; Satoshi = clean geometric body.
        display: ['"Clash Display"', 'system-ui', 'sans-serif'],
        sans: ['Satoshi', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        glow: '0 0 40px -8px rgba(6,214,160,0.45)',
        'glow-flame': '0 0 40px -8px rgba(255,107,53,0.45)',
      },
      keyframes: {
        'fade-up': { '0%': { opacity: '0', transform: 'translateY(16px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        float: { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-10px)' } },
        'pulse-glow': { '0%,100%': { opacity: '0.5' }, '50%': { opacity: '1' } },
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
