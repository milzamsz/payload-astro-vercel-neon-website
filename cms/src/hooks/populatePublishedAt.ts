import type { CollectionBeforeChangeHook } from 'payload'

/** Sets publishedAt to now the first time a doc is published without one set. */
export const populatePublishedAt: CollectionBeforeChangeHook = ({ data }) => {
  if (data && data._status === 'published' && !data.publishedAt) {
    return { ...data, publishedAt: new Date().toISOString() }
  }
  return data
}
