import type { APIContext } from 'astro'
import { site } from '@/lib/content/site'

export function GET(context: APIContext) {
  const host = (context.site ?? new URL(site.url)).toString().replace(/\/$/, '')
  const body = [
    'User-agent: *',
    'Allow: /',
    '',
    `Sitemap: ${host}/sitemap-index.xml`,
    '',
    '# AI / LLM crawlers — see /llms.txt for a curated summary',
    'User-agent: GPTBot',
    'Allow: /',
    'User-agent: PerplexityBot',
    'Allow: /',
    'User-agent: ClaudeBot',
    'Allow: /',
    '',
  ].join('\n')
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
}
