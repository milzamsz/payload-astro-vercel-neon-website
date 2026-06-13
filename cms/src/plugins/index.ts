import { seoPlugin } from '@payloadcms/plugin-seo'
import { nestedDocsPlugin } from '@payloadcms/plugin-nested-docs'
import { searchPlugin } from '@payloadcms/plugin-search'
import { redirectsPlugin } from '@payloadcms/plugin-redirects'
import { formBuilderPlugin } from '@payloadcms/plugin-form-builder'
import type { Plugin } from 'payload'
import { branding } from '../lib/site'
import { getServerURL } from '../utilities/getURL'

export const plugins: Plugin[] = [
  seoPlugin({
    collections: ['pages', 'posts'],
    uploadsCollection: 'media',
    generateTitle: ({ doc }: { doc: { title?: string } }) =>
      doc?.title ? `${doc.title} | ${branding.siteName}` : branding.siteName,
    generateURL: ({ doc, collectionConfig }: { doc: { slug?: string }; collectionConfig?: { slug?: string } }) =>
      `${process.env.PUBLIC_WEB_URL || getServerURL()}/${collectionConfig?.slug}/${doc?.slug}`,
  }),
  nestedDocsPlugin({ collections: ['categories'] }),
  searchPlugin({
    collections: ['posts'],
    defaultPriorities: { posts: 10 },
  }),
  redirectsPlugin({ collections: ['pages', 'posts'] }),
  formBuilderPlugin({
    // Email notifications use the configured Resend adapter automatically.
    fields: {
      text: true,
      textarea: true,
      email: true,
      select: true,
      checkbox: true,
      message: true,
    },
    formOverrides: {
      admin: { group: 'Forms' },
    },
    formSubmissionOverrides: {
      admin: { group: 'Forms' },
    },
  }),
]
