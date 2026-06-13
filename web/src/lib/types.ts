/**
 * Shared content shapes. These mirror the Payload CMS collections/blocks 1:1.
 * Astro renders from these whether the data comes from local content (vibecode
 * phase) or the CMS REST API (synced phase). Keep block `blockType` strings in
 * sync with `cms/src/blocks/*`.
 */

export type Media = {
  url: string
  alt: string
  width?: number
  height?: number
}

export type CTA = {
  label: string
  href: string
  variant?: 'primary' | 'secondary' | 'ghost'
}

export type FormField =
  | {
      blockType: 'text' | 'email'
      name: string
      label?: string
      required?: boolean
      width?: number
      defaultValue?: string
    }
  | {
      blockType: 'textarea'
      name: string
      label?: string
      required?: boolean
      width?: number
      defaultValue?: string
    }
  | {
      blockType: 'select'
      name: string
      label?: string
      required?: boolean
      width?: number
      defaultValue?: string
      placeholder?: string
      options?: { label: string; value: string }[]
    }
  | {
      blockType: 'checkbox'
      name: string
      label?: string
      required?: boolean
      width?: number
      defaultValue?: boolean
    }
  | {
      blockType: 'message'
      html?: string
    }

export type FormDefinition = {
  id: string
  title: string
  submitButtonLabel?: string
  confirmationType?: 'message' | 'redirect'
  confirmationMessageHtml?: string
  redirectUrl?: string
  fields: FormField[]
}

// ---- Blocks (mirror cms/src/blocks) ----

export type HeroBlock = {
  blockType: 'hero'
  eyebrow?: string
  heading: string
  subheading?: string
  image?: Media
  ctas?: CTA[]
}

export type RichTextBlock = {
  blockType: 'richText'
  html: string // Lexical serialized to HTML
  width?: 'narrow' | 'full'
}

export type FeatureItem = { title: string; body: string; icon?: string }
export type FeatureGridBlock = {
  blockType: 'featureGrid'
  heading?: string
  intro?: string
  items: FeatureItem[]
}

export type MediaBlock = {
  blockType: 'mediaBlock'
  image: Media
  caption?: string
}

export type CTABlock = {
  blockType: 'cta'
  heading: string
  body?: string
  cta: CTA
}

export type StatItem = { value: string; label: string }
export type StatsBlock = {
  blockType: 'stats'
  heading?: string
  items: StatItem[]
}

export type FAQItem = { question: string; answer: string }
export type FAQBlock = {
  blockType: 'faq'
  heading?: string
  items: FAQItem[]
}

export type LogoCloudBlock = {
  blockType: 'logoCloud'
  heading?: string
  logos: { name: string; src: string }[]
}

export type FormBlock = {
  blockType: 'formBlock'
  heading?: string
  intro?: string
  form: FormDefinition
}

export type Block =
  | HeroBlock
  | RichTextBlock
  | FeatureGridBlock
  | MediaBlock
  | CTABlock
  | StatsBlock
  | FAQBlock
  | LogoCloudBlock
  | FormBlock

// ---- Documents ----

export type SEO = {
  title?: string
  description?: string
  image?: Media
  noindex?: boolean
}

export type Page = {
  slug: string
  title: string
  blocks: Block[]
  seo?: SEO
}

export type Post = {
  slug: string
  title: string
  excerpt: string
  publishedAt: string // ISO
  author: { name: string; role?: string; avatar?: Media }
  category?: string
  coverImage?: Media
  bodyHtml: string // Lexical → HTML
  seo?: SEO
}

export type NavLink = { label: string; href: string }

export type SiteSettings = {
  siteName: string
  description: string
  url: string
  logoText: string
  nav: NavLink[]
  footerNav: { title: string; links: NavLink[] }[]
  social: { platform: string; href: string }[]
  contactEmail: string
  // analytics IDs — empty string disables that integration
  gtmId: string
  ga4Id: string
  umamiSrc: string
  umamiWebsiteId: string
  organization: {
    legalName: string
    logo: string
    sameAs: string[]
  }
}

export type SearchResult = {
  title: string
  href: string
  excerpt?: string
  category?: string
  publishedAt?: string
  priority?: number
}
