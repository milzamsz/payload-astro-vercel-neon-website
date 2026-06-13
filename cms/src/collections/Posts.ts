import type { CollectionConfig } from 'payload'
import { anyone } from '../access/anyone'
import { authenticated } from '../access/authenticated'
import { authenticatedOrPublished } from '../access/authenticatedOrPublished'
import { slugField } from '../fields/slug'
import { triggerDeployAfterChange } from '../hooks/triggerDeploy'
import { populatePublishedAt } from '../hooks/populatePublishedAt'
import { getServerURL } from '../utilities/getURL'

export const Posts: CollectionConfig = {
  slug: 'posts',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'category', 'publishedAt', '_status'],
    livePreview: {
      url: ({ data }) => `${process.env.PUBLIC_WEB_URL || getServerURL()}/blog/${data?.slug ?? ''}`,
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
    beforeChange: [populatePublishedAt],
    afterChange: [triggerDeployAfterChange],
  },
  fields: [
    { name: 'title', type: 'text', required: true },
    slugField(),
    {
      type: 'row',
      fields: [
        {
          name: 'publishedAt',
          type: 'date',
          admin: { position: 'sidebar', date: { pickerAppearance: 'dayAndTime' } },
        },
        {
          name: 'category',
          type: 'relationship',
          relationTo: 'categories',
          admin: { position: 'sidebar' },
        },
      ],
    },
    { name: 'excerpt', type: 'textarea', required: true },
    { name: 'coverImage', type: 'upload', relationTo: 'media' },
    {
      name: 'author',
      type: 'group',
      fields: [
        { name: 'name', type: 'text', required: true },
        { name: 'role', type: 'text' },
        { name: 'avatar', type: 'upload', relationTo: 'media' },
      ],
    },
    { name: 'body', type: 'richText', required: true },
  ],
}
