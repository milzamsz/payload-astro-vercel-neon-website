import type { GlobalConfig } from 'payload'
import { anyone } from '../access/anyone'
import { authenticated } from '../access/authenticated'
import { triggerDeployGlobal } from '../hooks/triggerDeploy'

export const Footer: GlobalConfig = {
  slug: 'footer',
  label: 'Footer',
  access: { read: anyone, update: authenticated },
  hooks: { afterChange: [triggerDeployGlobal] },
  fields: [
    {
      name: 'columns',
      label: 'Footer Columns',
      type: 'array',
      fields: [
        { name: 'title', type: 'text', required: true },
        {
          name: 'links',
          type: 'array',
          fields: [
            { name: 'label', type: 'text', required: true },
            { name: 'href', type: 'text', required: true },
          ],
        },
      ],
    },
    {
      name: 'social',
      label: 'Social Links',
      type: 'array',
      fields: [
        { name: 'platform', type: 'text', required: true },
        { name: 'href', type: 'text', required: true },
      ],
    },
  ],
}
