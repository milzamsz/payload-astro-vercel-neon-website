import rss from '@astrojs/rss'
import type { APIContext } from 'astro'
import { getAllPosts, getSite } from '@/lib/data'

export async function GET(context: APIContext) {
  const [posts, site] = await Promise.all([getAllPosts(), getSite()])
  return rss({
    title: `${site.siteName} — Writing`,
    description: site.description,
    site: context.site ?? site.url,
    items: posts
      .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
      .map((post) => ({
        title: post.title,
        description: post.excerpt,
        pubDate: new Date(post.publishedAt),
        link: `/blog/${post.slug}`,
        categories: post.category ? [post.category] : [],
      })),
  })
}
