/**
 * Data layer. Each function fetches from the CMS when PUBLIC_CMS_URL is set and
 * the request succeeds, otherwise falls back to local content. This is what lets
 * the site develop frontend-first and switch to CMS data without touching pages.
 */
import type { Block, FormDefinition, FormField, Media, Page, Post, SearchResult, SiteSettings } from '@/lib/types'
import { lexicalToHtml } from '@/lib/lexical'
import { cmsConfigured, fetchJSON, findAll, findBySlug, findGlobal, findOne } from '@/lib/payload'
import { site as localSite } from '@/lib/content/site'
import { home as localHome, about as localAbout, contact as localContact } from '@/lib/content/pages'
import { legalPages as localLegal } from '@/lib/content/legal'
import { posts as localPosts } from '@/lib/content/posts'
import { pageHrefFromSlug } from '@/lib/routes'

// ---- mappers ----

function mapMedia(m: unknown): Media | undefined {
  if (!m || typeof m !== 'object') return undefined
  const doc = m as { url?: string; alt?: string; width?: number; height?: number }
  if (!doc.url) return undefined
  return { url: doc.url, alt: doc.alt ?? '', width: doc.width, height: doc.height }
}

function mapBlocks(raw: unknown[]): Block[] {
  return (raw ?? []).map((b): Block | null => {
    const block = b as Record<string, unknown>
    switch (block.blockType) {
      case 'hero':
        return {
          blockType: 'hero',
          eyebrow: block.eyebrow as string,
          heading: block.heading as string,
          subheading: block.subheading as string,
          image: mapMedia(block.image),
          ctas: (block.ctas as any[]) ?? [],
        }
      case 'richText':
        return {
          blockType: 'richText',
          html: lexicalToHtml(block.content),
          width: (block.width as 'narrow' | 'full') ?? 'narrow',
        }
      case 'featureGrid':
        return block as unknown as Block
      case 'mediaBlock':
        return { blockType: 'mediaBlock', image: mapMedia(block.image)!, caption: block.caption as string }
      case 'cta':
      case 'stats':
      case 'faq':
      case 'logoCloud':
        return block as unknown as Block
      case 'formBlock': {
        const form = mapForm(block.form)
        if (!form) return null
        return {
          blockType: 'formBlock',
          heading: block.heading as string,
          intro: block.intro as string,
          form,
        }
      }
      default:
        return null
    }
  }).filter(Boolean) as Block[]
}

function mapFormField(raw: Record<string, unknown>): FormField | null {
  switch (raw.blockType) {
    case 'text':
    case 'email':
      return {
        blockType: raw.blockType,
        name: raw.name as string,
        label: raw.label as string,
        required: raw.required as boolean,
        width: raw.width as number,
        defaultValue: raw.defaultValue as string,
      }
    case 'textarea':
      return {
        blockType: 'textarea',
        name: raw.name as string,
        label: raw.label as string,
        required: raw.required as boolean,
        width: raw.width as number,
        defaultValue: raw.defaultValue as string,
      }
    case 'checkbox':
      return {
        blockType: 'checkbox',
        name: raw.name as string,
        label: raw.label as string,
        required: raw.required as boolean,
        width: raw.width as number,
        defaultValue: raw.defaultValue as boolean,
      }
    case 'select':
      return {
        blockType: 'select',
        name: raw.name as string,
        label: raw.label as string,
        required: raw.required as boolean,
        width: raw.width as number,
        defaultValue: raw.defaultValue as string,
        placeholder: raw.placeholder as string,
        options: Array.isArray(raw.options)
          ? raw.options.map((option) => ({
              label: (option as Record<string, string>).label,
              value: (option as Record<string, string>).value,
            }))
          : [],
      }
    case 'message':
      return {
        blockType: 'message',
        html: lexicalToHtml(raw.message),
      }
    default:
      return null
  }
}

function mapForm(raw: unknown): FormDefinition | null {
  if (!raw || typeof raw !== 'object') return null
  const form = raw as Record<string, unknown>
  const id = form.id
  const title = form.title
  if ((typeof id !== 'number' && typeof id !== 'string') || typeof title !== 'string') return null

  return {
    id: String(id),
    title,
    submitButtonLabel: (form.submitButtonLabel as string) || 'Submit',
    confirmationType: (form.confirmationType as 'message' | 'redirect') || 'message',
    confirmationMessageHtml: lexicalToHtml(form.confirmationMessage),
    redirectUrl: (form.redirect as { url?: string } | undefined)?.url,
    fields: Array.isArray(form.fields)
      ? form.fields
          .map((field) => mapFormField(field as Record<string, unknown>))
          .filter(Boolean) as FormField[]
      : [],
  }
}

function mapPage(doc: Record<string, unknown>): Page {
  const meta = (doc.meta as { title?: string; description?: string; image?: unknown }) ?? {}
  return {
    slug: doc.slug as string,
    title: doc.title as string,
    blocks: mapBlocks(doc.blocks as unknown[]),
    seo: { title: meta.title, description: meta.description, image: mapMedia(meta.image) },
  }
}

function mapPost(doc: Record<string, unknown>): Post {
  const author = (doc.author as { name?: string; role?: string; avatar?: unknown }) ?? {}
  const category = doc.category as { title?: string } | undefined
  return {
    slug: doc.slug as string,
    title: doc.title as string,
    excerpt: doc.excerpt as string,
    publishedAt: (doc.publishedAt as string) ?? (doc.createdAt as string),
    author: { name: author.name ?? 'Staff', role: author.role, avatar: mapMedia(author.avatar) },
    category: category?.title,
    coverImage: mapMedia(doc.coverImage),
    bodyHtml: lexicalToHtml(doc.body),
    seo: undefined,
  }
}

// ---- public API (CMS-or-local) ----

