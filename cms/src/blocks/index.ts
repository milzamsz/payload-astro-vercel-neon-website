import type { Block } from 'payload'

/**
 * Layout blocks. Slugs MUST match the `blockType` strings in
 * web/src/lib/types.ts and the Astro renderers in web/src/components/blocks/*.
 * Adding a block here means adding its Astro renderer too (see AGENTS.md).
 */

const ctaFields: Block['fields'] = [
  { name: 'label', type: 'text', required: true },
  { name: 'href', type: 'text', required: true },
  {
    name: 'variant',
    type: 'select',
    defaultValue: 'primary',
    options: ['primary', 'secondary', 'ghost'],
  },
]

export const HeroBlock: Block = {
  slug: 'hero',
  interfaceName: 'HeroBlock',
  labels: { singular: 'Hero', plural: 'Heroes' },
  fields: [
    { name: 'eyebrow', type: 'text' },
    { name: 'heading', type: 'text', required: true },
    { name: 'subheading', type: 'textarea' },
    { name: 'image', type: 'upload', relationTo: 'media' },
    { name: 'ctas', type: 'array', maxRows: 2, fields: ctaFields },
  ],
}

export const RichTextBlock: Block = {
  slug: 'richText',
  interfaceName: 'RichTextBlock',
  fields: [
    { name: 'content', type: 'richText', required: true },
    {
      name: 'width',
      type: 'select',
      defaultValue: 'narrow',
      options: ['narrow', 'full'],
    },
  ],
}

export const FeatureGridBlock: Block = {
  slug: 'featureGrid',
  interfaceName: 'FeatureGridBlock',
  fields: [
    { name: 'heading', type: 'text' },
    { name: 'intro', type: 'textarea' },
    {
      name: 'items',
      type: 'array',
      minRows: 1,
      fields: [
        { name: 'title', type: 'text', required: true },
        { name: 'body', type: 'textarea', required: true },
        { name: 'icon', type: 'text' },
      ],
    },
  ],
}

export const MediaBlockConfig: Block = {
  slug: 'mediaBlock',
  interfaceName: 'MediaBlockType',
  fields: [
    { name: 'image', type: 'upload', relationTo: 'media', required: true },
    { name: 'caption', type: 'text' },
  ],
}

export const CTABlock: Block = {
  slug: 'cta',
  interfaceName: 'CTABlock',
  fields: [
    { name: 'heading', type: 'text', required: true },
    { name: 'body', type: 'textarea' },
    { name: 'cta', type: 'group', fields: ctaFields },
  ],
}

export const StatsBlock: Block = {
  slug: 'stats',
  interfaceName: 'StatsBlock',
  fields: [
    { name: 'heading', type: 'text' },
    {
      name: 'items',
      type: 'array',
      minRows: 1,
      maxRows: 4,
      fields: [
        { name: 'value', type: 'text', required: true },
        { name: 'label', type: 'text', required: true },
      ],
    },
  ],
}

export const FAQBlock: Block = {
  slug: 'faq',
  interfaceName: 'FAQBlock',
  fields: [
    { name: 'heading', type: 'text' },
    {
      name: 'items',
      type: 'array',
      minRows: 1,
      fields: [
        { name: 'question', type: 'text', required: true },
        { name: 'answer', type: 'textarea', required: true },
      ],
    },
  ],
}

export const LogoCloudBlock: Block = {
  slug: 'logoCloud',
  interfaceName: 'LogoCloudBlock',
  fields: [
    { name: 'heading', type: 'text' },
    {
      name: 'logos',
      type: 'array',
      minRows: 1,
      fields: [
        { name: 'name', type: 'text', required: true },
        { name: 'src', type: 'text', required: true, admin: { description: 'Logo URL (e.g. https://cdn.simpleicons.org/vercel)' } },
      ],
    },
  ],
}

export const layoutBlocks: Block[] = [
  HeroBlock,
  RichTextBlock,
  FeatureGridBlock,
  MediaBlockConfig,
  CTABlock,
  StatsBlock,
  FAQBlock,
  LogoCloudBlock,
]
