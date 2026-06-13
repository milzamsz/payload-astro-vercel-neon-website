import type { SEO, Post, SiteSettings } from '@/lib/types'

export function resolveTitle(pageTitle: string | undefined, site: SiteSettings): string {
  if (!pageTitle || pageTitle === site.siteName) return site.siteName
  return `${pageTitle} | ${site.siteName}`
}

export function absoluteUrl(path: string, site: SiteSettings): string {
  return new URL(path, site.url).toString()
}

/** JSON-LD builders. Output objects; serialize with JSON.stringify in the layout. */

export function organizationSchema(site: SiteSettings) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: site.organization.legalName,
    url: site.url,
    logo: absoluteUrl(site.organization.logo, site),
    sameAs: site.organization.sameAs,
  }
}

export function websiteSchema(site: SiteSettings) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: site.siteName,
    url: site.url,
  }
}

export function articleSchema(post: Post, site: SiteSettings) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.excerpt,
    datePublished: post.publishedAt,
    image: post.coverImage ? post.coverImage.url : undefined,
    author: { '@type': 'Person', name: post.author.name },
    publisher: {
      '@type': 'Organization',
      name: site.organization.legalName,
      logo: { '@type': 'ImageObject', url: absoluteUrl(site.organization.logo, site) },
    },
    mainEntityOfPage: absoluteUrl(`/blog/${post.slug}`, site),
  }
}

export function breadcrumbSchema(trail: { name: string; path: string }[], site: SiteSettings) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: absoluteUrl(item.path, site),
    })),
  }
}

export type ResolvedSeo = SEO & { canonical: string }
