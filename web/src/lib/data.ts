/**
 * Data layer. Each function fetches from the CMS when PUBLIC_CMS_URL is set and
 * the request succeeds, otherwise falls back to local content. This is what lets
 * the site develop frontend-first and switch to CMS data without touching pages.
 */
import type { Block, Media, Page, Post, SiteSettings } from '@/lib/types'
import { lexicalToHtml } from '@/lib/lexical'
import { cmsConfigured, findGlobal, findBySlug, findAll } from '@/lib/payload'
import { site as localSite } from '@/lib/content/site'
import { home as localHome, about as localAbout } from '@/lib/content/pages'
import { legalPages as localLegal } from '@/lib/content/legal'
import { posts as localPosts } from '@/lib/content/posts'

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
      default:
        return null
    }
  }).filter(Boolean) as Block[]
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
