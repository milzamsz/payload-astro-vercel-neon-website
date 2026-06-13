import type { Post } from '@/lib/types'

/** Local blog content (vibecode phase). Mirrors the Payload `posts` collection. */
export const posts: Post[] = [
  {
    slug: 'shipping-is-a-feature',
    title: 'Shipping is a feature',
    excerpt:
      'The longer a change sits unmerged, the more it costs. A case for shrinking the gap between done and deployed.',
    publishedAt: '2026-05-18T09:00:00.000Z',
    author: { name: 'Mara Okonkwo', role: 'Principal engineer' },
    category: 'Engineering',
    coverImage: {
      url: 'https://picsum.photos/seed/northvale-shipping-deploy/1600/900',
      alt: 'A deploy pipeline on a monitor',
      width: 1600,
      height: 900,
    },
    bodyHtml: `<p>Every unshipped change is inventory. It depreciates. It collects merge conflicts, drifts from the spec, and quietly raises the cost of the next change stacked on top of it.</p><h2>Small batches win</h2><p>The teams that move fastest are not the ones that type fastest. They are the ones that keep the distance between "done" and "in production" as short as their tooling allows.</p><blockquote>If a change is too big to ship this week, it is usually too big to reason about at all.</blockquote><h2>Where to start</h2><p>Cut the release to its smallest honest unit. Automate the boring gate checks. Then make shipping the default, not the event.</p>`,
  },
  {
    slug: 'design-reviews-without-the-theatre',
    title: 'Design reviews without the theatre',
    excerpt:
      'How to run a critique that improves the work instead of protecting feelings or scoring points.',
    publishedAt: '2026-04-02T09:00:00.000Z',
    author: { name: 'Elias Thorne', role: 'Design lead' },
    category: 'Design',
    coverImage: {
      url: 'https://picsum.photos/seed/northvale-design-critique/1600/900',
      alt: 'Sticky notes on a wall during a critique',
      width: 1600,
      height: 900,
    },
    bodyHtml: `<p>A good design review is uncomfortable in the right way. It pressures the work, not the person who made it.</p><h2>State the goal first</h2><p>Before anyone reacts, the maker names what the piece is trying to do and what they are unsure about. Feedback aimed at the wrong target wastes everyone.</p><h2>Critique against the goal</h2><p>"I do not like the blue" is noise. "The blue competes with the primary action" is signal. Tie every note to the stated intent.</p>`,
  },
  {
    slug: 'the-cost-of-a-cms',
    title: 'The real cost of a CMS',
    excerpt:
      'Content systems are cheap to install and expensive to live with. What to weigh before you commit.',
    publishedAt: '2026-02-20T09:00:00.000Z',
    author: { name: 'Mara Okonkwo', role: 'Principal engineer' },
    category: 'Engineering',
    coverImage: {
      url: 'https://picsum.photos/seed/northvale-cms-architecture/1600/900',
      alt: 'An architecture diagram sketch',
      width: 1600,
      height: 900,
    },
    bodyHtml: `<p>Choosing a CMS feels like a setup task. It is actually a multi-year commitment to a content model, an editing experience, and a migration path you cannot yet see.</p><h2>Model first, tool second</h2><p>Sketch the content before the stack. If your pages are blocks, pick a tool that treats blocks as first-class. If they are long-form, optimise the writing surface instead.</p><h2>Own the exit</h2><p>The best CMS is one you can leave. Structured data, an export path, and a frontend that does not depend on proprietary rendering buy you that freedom.</p>`,
  },
]

export const categories = Array.from(new Set(posts.map((p) => p.category).filter(Boolean))) as string[]
