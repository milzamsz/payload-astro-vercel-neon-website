import type { GlobalConfig } from 'payload'
import { anyone } from '../access/anyone'
import { authenticated } from '../access/authenticated'
import { triggerDeployGlobal } from '../hooks/triggerDeploy'

export const Header: GlobalConfig = {
  slug: 'header',
  label: 'Header',
  access: { read: anyone, update: authenticated },
  hooks: { afterChange: [triggerDeployGlobal] },
  fields: [
    { name: 'logoText', type: 'text', required: true, defaultValue: 'Northvale' },
    {
      name: 'nav',
      label: 'Navigation',
      type: 'array',
      fields: [
        { name: 'label', type: 'text', required: true },
        { name: 'href', type: 'text', required: true },
      ],
    },
  ],
}
