// Copies the generated Payload types from cms into web for reference / typing
// of CMS responses. Run after a CMS schema change: pnpm --filter web sync:types
import { copyFileSync, existsSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const src = resolve(here, '../../cms/src/payload-types.ts')
const dest = resolve(here, '../src/lib/payload-types.ts')

if (!existsSync(src)) {
  console.error(`Source types not found at ${src}. Run \`pnpm --filter cms generate:types\` first.`)
  process.exit(1)
}
mkdirSync(dirname(dest), { recursive: true })
copyFileSync(src, dest)
console.log(`Synced Payload types → ${dest}`)
