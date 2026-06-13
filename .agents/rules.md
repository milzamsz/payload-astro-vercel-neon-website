# .agents/rules.md

Operational rules (loaded by agent tooling). Mirror of the key constraints in `AGENTS.md`.

1. Vibecode-first: design `web/` against `web/src/lib/content/` local data before wiring CMS.
2. Block parity: every `cms/src/blocks/*` has a matching `web/src/components/blocks/*` renderer keyed by the same `blockType`.
3. After schema change in `cms/`: run `generate:types` + `generate:importmap`, commit `payload-types.ts` + `importMap.js` together, then sync types to `web/`.
4. Never change collection slugs / access / hooks without instruction.
5. Migrations are file-based (`push:false`). Use `migrate:create`; if the local Payload generator is blocked, hand-write only with matching Payload table conventions and verify with `migrate`.
6. No secrets in code. Env only. Includes Neon, R2/S3, Resend, Payload, preview, and Vercel tokens.
7. `web/` is SSR for CMS-backed public routes. Published content is read at request time; do not add static prerendering to those routes by accident.
8. Draft content is preview-only. Keep `draft:true` behind `/preview`, `PAYLOAD_API_KEY`, and `PREVIEW_SECRET`.
9. Analytics + nav + footer + JSON-LD come from CMS globals through the shared data layer.
10. Payload media is the source of truth for images. Seed can backfill missing starter media without overwriting user content.
11. Forms should use Payload form-builder + `formBlock`; avoid page-specific hardcoded form integrations.
12. Deploy hook is optional for rebuild side effects. Website freshness must not depend on it.
