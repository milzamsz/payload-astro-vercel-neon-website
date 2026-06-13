import type { Page } from '@/lib/types'

/** Placeholder legal copy. Replace with reviewed text before launch. */

export const privacy: Page = {
  slug: 'privacy',
  title: 'Privacy Policy',
  seo: { description: 'How we handle your data.', noindex: false },
  blocks: [
    {
      blockType: 'richText',
      width: 'narrow',
      html: `<p><em>Last updated: 1 June 2026. This is placeholder copy — replace with policy reviewed by counsel before launch.</em></p>
<h2>What we collect</h2><p>We collect the information you send us through forms (your name, email, and message) and anonymous, aggregated analytics about how the site is used.</p>
<h2>Analytics</h2><p>We use privacy-respecting analytics. Tracking that uses cookies only runs after you accept it via the consent banner.</p>
<h2>How we use it</h2><p>To reply to enquiries and to understand which content is useful. We do not sell your data.</p>
<h2>Your rights</h2><p>You can ask us what we hold about you, and ask us to delete it, by emailing the address in the footer.</p>`,
    },
  ],
}

export const terms: Page = {
  slug: 'terms',
  title: 'Terms of Service',
  seo: { description: 'The terms that govern use of this site.' },
  blocks: [
    {
      blockType: 'richText',
      width: 'narrow',
      html: `<p><em>Last updated: 1 June 2026. This is placeholder copy — replace with reviewed terms before launch.</em></p>
<h2>Use of this site</h2><p>You may browse and share this content for personal and professional reference. The brand, copy, and design remain ours.</p>
<h2>No warranty</h2><p>The site is provided as is. We work to keep it accurate but make no guarantees about availability or fitness for a particular purpose.</p>
<h2>Contact</h2><p>Questions about these terms go to the email address in the footer.</p>`,
    },
  ],
}

export const legalPages: Page[] = [privacy, terms]