export async function getSite(): Promise<SiteSettings> {
  if (!cmsConfigured) return localSite
  const [settings, header, footer] = await Promise.all([
    findGlobal<any>('siteSettings'),
    findGlobal<any>('header'),
    findGlobal<any>('footer'),
  ])
  if (!settings && !header && !footer) return localSite
  return {
    ...localSite,
    siteName: settings?.siteName ?? localSite.siteName,
    description: settings?.description ?? localSite.description,
    contactEmail: settings?.contactEmail ?? localSite.contactEmail,
    logoText: header?.logoText ?? localSite.logoText,
    nav: header?.nav?.length ? header.nav.map((n: any) => ({ label: n.label, href: n.href })) : localSite.nav,
    footerNav: footer?.columns?.length
      ? footer.columns.map((c: any) => ({ title: c.title, links: (c.links ?? []).map((l: any) => ({ label: l.label, href: l.href })) }))
      : localSite.footerNav,
    social: footer?.social?.length ? footer.social.map((s: any) => ({ platform: s.platform, href: s.href })) : localSite.social,
    gtmId: settings?.analytics?.gtmId || localSite.gtmId,
    ga4Id: settings?.analytics?.ga4Id || localSite.ga4Id,
    umamiSrc: settings?.analytics?.umamiSrc || localSite.umamiSrc,
    umamiWebsiteId: settings?.analytics?.umamiWebsiteId || localSite.umamiWebsiteId,
    organization: {
      legalName: settings?.organization?.legalName ?? localSite.organization.legalName,
      logo: mapMedia(settings?.organization?.logo)?.url ?? localSite.organization.logo,
      sameAs: settings?.organization?.sameAs?.map((s: any) => s.url) ?? localSite.organization.sameAs,
    },
  }
}

const localPageBySlug: Record<string, Page> = {
  home: localHome,
  about: localAbout,
  contact: localContact,
  ...Object.fromEntries(localLegal.map((p) => [p.slug, p])),
}

export async function getPage(slug: string, opts: { draft?: boolean } = {}): Promise<Page | null> {
  if (cmsConfigured) {
    const doc = await findBySlug<Record<string, unknown>>('pages', slug, opts)
    if (doc) return mapPage(doc)
  }
  return localPageBySlug[slug] ?? null
}

export async function getAllPosts(): Promise<Post[]> {
  if (cmsConfigured) {
    const docs = await findAll<Record<string, unknown>>('posts', 'where[_status][equals]=published')
    if (docs.length) return docs.map(mapPost)
  }
  return localPosts
}

export async function getPost(slug: string, opts: { draft?: boolean } = {}): Promise<Post | null> {
  if (cmsConfigured) {
    const doc = await findBySlug<Record<string, unknown>>('posts', slug, opts)
    if (doc) return mapPost(doc)
  }
  return localPosts.find((p) => p.slug === slug) ?? null
}

type SearchDoc = {
  title?: string | null
  priority?: number | null
  doc?: {
    relationTo?: 'posts'
    value?: number | Record<string, unknown>
  }
}

export async function getSearchResults(query: string): Promise<SearchResult[]> {
  const normalized = query.trim().toLowerCase()
  if (!normalized) return []

  if (cmsConfigured) {
    const docs = await findAll<SearchDoc>('search', `where[title][like]=${encodeURIComponent(normalized)}`)
    if (docs.length) {
      const entries = await Promise.all(
        docs.map(async (entry) => {
          const value = entry.doc?.value
          if (!value || entry.doc?.relationTo !== 'posts') return null

          const post =
            typeof value === 'number'
              ? await fetchJSON<Record<string, unknown>>(`/api/posts/${value}?depth=2`)
              : value

          if (!post) return null

          return {
            title: entry.title || (post.title as string) || 'Untitled',
            href: `/blog/${post.slug as string}`,
            excerpt: post.excerpt as string,
            category: ((post.category as { title?: string } | undefined)?.title as string) || undefined,
            publishedAt: (post.publishedAt as string) || (post.createdAt as string),
            priority: entry.priority ?? undefined,
          }
        }),
      )

      return entries.filter(Boolean) as SearchResult[]
    }
  }

  return localPosts
    .filter((post) =>
      [post.title, post.excerpt, post.bodyHtml].some((value) => value.toLowerCase().includes(normalized)),
    )
    .map((post) => ({
      title: post.title,
      href: `/blog/${post.slug}`,
      excerpt: post.excerpt,
      category: post.category,
      publishedAt: post.publishedAt,
    }))
}

type RedirectDoc = {
  from: string
  to?: {
    type?: 'reference' | 'custom' | null
    reference?:
      | {
          relationTo: 'pages' | 'posts'
          value: Record<string, unknown>
        }
      | null
    url?: string | null
  }
}

export async function getRedirectTarget(pathname: string): Promise<string | null> {
  if (!cmsConfigured) return null

  const redirect = await findOne<RedirectDoc>(
    'redirects',
    `where[from][equals]=${encodeURIComponent(pathname)}`,
  )

  if (!redirect?.to) return null

  if (redirect.to.type === 'custom' && redirect.to.url) return redirect.to.url

  const reference = redirect.to.reference
  if (!reference || typeof reference.value !== 'object' || !reference.value) return null

  if (reference.relationTo === 'posts') {
    return `/blog/${reference.value.slug as string}`
  }

  return pageHrefFromSlug(reference.value.slug as string)
}

export async function getCmsHealth() {
  if (!cmsConfigured) {
    return { ok: false, configured: false }
  }

  const health = await fetchJSON<{ ok: boolean; checks?: Record<string, boolean> }>('/api/health')
  return {
    ok: Boolean(health?.ok),
    configured: true,
    checks: health?.checks ?? {},
  }
}
