# Payload CMS + Astro + Vercel + Neon — Vibe CMS Template

A production-ready monorepo boilerplate for CMS-backed marketing sites. Design the
Astro frontend first against local content, then sync it to Payload CMS for live
server-rendered content.

```
.
├─ cms/   Payload CMS on Next.js — admin UI + REST/GraphQL API (Neon Postgres)
├─ web/   Astro SSR site — consumes published CMS content via REST on Vercel
├─ PLAN.md · TASK.md · AGENTS.md
```

## Stack

- **Payload 3.85** on **Next.js 16** — headless CMS + admin
- **Neon** Postgres (`@payloadcms/db-postgres`)
- **Astro 6** + **Tailwind 4** — SSR frontend on `@astrojs/vercel`
- **Resend** transactional email · **S3-compatible** media storage
- Two separate **Vercel** projects

## Features

- Pages: landing, about, blog (list + post), contact, legal (privacy/terms)
- **SEO**: `plugin-seo`, per-page meta/OG, JSON-LD (Organization/Article/Breadcrumb), sitemap, RSS
- **AI/LLM visibility**: `llms.txt`, structured data, semantic markup, AI-crawler rules in robots
- **Analytics**: GTM + GA4 (consent-gated) + Umami (cookieless), configurable in CMS or env
- **2FA**: authenticator app (TOTP) + email code + backup codes, full admin UI
- **Contact**: `plugin-form-builder` + Resend notifications
- Redirects collection, live search, draft/version live preview, R2-backed media, dark mode

## Quick start

```bash
pnpm install

# 1. CMS
cp cms/.env.example cms/.env          # fill DATABASE_URL (Neon), PAYLOAD_SECRET, S3, RESEND
pnpm --filter cms migrate             # apply file-based migrations
pnpm --filter cms seed                # create admin + starter content (needs reachable DB)

# 2. Web
cp web/.env.example web/.env          # set PUBLIC_CMS_URL once the CMS is running (optional for local-only)

# 3. Run both
pnpm dev                              # cms → http://localhost:3000/admin · web → http://localhost:4321
```

Develop **frontend-first**: leave `PUBLIC_CMS_URL` blank and the Astro site renders
from `web/src/lib/content/*`. Set it to pull published content from the CMS on each request.

Published edits now appear on the live website immediately after publish. Drafts stay private and
only render through `/preview` with a shared `PREVIEW_SECRET`.

## Live CMS model

- Public pages are SSR on Vercel and read published Payload content at request time.
- Local content remains as the fallback when `PUBLIC_CMS_URL` is unset or CMS fetches fail.
- Draft content is isolated to `/preview` and requires `PREVIEW_SECRET` plus `PAYLOAD_API_KEY`.
- Payload media uses S3-compatible storage. The seed script uploads starter images and attaches
  them to pages/posts when those relationships are missing.
- The deploy hook is optional now. Keep it for rebuild side effects, not for basic freshness.

## Workflow

See [AGENTS.md](AGENTS.md). The short version:

1. Build/iterate the design in `web/` against local content.
2. Mirror finished blocks into `cms/src/blocks/` and `web/src/components/blocks/`
   with the same `blockType` strings.
3. Point `web` at the CMS (`PUBLIC_CMS_URL`); public routes then render published CMS data live.
4. For schema/block changes, regenerate Payload types/import map and sync web types before commit.

## Scripts (root)

| Command | Action |
|---|---|
| `pnpm dev` | run cms + web in parallel |
| `pnpm build` | build both apps |
| `pnpm --filter cms seed` | seed Neon with starter content |
| `pnpm --filter cms migrate` | apply file-based migrations |
| `pnpm --filter cms generate:types` | regenerate Payload types |
| `pnpm --filter cms generate:importmap` | regenerate Payload admin import map |
| `pnpm --filter web sync:types` | copy CMS types into web |

Deployment: see [DEPLOYMENT.md](DEPLOYMENT.md).

## Production checklist

- Rotate any secrets shared outside a password manager before production use.
- Configure separate Vercel projects for `cms/` and `web/`.
- Set `PREVIEW_SECRET` to the same value in both projects.
- Verify `/api/health` on CMS, public pages on web, search, contact form submissions, and R2 media URLs.
