# .agents/rules.md

Operational rules (loaded by agent tooling). Mirror of the key constraints in `AGENTS.md`.

1. Vibecode-first: design `web/` against `web/src/lib/content/` local data before wiring CMS.
2. Block parity: every `cms/src/blocks/*` has a matching `web/src/components/blocks/*` renderer keyed by the same `blockType`.
3. After schema change in `cms/`: run `generate:types` + `generate:importmap`, commit `payload-types.ts` + `importMap.js` together, then sync types to `web/`.
4. Never change collection slugs / access / hooks without instruction.
5. Migrations are file-based (`push:false`). Use `migrate:create`.
6. No secrets in code. Env only.
7. Analytics + nav + footer + JSON-LD come from CMS globals, read at build time.
