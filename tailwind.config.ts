import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        parchment: {
          50: '#fbf5e2',
          100: '#f7ecc9',
          200: '#f3e6c4',
          300: '#e8d494',
          400: '#d4b665',
        },
        gold: {
          400: '#e0b957',
          500: '#c9a24a',
          600: '#a8842f',
          700: '#7a5d1e',
        },
        royal: {
          500: '#2a3f7a',
          600: '#1f3066',
          700: '#1b2a5b',
          800: '#121e44',
          900: '#0a132e',
        },
        burgundy: {
          500: '#702030',
          600: '#5a1825',
          700: '#44121c',
          800: '#2f0c13',
          900: '#1a060a',
        },
      },
      fontFamily: {
        display: ['Cinzel', 'Georgia', 'serif'],
        serif: ['"EB Garamond"', 'Georgia', 'serif'],
      },
      boxShadow: {
        card: '0 8px 20px rgba(0,0,0,0.35), 0 2px 4px rgba(0,0,0,0.2)',
        'card-hover': '0 14px 28px rgba(0,0,0,0.45), 0 4px 8px rgba(0,0,0,0.25)',
        'inner-gold': 'inset 0 0 0 2px #c9a24a, inset 0 0 0 4px #1b2a5b',
      },
      keyframes: {
        shimmer: {
          '0%, 100%': { opacity: '0.9' },
          '50%': { opacity: '1' },
        },
      },
      animation: {
        shimmer: 'shimmer 2.4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
} satisfies Config;
