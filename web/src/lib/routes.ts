export function pageHrefFromSlug(slug: string): string {
  if (!slug || slug === 'home') return '/'
  if (slug === 'privacy' || slug === 'terms') return `/legal/${slug}`
  return `/${slug}`
}
