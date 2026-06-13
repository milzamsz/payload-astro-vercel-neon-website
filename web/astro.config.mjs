// @ts-check
import { defineConfig } from 'astro/config'
import vercel from '@astrojs/vercel'
import sitemap from '@astrojs/sitemap'
import tailwindcss from '@tailwindcss/vite'

const SITE = process.env.PUBLIC_SITE_URL || 'http://localhost:4321'

// Public pages render on demand so published CMS changes appear immediately.
// Draft content remains isolated to the dedicated preview route.
export default defineConfig({
  site: SITE,
  output: 'server',
  adapter: vercel(),
  integrations: [sitemap()],
  vite: {
    plugins: [tailwindcss()],
  },
})
