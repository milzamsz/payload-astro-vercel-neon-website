import type { CollectionConfig } from 'payload'
import { anyone } from '../access/anyone'
import { authenticated } from '../access/authenticated'
import { authenticatedOrPublished } from '../access/authenticatedOrPublished'
import { slugField } from '../fields/slug'
import { layoutBlocks } from '../blocks'
import { triggerDeployAfterChange } from '../hooks/triggerDeploy'
import { getServerURL } from '../utilities/getURL'

const previewBase = (process.env.PUBLIC_WEB_URL || getServerURL()).replace(/\/$/, '')
const previewSecret = process.env.PREVIEW_SECRET

export const Pages: CollectionConfig = {
  slug: 'pages',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', '_status', 'updatedAt'],
    livePreview: {
      url: ({ data }) => {
        const params = new URLSearchParams({
          type: 'page',
          slug: data?.slug === 'home' ? 'home' : (data?.slug ?? ''),
        })
        if (previewSecret) params.set('secret', previewSecret)
        return `${previewBase}/preview?${params.toString()}`
      },
    },
  },
  access: {
    read: authenticatedOrPublished,
    create: authenticated,
    update: authenticated,
    delete: authenticated,
  },
  versions: {
    drafts: { autosave: { interval: 375 } },
    maxPerDoc: 25,
  },
  hooks: {
    afterChange: [triggerDeployAfterChange],
  },
  fields: [
    { name: 'title', type: 'text', required: true },
    slugField(),
    {
      name: 'blocks',
      type: 'blocks',
      blocks: layoutBlocks,
      admin: { initCollapsed: true },
    },
    // SEO fields are injected by the seo plugin into a `meta` group.
  ],
}
