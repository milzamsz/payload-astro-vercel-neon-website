/**
 * Low-level Payload REST client. Published content is publicly readable, so
 * build-time fetches need no auth. An API key (PAYLOAD_API_KEY) is only used
 * for draft/preview fetches.
 */
const CMS_URL = (import.meta.env.PUBLIC_CMS_URL || '').replace(/\/$/, '')
const API_KEY = import.meta.env.PAYLOAD_API_KEY || ''

export const cmsConfigured = Boolean(CMS_URL)

type FetchOpts = { draft?: boolean }

async function api<T>(path: string, opts: FetchOpts = {}): Promise<T | null> {
  if (!CMS_URL) return null
  const headers: Record<string, string> = {}
  if (opts.draft && API_KEY) headers['Authorization'] = `users API-Key ${API_KEY}`
  try {
    const res = await fetch(`${CMS_URL}${path}`, { headers })
    if (!res.ok) return null
    return (await res.json()) as T
  } catch {
    return null
  }
}

type ListResponse<T> = { docs: T[] }

export async function findGlobal<T>(slug: string): Promise<T | null> {
  return api<T>(`/api/globals/${slug}?depth=2`)
}

export async function findBySlug<T>(
  collection: string,
  slug: string,
  opts: FetchOpts = {},
): Promise<T | null> {
  const draftQ = opts.draft ? '&draft=true' : ''
  const res = await api<ListResponse<T>>(
    `/api/${collection}?where[slug][equals]=${encodeURIComponent(slug)}&depth=2&limit=1${draftQ}`,
    opts,
  )
  return res?.docs?.[0] ?? null
}

export async function findAll<T>(collection: string, query = ''): Promise<T[]> {
  const res = await api<ListResponse<T>>(`/api/${collection}?depth=2&limit=100${query ? `&${query}` : ''}`)
  return res?.docs ?? []
}
