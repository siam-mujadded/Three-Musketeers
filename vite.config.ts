/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Set VITE_BASE=/<repo-name>/ when deploying to GitHub Pages project sites.
// Leave unset (default '/') for Cloudflare Pages, Netlify, Vercel, or custom domains.
const base = (typeof process !== 'undefined' && process.env && process.env.VITE_BASE) || '/';

export default defineConfig({
  base,
  plugins: [react()],
  build: {
    target: 'es2020',
    sourcemap: false,
  },
  test: {
    globals: true,
    environment: 'node',
  },
});
