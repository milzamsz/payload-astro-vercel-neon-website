import type { GlobalConfig } from 'payload'
import { anyone } from '../access/anyone'
import { authenticated } from '../access/authenticated'
import { triggerDeployGlobal } from '../hooks/triggerDeploy'

export const SiteSettings: GlobalConfig = {
  slug: 'siteSettings',
  label: 'Site Settings',
  access: { read: anyone, update: authenticated },
  hooks: { afterChange: [triggerDeployGlobal] },
  fields: [
    { name: 'siteName', type: 'text', required: true, defaultValue: 'Northvale Studio' },
    { name: 'description', type: 'textarea', required: true },
    { name: 'contactEmail', type: 'email', required: true },
    {
      name: 'analytics',
      type: 'group',
      admin: { description: 'Leave a field blank to disable that integration.' },
      fields: [
        { name: 'gtmId', label: 'Google Tag Manager ID', type: 'text', admin: { placeholder: 'GTM-XXXXXXX' } },
        { name: 'ga4Id', label: 'GA4 Measurement ID', type: 'text', admin: { placeholder: 'G-XXXXXXXXXX' } },
        { name: 'umamiSrc', label: 'Umami Script URL', type: 'text', admin: { placeholder: 'https://analytics.example.com/script.js' } },
        { name: 'umamiWebsiteId', label: 'Umami Website ID', type: 'text' },
      ],
    },
    {
      name: 'organization',
      type: 'group',
      admin: { description: 'Used for JSON-LD structured data (SEO / AI visibility).' },
      fields: [
        { name: 'legalName', type: 'text' },
        { name: 'logo', type: 'upload', relationTo: 'media' },
        {
          name: 'sameAs',
          type: 'array',
          labels: { singular: 'Profile URL', plural: 'Profile URLs' },
          fields: [{ name: 'url', type: 'text', required: true }],
        },
      ],
    },
  ],
}
