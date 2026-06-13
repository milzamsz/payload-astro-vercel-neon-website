# AGENTS.md

Guidance for AI agents (and humans) working in this template.

## What this is

Monorepo, 2 apps:
- `cms/` — Payload CMS on Next.js (admin + API), Neon Postgres.
- `web/` — Astro static site that consumes the CMS via REST + API key.

## Core workflow: vibecode-first

**Build the Astro frontend FIRST against local content, then sync to CMS.**

1. Design and iterate pages in `web/` using typed local content in `web/src/lib/content/`. No CMS dependency required to develop the look.
2. Block renderer components in `web/src/components/blocks/` map 1:1 to Payload blocks in `cms/src/blocks/`. Keep them in sync — same block `type` strings, same field shapes.
3. Once the design is final, wire pages to the CMS (`web/src/lib/payload.ts`). Local content stays as typed fallback for dev / build resilience.

Do NOT force CMS content into a page before its design is settled. Local-content-first is intentional.

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
- Analytics IDs, JSON-LD org, nav, and footer live in CMS globals (`SiteSettings`, `Header`, `Footer`) — not hardcoded. Read them at build time.
- Secrets (`PAYLOAD_SECRET`, `DATABASE_URL`, `RESEND_API_KEY`, S3 keys, `PAYLOAD_API_KEY`) only in env. Never commit `.env`.

## Commands

| Command | What |
|---|---|
| `pnpm dev` | run cms + web in parallel |
| `pnpm dev:cms` / `pnpm dev:web` | run one app |
| `pnpm --filter cms seed` | seed Neon with starter content |
| `pnpm --filter cms migrate` | apply migrations |
| `pnpm build` | build both apps |

## Deploy

Two Vercel projects (one per app). CMS on a subdomain. On publish, CMS fires a Vercel Deploy Hook that rebuilds `web`. See `DEPLOYMENT.md`.
