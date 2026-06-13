# PLAN — Payload CMS + Astro + Vercel + Neon (Vibe CMS Template)

Reusable boilerplate for CMS-backed marketing sites. **Workflow: vibecode the Astro frontend first with local content, then sync the design into Payload CMS as the final step.**

## Architecture

Monorepo, 2 apps, pnpm workspace:

- `cms/` — Payload CMS on Next.js. Admin UI + REST/GraphQL API. Neon Postgres. Deploys to its own Vercel project (host on a subdomain, e.g. `cms.example.com`).
- `web/` — Astro frontend. Static (SSG) build that fetches Payload via REST + API key at build time. One SSR route for live preview. Deploys to its own Vercel project.

```
.
├─ cms/   Payload + Next (admin + API)
├─ web/   Astro (public site)
└─ pnpm-workspace.yaml
```

Content flow: CMS publish → Vercel Deploy Hook → `web` rebuilds static site.
Media: stored in S3-compatible bucket, served through `web` at `/media/*` via Vercel rewrite.

## Stack

| Concern | Choice |
|---|---|
| CMS | Payload 3.85.x |
| CMS host framework | Next.js 16.2 |
| DB | Neon Postgres (`@payloadcms/db-postgres`) |
| Frontend | Astro 6 + Tailwind 4, `@astrojs/vercel` adapter (static) |
| Storage | S3-compatible (`@payloadcms/storage-s3`) — Vercel Blob / R2 / Supabase / etc. |
| Email | Resend |
| Auth | Payload auth + 2FA (TOTP + email code + backup codes) |
| Design | Premium/editorial |

## Features

- Pages: Landing, About, Blog (list + post), Contact, Legal (privacy/terms)
- SEO: `plugin-seo`, per-page meta/OG, JSON-LD (Organization/Article/BreadcrumbList), sitemap, robots.txt, RSS
- AI/LLM visibility: `llms.txt`, structured data, semantic markup
- Analytics: GTM + GA4 + Umami (self-hosted), cookie-consent gated
- Contact: `plugin-form-builder` + Resend notifications
- 2FA: full (authenticator app, email code fallback, backup codes)
- Redirects collection, full-text search

## Phases

0. **Scaffold** — workspace, root scripts, docs, app skeletons.
1. **Astro frontend (vibecode)** — design system + all pages from local content; SEO/analytics base.
2. **Payload CMS (Neon)** — collections, globals, blocks mirroring Astro; 2FA; Resend; form-builder; API-key auth; seed.
3. **Sync** — Astro fetches Payload at build; local content becomes fallback; preview route; types.
4. **Deploy + docs** — vercel.json, env examples, README/DEPLOYMENT, verify.

See `TASK.md` for live progress.
