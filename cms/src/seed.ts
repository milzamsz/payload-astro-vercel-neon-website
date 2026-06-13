/**
 * Seed script. Populates Neon with starter content matching the Astro design.
 * Run: pnpm --filter cms seed  (requires a reachable DATABASE_URL).
 *
 * Idempotent-ish: skips creation when a doc with the same slug already exists.
 */
import 'dotenv/config'
import os from 'os'
import path from 'path'
import { promises as fs } from 'fs'
import { getPayload } from 'payload'
import config from './payload.config'

type LexNode = Record<string, unknown>

/** Minimal Lexical root from an array of {type:'p'|'h2'|'h3', text} blocks. */
function lexical(blocks: { type: 'p' | 'h2' | 'h3'; text: string }[]) {
  const children: LexNode[] = blocks.map((b) => {
    const tag = b.type === 'p' ? undefined : b.type
    return {
      type: b.type === 'p' ? 'paragraph' : 'heading',
      ...(tag ? { tag } : {}),
      version: 1,
      direction: 'ltr',
      format: '',
      indent: 0,
      children: [
        { type: 'text', text: b.text, version: 1, detail: 0, format: 0, mode: 'normal', style: '' },
      ],
    }
  })
  return {
    root: { type: 'root', version: 1, direction: 'ltr', format: '', indent: 0, children },
  }
}

const starterMedia = {
  homeHero: {
    alt: 'The studio workspace',
    url: 'https://picsum.photos/seed/northvale-hero-studio/1280/960',
    filename: 'northvale-home-hero.jpg',
  },
  aboutHero: {
    alt: 'The team at work',
    url: 'https://picsum.photos/seed/northvale-team-portrait/1280/960',
    filename: 'northvale-about-hero.jpg',
  },
  shippingCover: {
    alt: 'A deploy pipeline on a monitor',
    url: 'https://picsum.photos/seed/northvale-shipping-deploy/1600/900',
    filename: 'northvale-shipping-feature.jpg',
  },
  designCover: {
    alt: 'Sticky notes on a wall during a critique',
    url: 'https://picsum.photos/seed/northvale-design-critique/1600/900',
    filename: 'northvale-design-review.jpg',
  },
  cmsCover: {
    alt: 'An architecture diagram sketch',
    url: 'https://picsum.photos/seed/northvale-cms-architecture/1600/900',
    filename: 'northvale-cms-cost.jpg',
  },
} as const

