# TASK — Progress Tracker

Status: 🟡 Phase 2. Legend: ⬜ todo · 🟡 doing · ✅ done.

## Phase 0 — Scaffold monorepo ✅
- ✅ pnpm workspace + root package.json
- ✅ .gitignore
- ✅ PLAN.md / TASK.md
- ✅ AGENTS.md + .agents/ rules
- ✅ cms/ app skeleton (package.json, tsconfig, next config)
- ✅ web/ app skeleton (package.json, astro.config, tailwind)
- ✅ pnpm install (Astro 6.4.6, Payload 3.85.1, latest stable)

## Phase 1 — Astro frontend (vibecode, local content) ✅
- ✅ Design system (Tailwind v4 tokens, Layout, Header/Footer/Button)
- ✅ Local content modules (`web/src/lib/content/`)
- ✅ Block renderer components (8 blocks + dispatcher)
- ✅ Pages: landing, about, blog list, blog post, contact, legal (privacy/terms)
- ✅ SEO: meta/OG helper, JSON-LD, sitemap, robots.txt, llms.txt, RSS
- ✅ Analytics: GTM/GA4/Umami + cookie consent
- ✅ Build verified green (9 routes)

## Phase 2 — Payload CMS on Neon ✅
- ✅ payload.config.ts (Neon postgresAdapter, S3 storage, Resend email)
- ✅ Collections: Users(+2FA), Media, Pages, Posts, Categories
- ✅ Globals: Header, Footer, SiteSettings, EmailSettings
- ✅ Blocks mirroring Astro (8 blocks, matched slugs)
- ✅ Plugins: seo, form-builder, redirects, search, nested-docs, storage-s3, lexical
- ✅ 2FA port (utility + 7 routes + admin UI components + views)
- ✅ Resend email adapter + templates
- ✅ Deploy-hook trigger on publish (replaces Next revalidate)
- ✅ seed.ts (admin, globals, pages, posts, contact form)
- ✅ Build verified green (generate:types, importmap, next build)
- ⚠️ API-key consumer auth: enabled in Phase 3 (Users auth.useAPIKey + web client)

## Phase 3 — Sync Astro → CMS ✅
- ✅ payload.ts REST client (API key for drafts)
- ✅ lexical→HTML converter
- ✅ data.ts: getSite/getPage/getAllPosts/getPost (CMS-or-local fallback)
- ✅ Pages + Layout + rss/llms rewired to data layer
- ✅ Users API key enabled (draft/preview)
- ✅ SSR preview route (/preview, prerender=false)
- ✅ sync:types script
- ✅ SiteSettings/Header/Footer → head + nav + analytics + JSON-LD

## Phase 4 — Deploy + docs + verify ✅
- ✅ cms/vercel.json (60s API timeout); web media rewrite documented
- ✅ .env.example (both apps)
- ✅ README.md + DEPLOYMENT.md
- ✅ AGENTS.md + .agents/rules.md
- ✅ Verify: `pnpm build` green (cms next build + web static+SSR)
- ⏭ Live verify (seed/contact/email/2FA) requires real Neon+Resend creds — steps in DEPLOYMENT.md

## Done
Template complete and building. Next: provide real env (Neon, S3, Resend), run
`pnpm --filter cms migrate && seed`, then `pnpm dev`.
