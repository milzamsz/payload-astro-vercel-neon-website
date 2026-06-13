import type { CollectionAfterChangeHook, GlobalAfterChangeHook } from 'payload'

/**
 * Pings the Vercel Deploy Hook for the Astro `web` project so the static site
 * rebuilds with fresh content. No-op when DEPLOY_HOOK_URL is unset (local dev).
 * Only fires for published documents to avoid rebuilding on every autosave draft.
 */
async function fire(payload: { logger: { info: Function; warn: Function } }) {
  const url = process.env.DEPLOY_HOOK_URL
  if (!url) return
  try {
    await fetch(url, { method: 'POST' })
    payload.logger.info('Triggered web deploy hook')
  } catch (err) {
    payload.logger.warn(`Deploy hook failed: ${String(err)}`)
  }
}

export const triggerDeployAfterChange: CollectionAfterChangeHook = async ({ doc, req }) => {
  if (doc?._status === 'published' || doc?._status === undefined) {
    await fire(req.payload)
  }
  return doc
}

export const triggerDeployGlobal: GlobalAfterChangeHook = async ({ doc, req }) => {
  await fire(req.payload)
  return doc
}
