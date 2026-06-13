// @ts-check
import { defineConfig } from 'astro/config'
import vercel from '@astrojs/vercel'
import sitemap from '@astrojs/sitemap'
import tailwindcss from '@tailwindcss/vite'

const SITE = process.env.PUBLIC_SITE_URL || 'http://localhost:4321'

// Static build by default (SSG). The /api/preview route opts into SSR per-route
// via `export const prerender = false`. Vercel adapter supports both.
export default defineConfig({
  site: SITE,
  output: 'static',
  adapter: vercel(),
  integrations: [sitemap()],
  vite: {
    plugins: [tailwindcss()],
  },
})
