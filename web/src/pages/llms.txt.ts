import type { APIContext } from 'astro'
import { getAllPosts, getSite } from '@/lib/data'

/**
 * llms.txt — a curated, plain-text map of the site for LLMs / AI crawlers.
 * Spec: https://llmstxt.org. Improves how assistants summarize and cite the site.
 */
export async function GET(context: APIContext) {
  const [site, posts] = await Promise.all([getSite(), getAllPosts()])
  const host = (context.site ?? new URL(site.url)).toString().replace(/\/$/, '')
  const lines = [
    `# ${site.siteName}`,
    '',
    `> ${site.description}`,
    '',
    '## Pages',
    `- [Home](${host}/): overview and services`,
    `- [About](${host}/about): who we are and how we work`,
    `- [Writing](${host}/blog): articles on building software and design`,
    `- [Contact](${host}/contact): start a project`,
    '',
    '## Writing',
    ...posts.map((p) => `- [${p.title}](${host}/blog/${p.slug}): ${p.excerpt}`),
    '',
    '## Contact',
    `- Email: ${site.contactEmail}`,
    '',
  ].join('\n')
  return new Response(lines, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
}
