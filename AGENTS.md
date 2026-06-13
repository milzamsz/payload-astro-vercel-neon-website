# AGENTS.md

Guidance for AI agents (and humans) working in this template.

## What this is

Monorepo, 2 apps:
- `cms/` — Payload CMS on Next.js (admin + API), Neon Postgres.
- `web/` — Astro SSR site on Vercel. Public routes consume published Payload content via REST at request time. Draft preview uses an API key plus `PREVIEW_SECRET`.

## Core workflow: vibecode-first

**Build the Astro frontend FIRST against local content, then sync to CMS.**

1. Design and iterate pages in `web/` using typed local content in `web/src/lib/content/`. No CMS dependency required to develop the look.
2. Block renderer components in `web/src/components/blocks/` map 1:1 to Payload blocks in `cms/src/blocks/`. Keep them in sync — same block `type` strings, same field shapes.
3. Once the design is final, wire pages to the CMS (`web/src/lib/payload.ts`). Local content stays as typed fallback for dev and CMS failure resilience.

Do NOT force CMS content into a page before its design is settled. Local-content-first is intentional.

Current public-site behavior: published CMS edits should appear on the web app immediately without a web rebuild. Do not reintroduce `getStaticPaths` or static prerendering for CMS-backed routes unless the product goal explicitly changes.

## Rules

- **Schema changes** (collections, fields, blocks): after editing, regenerate artifacts in `cms/`:
  ```
  pnpm --filter cms generate:types
  pnpm --filter cms generate:importmap
  ```
  Commit `cms/src/payload-types.ts` and `cms/src/app/(payload)/admin/importMap.js` together.
- After CMS schema changes, mirror types into `web/`: `pnpm --filter web sync:types` (copies/derives from `cms/src/payload-types.ts`).
- Do NOT change collection `slug`s, access control, or hooks without explicit instruction — the Astro client, seed, and migrations depend on them.
- Block parity: adding a CMS block means adding its Astro renderer (and vice versa). A block with no renderer silently drops on the frontend.
- Migrations are file-based (`push: false`). Create with `pnpm --filter cms migrate:create`, never rely on auto-push in production.
- If `migrate:create` is blocked by local CLI/runtime issues, a hand-written migration is acceptable only when it matches Payload's table conventions and is verified with `pnpm --filter cms migrate`.
- Analytics IDs, JSON-LD org, nav, and footer live in CMS globals (`SiteSettings`, `Header`, `Footer`) — not hardcoded. Public SSR reads these at request time through the data layer.
- Secrets (`PAYLOAD_SECRET`, `DATABASE_URL`, `RESEND_API_KEY`, S3 keys, `PAYLOAD_API_KEY`, `PREVIEW_SECRET`, Vercel tokens) only in env. Never commit `.env`.
- Public routes must fetch published content only. `draft: true` belongs only in the preview flow.
- R2/S3 media should be represented as Payload `media` docs. Seed may backfill missing starter media, but should not overwrite user-authored content.
- Contact forms should be rendered through Payload form-builder data and the `formBlock` renderer, not hardcoded per page.
- CMS redirects and search are public website features. Keep their web-side consumers resilient to empty CMS responses.

## Commands

| Command | What |
|---|---|
| `pnpm dev` | run cms + web in parallel |
| `pnpm dev:cms` / `pnpm dev:web` | run one app |
| `pnpm --filter cms seed` | seed Neon with starter content |
| `pnpm --filter cms migrate` | apply migrations |
| `pnpm --filter cms generate:types` | regenerate Payload types |
| `pnpm --filter cms generate:importmap` | regenerate Payload admin import map |
| `pnpm --filter web sync:types` | sync generated Payload types into web |
| `pnpm build` | build both apps |

## Deploy

Two Vercel projects (one per app). CMS on a subdomain, web on the public site domain. The web app is SSR, so published CMS edits do not require a deploy hook to appear. A Vercel Deploy Hook may still be configured as an optional side effect for rebuilds/caches/search refresh. See `DEPLOYMENT.md`.

## Verification checklist

- `pnpm --filter web check`
- `pnpm --filter cms build`
- Vercel production build for `web` because local Windows builds may fail on adapter symlinks.
- CMS `/api/health` returns healthy database/storage/email/preview checks.
- Web homepage, about, blog list/detail, contact, legal, search, sitemap, robots, llms, and RSS render.
- A published CMS edit appears on web after refresh without redeploying `web`.
