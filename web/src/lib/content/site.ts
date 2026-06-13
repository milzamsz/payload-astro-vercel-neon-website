import type { SiteSettings } from '@/lib/types'

/**
 * Local site settings (vibecode phase). In the synced phase these come from the
 * Payload `SiteSettings`, `Header`, and `Footer` globals. Analytics IDs default
 * to empty (disabled) — set them here or via the CMS to enable.
 */
export const site: SiteSettings = {
  siteName: 'Northvale Studio',
  description:
    'A product studio that designs, builds, and ships software for teams who care about the details.',
  url: import.meta.env.PUBLIC_SITE_URL || 'http://localhost:4321',
  logoText: 'Northvale',
  nav: [
    { label: 'Work', href: '/#work' },
    { label: 'About', href: '/about' },
    { label: 'Writing', href: '/blog' },
    { label: 'Contact', href: '/contact' },
  ],
  footerNav: [
    {
      title: 'Studio',
      links: [
        { label: 'About', href: '/about' },
        { label: 'Writing', href: '/blog' },
        { label: 'Contact', href: '/contact' },
      ],
    },
    {
      title: 'Legal',
      links: [
        { label: 'Privacy', href: '/legal/privacy' },
        { label: 'Terms', href: '/legal/terms' },
      ],
    },
  ],
  social: [
    { platform: 'GitHub', href: 'https://github.com' },
    { platform: 'LinkedIn', href: 'https://linkedin.com' },
  ],
  contactEmail: 'hello@northvale.studio',
  gtmId: import.meta.env.PUBLIC_GTM_ID || '',
  ga4Id: import.meta.env.PUBLIC_GA4_ID || '',
  umamiSrc: import.meta.env.PUBLIC_UMAMI_SRC || '',
  umamiWebsiteId: import.meta.env.PUBLIC_UMAMI_WEBSITE_ID || '',
  organization: {
    legalName: 'Northvale Studio Ltd.',
    logo: '/favicon.svg',
    sameAs: ['https://github.com', 'https://linkedin.com'],
  },
}
