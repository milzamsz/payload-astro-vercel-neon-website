import type { FormDefinition, Page } from '@/lib/types'

/** Local page content (vibecode phase). Mirrors the Payload `pages` collection. */

export const home: Page = {
  slug: 'home',
  title: 'Northvale Studio',
  seo: {
    description:
      'A product studio that designs, builds, and ships software for teams who care about the details.',
  },
  blocks: [
    {
      blockType: 'hero',
      eyebrow: 'Product studio',
      heading: 'Software that earns its place on the screen.',
      subheading:
        'We design and build digital products end to end, from the first sketch to the production deploy.',
      image: {
        url: 'https://picsum.photos/seed/northvale-hero-studio/1280/960',
        alt: 'The studio workspace',
        width: 1280,
        height: 960,
      },
      ctas: [
        { label: 'Start a project', href: '/contact', variant: 'primary' },
        { label: 'Read our writing', href: '/blog', variant: 'ghost' },
      ],
    },
    {
      blockType: 'logoCloud',
      heading: 'Teams we have shipped with',
      logos: [
        { name: 'Vercel', src: 'https://cdn.simpleicons.org/vercel' },
        { name: 'Linear', src: 'https://cdn.simpleicons.org/linear' },
        { name: 'Supabase', src: 'https://cdn.simpleicons.org/supabase' },
        { name: 'Stripe', src: 'https://cdn.simpleicons.org/stripe' },
        { name: 'Notion', src: 'https://cdn.simpleicons.org/notion' },
      ],
    },
    {
      blockType: 'featureGrid',
      heading: 'How we work',
      intro: 'Three practices that keep the work honest from kickoff to launch.',
      items: [
        {
          title: 'Design in the open',
          body: 'Weekly working sessions, real prototypes, no waterfall decks. You see the product take shape.',
        },
        {
          title: 'Build on solid ground',
          body: 'Typed end to end, tested where it counts, deployed continuously. The boring parts done right.',
        },
        {
          title: 'Ship, then sharpen',
          body: 'We launch early and iterate against real usage instead of guessing in a vacuum.',
        },
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
      blockType: 'faq',
      heading: 'Common questions',
      items: [
        {
          question: 'How do engagements usually start?',
          answer:
            'With a paid discovery sprint. Two weeks to map the problem, prototype the risky parts, and agree on scope before a longer build.',
        },
        {
          question: 'Do you work with existing teams?',
          answer:
            'Often. We embed alongside in-house engineers and designers as much as we run projects solo.',
        },
        {
          question: 'What stacks do you build on?',
          answer:
            'TypeScript across the board. Astro, Next, and React on the front; Postgres and edge functions behind them.',
        },
      ],
    },
    {
      blockType: 'cta',
      heading: 'Have something worth building?',
      body: 'Tell us about it. We reply to every serious enquiry within two business days.',
      cta: { label: 'Start a project', href: '/contact', variant: 'primary' },
    },
  ],
}

export const about: Page = {
  slug: 'about',
  title: 'About',
  seo: { description: 'Who we are and how the studio operates.' },
  blocks: [
    {
      blockType: 'hero',
      eyebrow: 'About',
      heading: 'A small team that takes the whole thing seriously.',
      subheading:
        'Eight people who would rather ship one thing well than five things halfway.',
      image: {
        url: 'https://picsum.photos/seed/northvale-team-portrait/1280/960',
        alt: 'The team at work',
        width: 1280,
        height: 960,
      },
    },
    {
      blockType: 'richText',
      width: 'narrow',
      html: `<p>Northvale started in 2014 as two people freelancing out of a shared flat. We grew on referrals, not pitches, because we cared more about the next release than the next logo on the wall.</p><h2>What we believe</h2><p>Good software is mostly good decisions made early and held consistently. We protect that by keeping teams small, scope honest, and feedback loops short.</p><h2>How we run</h2><p>Flat structure, async by default, in person when it matters. Everyone who builds the work talks to the people who use it.</p>`,
    },
    {
      blockType: 'stats',
      items: [
        { value: '2014', label: 'founded' },
        { value: '8', label: 'people' },
        { value: 'Remote', label: 'first, by design' },
      ],
    },
    {
      blockType: 'cta',
      heading: 'Want to work together?',
      cta: { label: 'Start a project', href: '/contact', variant: 'primary' },
    },
  ],
}

const contactForm: FormDefinition = {
  id: 'local-contact-form',
  title: 'Contact',
  submitButtonLabel: 'Send message',
  confirmationType: 'message',
  confirmationMessageHtml: '<p>Thanks. We will be in touch within two business days.</p>',
  fields: [
    { blockType: 'text', name: 'name', label: 'Name', required: true, width: 50 },
    { blockType: 'email', name: 'email', label: 'Email', required: true, width: 50 },
    { blockType: 'textarea', name: 'message', label: 'What are you building?', required: true, width: 100 },
  ],
}

export const contact: Page = {
  slug: 'contact',
  title: 'Contact',
  seo: { description: 'Tell us about your project. We reply to every serious enquiry within two business days.' },
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
      html: '<p>Prefer email? Reach us directly at <a href="mailto:hello@northvale.studio">hello@northvale.studio</a>.</p>',
    },
    {
      blockType: 'formBlock',
      heading: 'Project details',
      intro: 'A short brief is enough. We can figure out the rest together.',
      form: contactForm,
    },
  ],
}

export const localPages: Page[] = [home, about, contact]