async function downloadToTemp(url: string, filename: string) {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Failed to download starter media from ${url}`)

  const tempPath = path.join(os.tmpdir(), filename)
  const buffer = Buffer.from(await response.arrayBuffer())
  await fs.writeFile(tempPath, buffer)
  return tempPath
}

async function run() {
  const payload = await getPayload({ config })

  // --- Admin user ---
  const email = process.env.SEED_ADMIN_EMAIL || 'admin@example.com'
  const existingUsers = await payload.find({ collection: 'users', where: { email: { equals: email } }, limit: 1 })
  if (existingUsers.totalDocs === 0) {
    await payload.create({
      collection: 'users',
      data: {
        email,
        password: process.env.SEED_ADMIN_PASSWORD || 'ChangeMe123!',
        fullName: 'Studio Admin',
        role: 'admin',
      },
    })
    payload.logger.info(`Created admin user ${email}`)
  }

  // --- Globals ---
  await payload.updateGlobal({
    slug: 'siteSettings',
    data: {
      siteName: 'Northvale Studio',
      description:
        'A product studio that designs, builds, and ships software for teams who care about the details.',
      contactEmail: 'hello@northvale.studio',
      organization: { legalName: 'Northvale Studio Ltd.' },
    },
  })
  await payload.updateGlobal({
    slug: 'header',
    data: {
      logoText: 'Northvale',
      nav: [
        { label: 'Work', href: '/#work' },
        { label: 'About', href: '/about' },
        { label: 'Writing', href: '/blog' },
        { label: 'Contact', href: '/contact' },
      ],
    },
  })
  await payload.updateGlobal({
    slug: 'footer',
    data: {
      columns: [
        { title: 'Studio', links: [
          { label: 'About', href: '/about' },
          { label: 'Writing', href: '/blog' },
          { label: 'Contact', href: '/contact' },
        ] },
        { title: 'Legal', links: [
          { label: 'Privacy', href: '/legal/privacy' },
          { label: 'Terms', href: '/legal/terms' },
        ] },
      ],
      social: [
        { platform: 'GitHub', href: 'https://github.com' },
        { platform: 'LinkedIn', href: 'https://linkedin.com' },
      ],
    },
  })

  // --- Category ---
  async function ensureCategory(title: string) {
    const slug = title.toLowerCase()
    const found = await payload.find({ collection: 'categories', where: { slug: { equals: slug } }, limit: 1 })
    if (found.totalDocs > 0) return found.docs[0].id
    const created = await payload.create({ collection: 'categories', data: { title, slug } })
    return created.id
  }
  const engineeringId = await ensureCategory('Engineering')
  const designId = await ensureCategory('Design')

  async function ensureMedia(key: keyof typeof starterMedia) {
    const seed = starterMedia[key]
    const found = await payload.find({
      collection: 'media',
      where: { alt: { equals: seed.alt } },
      limit: 1,
      depth: 0,
    })
    if (found.totalDocs > 0) return found.docs[0].id

    const filePath = await downloadToTemp(seed.url, seed.filename)
    try {
      const created = await payload.create({
        collection: 'media',
        data: { alt: seed.alt },
        filePath,
      })
      payload.logger.info(`Uploaded starter media ${seed.filename}`)
      return created.id
    } finally {
      await fs.rm(filePath, { force: true })
    }
  }

  const media = {
    homeHero: await ensureMedia('homeHero'),
    aboutHero: await ensureMedia('aboutHero'),
    shippingCover: await ensureMedia('shippingCover'),
    designCover: await ensureMedia('designCover'),
    cmsCover: await ensureMedia('cmsCover'),
  }

  // --- Pages ---
  async function ensurePage(slug: string, data: Record<string, unknown>) {
    const found = await payload.find({ collection: 'pages', where: { slug: { equals: slug } }, limit: 1 })
    if (found.totalDocs > 0) return found.docs[0]
    const created = await payload.create({ collection: 'pages', data: { slug, _status: 'published', ...data } as never })
    payload.logger.info(`Created page /${slug}`)
    return created
  }

  async function patchPageHeroImage(slug: string, mediaId: number) {
    const found = await payload.find({ collection: 'pages', where: { slug: { equals: slug } }, limit: 1 })
    const doc = found.docs[0]
    if (!doc || !Array.isArray(doc.blocks)) return

    const blocks = [...doc.blocks]
    const heroIndex = blocks.findIndex((block) => block.blockType === 'hero')
    if (heroIndex === -1) return

    const hero = blocks[heroIndex] as unknown as Record<string, unknown>
    if (hero.image) return

    blocks[heroIndex] = { ...hero, image: mediaId } as never

    await payload.update({
      collection: 'pages',
      id: doc.id,
      data: { blocks } as never,
    })
    payload.logger.info(`Backfilled hero image for /${slug}`)
  }

  await ensurePage('home', {
    title: 'Home',
    blocks: [
      {
        blockType: 'hero',
        eyebrow: 'Product studio',
        heading: 'Software that earns its place on the screen.',
        subheading:
          'We design and build digital products end to end, from the first sketch to the production deploy.',
        image: media.homeHero,
        ctas: [
          { label: 'Start a project', href: '/contact', variant: 'primary' },
          { label: 'Read our writing', href: '/blog', variant: 'ghost' },
        ],
      },
      {
        blockType: 'featureGrid',
        heading: 'How we work',
        intro: 'Three practices that keep the work honest from kickoff to launch.',
        items: [
          { title: 'Design in the open', body: 'Weekly working sessions, real prototypes, no waterfall decks.' },
          { title: 'Build on solid ground', body: 'Typed end to end, tested where it counts, deployed continuously.' },
          { title: 'Ship, then sharpen', body: 'We launch early and iterate against real usage.' },
        ],
      },
      {
        blockType: 'stats',
        heading: 'A decade of shipping',
        items: [
          { value: '40+', label: 'products launched' },
          { value: '11 yrs', label: 'in practice' },
          { value: '94%', label: 'clients who return' },
        ],
      },
      {
        blockType: 'cta',
        heading: 'Have something worth building?',
        body: 'Tell us about it. We reply to every serious enquiry within two business days.',
        cta: { label: 'Start a project', href: '/contact', variant: 'primary' },
      },
    ],
  })

  await ensurePage('about', {
    title: 'About',
    blocks: [
      {
        blockType: 'hero',
        eyebrow: 'About',
        heading: 'A small team that takes the whole thing seriously.',
        subheading: 'Eight people who would rather ship one thing well than five things halfway.',
        image: media.aboutHero,
      },
      {
        blockType: 'richText',
        width: 'narrow',
        content: lexical([
          { type: 'p', text: 'Northvale started in 2014 as two people freelancing out of a shared flat.' },
          { type: 'h2', text: 'What we believe' },
          { type: 'p', text: 'Good software is mostly good decisions made early and held consistently.' },
        ]),
      },
    ],
  })

  for (const [slug, title, intro] of [
    ['privacy', 'Privacy Policy', 'How we handle your data.'],
    ['terms', 'Terms of Service', 'The terms that govern use of this site.'],
  ] as const) {
    await ensurePage(slug, {
      title,
      blocks: [
        {
          blockType: 'richText',
          width: 'narrow',
          content: lexical([
            { type: 'p', text: 'Placeholder copy. Replace with reviewed text before launch.' },
            { type: 'h2', text: title },
            { type: 'p', text: intro },
          ]),
        },
      ],
    })
  }

  await patchPageHeroImage('home', media.homeHero)
  await patchPageHeroImage('about', media.aboutHero)

  // --- Posts ---
  async function ensurePost(slug: string, data: Record<string, unknown>) {
    const found = await payload.find({ collection: 'posts', where: { slug: { equals: slug } }, limit: 1 })
    if (found.totalDocs > 0) return found.docs[0]
    const created = await payload.create({ collection: 'posts', data: { slug, _status: 'published', ...data } as never })
    payload.logger.info(`Created post /blog/${slug}`)
    return created
  }

  async function patchPostCoverImage(slug: string, mediaId: number) {
    const found = await payload.find({ collection: 'posts', where: { slug: { equals: slug } }, limit: 1 })
    const doc = found.docs[0]
    if (!doc || doc.coverImage) return

    await payload.update({
      collection: 'posts',
      id: doc.id,
      data: { coverImage: mediaId } as never,
    })
    payload.logger.info(`Backfilled cover image for /blog/${slug}`)
  }

  await ensurePost('shipping-is-a-feature', {
    title: 'Shipping is a feature',
    excerpt:
      'The longer a change sits unmerged, the more it costs. A case for shrinking the gap between done and deployed.',
    publishedAt: '2026-05-18T09:00:00.000Z',
    category: engineeringId,
    coverImage: media.shippingCover,
    author: { name: 'Mara Okonkwo', role: 'Principal engineer' },
    body: lexical([
      { type: 'p', text: 'Every unshipped change is inventory. It depreciates.' },
      { type: 'h2', text: 'Small batches win' },
      { type: 'p', text: 'Keep the distance between done and in production as short as your tooling allows.' },
    ]),
  })

  await ensurePost('design-reviews-without-the-theatre', {
    title: 'Design reviews without the theatre',
    excerpt: 'How to run a critique that improves the work instead of protecting feelings.',
    publishedAt: '2026-04-02T09:00:00.000Z',
    category: designId,
    coverImage: media.designCover,
    author: { name: 'Elias Thorne', role: 'Design lead' },
    body: lexical([
      { type: 'p', text: 'A good design review pressures the work, not the person who made it.' },
      { type: 'h2', text: 'State the goal first' },
      { type: 'p', text: 'Feedback aimed at the wrong target wastes everyone.' },
    ]),
  })

  await ensurePost('the-cost-of-a-cms', {
    title: 'The real cost of a CMS',
    excerpt: 'Content systems are cheap to install and expensive to live with. What to weigh before you commit.',
    publishedAt: '2026-02-20T09:00:00.000Z',
    category: engineeringId,
    coverImage: media.cmsCover,
    author: { name: 'Mara Okonkwo', role: 'Principal engineer' },
    body: lexical([
      { type: 'p', text: 'Choosing a CMS feels like a setup task. It is actually a multi-year commitment.' },
      { type: 'h2', text: 'Model first, tool second' },
      { type: 'p', text: 'Sketch the content before the stack. Fit the editor to the shape of the work.' },
    ]),
  })

  await patchPostCoverImage('shipping-is-a-feature', media.shippingCover)
  await patchPostCoverImage('design-reviews-without-the-theatre', media.designCover)
  await patchPostCoverImage('the-cost-of-a-cms', media.cmsCover)

  // --- Contact form (form-builder) ---
  const forms = await payload.find({ collection: 'forms', where: { title: { equals: 'Contact' } }, limit: 1 })
  let contactFormId: number
  if (forms.totalDocs === 0) {
    const form = await payload.create({
      collection: 'forms',
      data: {
        title: 'Contact',
        fields: [
          { blockType: 'text', name: 'name', label: 'Name', required: true },
          { blockType: 'email', name: 'email', label: 'Email', required: true },
          { blockType: 'textarea', name: 'message', label: 'What are you building?', required: true },
        ],
        confirmationType: 'message',
        submitButtonLabel: 'Send message',
        confirmationMessage: lexical([{ type: 'p', text: 'Thanks. We will be in touch within two business days.' }]),
      } as never,
    })
    contactFormId = form.id
    payload.logger.info(`Created contact form (id ${form.id}).`)
  } else {
    contactFormId = forms.docs[0].id
    if (!forms.docs[0].submitButtonLabel) {
      await payload.update({
        collection: 'forms',
        id: contactFormId,
        data: {
          submitButtonLabel: 'Send message',
        } as never,
      })
      payload.logger.info('Backfilled contact form submit label')
    }
  }

  await ensurePage('contact', {
    title: 'Contact',
    blocks: [
      {
        blockType: 'hero',
        eyebrow: 'Start a project',
        heading: 'Tell us what you are building.',
        subheading:
          'Share the product, the constraint, and where things feel stuck. We reply to every serious enquiry within two business days.',
      },
      {
        blockType: 'richText',
        width: 'narrow',
        content: lexical([
          { type: 'p', text: 'Prefer email? Reach us directly at hello@northvale.studio.' },
        ]),
      },
      {
        blockType: 'formBlock',
        heading: 'Project details',
        intro: 'A short brief is enough. We can figure out the rest together.',
        form: contactFormId,
      },
    ],
  })

  payload.logger.info('Seed complete.')
  process.exit(0)
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
