import { defineMiddleware } from 'astro:middleware'
import { getRedirectTarget } from '@/lib/data'

const IGNORE_PREFIXES = ['/api/', '/_astro/', '/favicon', '/sitemap', '/robots.txt', '/rss.xml', '/llms.txt']

export const onRequest = defineMiddleware(async (context, next) => {
  const pathname = context.url.pathname

  if (
    pathname === '/' ||
    pathname === '/search' ||
    pathname === '/preview' ||
    IGNORE_PREFIXES.some((prefix) => pathname.startsWith(prefix)) ||
    /\.[a-z0-9]+$/i.test(pathname)
  ) {
    return next()
  }

  const target = await getRedirectTarget(pathname)
  if (!target || target === pathname) return next()

  return context.redirect(target, 301)
})
