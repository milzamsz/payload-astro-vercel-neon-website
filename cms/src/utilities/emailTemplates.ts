import type { EffectiveEmailSettings } from './emailSettings'

export type ContactSubmissionEmailData = {
  senderName: string
  email: string
  phone?: string | null
  subject?: string | null
  message: string
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function renderParagraphs(value: string): string {
  return escapeHtml(value).replace(/\n/g, '<br />')
}

function renderShell({
  title,
  intro,
  body,
  ctaLabel,
  ctaUrl,
  signature,
}: {
  title: string
  intro: string
  body: string
  ctaLabel?: string
  ctaUrl?: string
  signature?: string
}): string {
  const cta =
    ctaLabel && ctaUrl
      ? `
        <p style="margin: 32px 0;">
          <a href="${escapeHtml(ctaUrl)}" style="background: #4F772D; border-radius: 999px; color: #ffffff; display: inline-block; font-weight: 700; padding: 14px 24px; text-decoration: none;">
            ${escapeHtml(ctaLabel)}
          </a>
        </p>
      `
      : ''

  const footer = signature
    ? `<p style="color: #5B6356; font-size: 14px; line-height: 1.7; margin: 32px 0 0;">${renderParagraphs(signature)}</p>`
    : ''

  return `
    <div style="background: #F7F5EF; margin: 0; padding: 32px 16px;">
      <div style="background: #ffffff; border: 1px solid #E6E2D8; border-radius: 20px; margin: 0 auto; max-width: 640px; overflow: hidden;">
        <div style="background: #2D3A26; color: #ffffff; padding: 28px 32px;">
          <p style="font-size: 12px; font-weight: 700; letter-spacing: 0.18em; margin: 0 0 10px; text-transform: uppercase;">Kebun Kumara</p>
          <h1 style="font-size: 28px; line-height: 1.2; margin: 0;">${escapeHtml(title)}</h1>
        </div>
        <div style="padding: 32px;">
          <p style="color: #2D3A26; font-size: 16px; line-height: 1.8; margin: 0 0 18px;">${renderParagraphs(intro)}</p>
          <div style="color: #2D3A26; font-size: 15px; line-height: 1.8;">${body}</div>
          ${cta}
          ${footer}
        </div>
      </div>
    </div>
  `
}

export function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

export function buildForgotPasswordEmailHtml({
  resetUrl,
  settings,
  userLabel,
}: {
  resetUrl: string
  settings: EffectiveEmailSettings
  userLabel: string
}): string {
  const intro = `Hi ${userLabel},\n\n${settings.forgotPasswordIntro}`
  const body = `
    <p style="margin: 0 0 18px;">Use the secure button below to reset your password:</p>
    <p style="margin: 0 0 18px; word-break: break-word;">
      <a href="${escapeHtml(resetUrl)}" style="color: #4F772D;">${escapeHtml(resetUrl)}</a>
    </p>
    <p style="margin: 0;">If you did not request this password reset, you can safely ignore this email.</p>
  `

  return renderShell({
    title: settings.forgotPasswordSubject,
    intro,
    body,
    ctaLabel: 'Reset Password',
    ctaUrl: resetUrl,
    signature: settings.forgotPasswordSignature,
  })
}

export function buildContactAdminEmail({
  settings,
  submission,
}: {
  settings: EffectiveEmailSettings
  submission: ContactSubmissionEmailData
}) {
  const subjectText = submission.subject?.trim() || 'General Inquiry'
  const subject = `${settings.contactAdminSubjectPrefix} ${subjectText}`.trim()
  const html = renderShell({
    title: 'New Contact Submission',
    intro: 'A new message has been submitted through the Kebun Kumara contact form.',
    body: `
      <p style="margin: 0 0 12px;"><strong>Name:</strong> ${escapeHtml(submission.senderName)}</p>
      <p style="margin: 0 0 12px;"><strong>Email:</strong> ${escapeHtml(submission.email)}</p>
      <p style="margin: 0 0 12px;"><strong>Phone:</strong> ${escapeHtml(submission.phone?.trim() || '-')}</p>
      <p style="margin: 0 0 12px;"><strong>Subject:</strong> ${escapeHtml(subjectText)}</p>
      <p style="margin: 18px 0 8px;"><strong>Message</strong></p>
      <div style="background: #F7F5EF; border-radius: 12px; padding: 16px;">${renderParagraphs(submission.message)}</div>
    `,
  })

  return { html, subject, text: stripHtml(html) }
}

export function buildContactAutoReplyEmail({
  settings,
  submission,
}: {
  settings: EffectiveEmailSettings
  submission: ContactSubmissionEmailData
}) {
  const html = renderShell({
    title: settings.contactAutoReplySubject,
    intro: `Hi ${submission.senderName},\n\n${settings.contactAutoReplyIntro}`,
    body: `
      <p style="margin: 0 0 12px;">Here is a copy of the message we received from you:</p>
      <div style="background: #F7F5EF; border-radius: 12px; padding: 16px;">
        <p style="margin: 0 0 10px;"><strong>Subject:</strong> ${escapeHtml(
          submission.subject?.trim() || 'General Inquiry',
        )}</p>
        <div>${renderParagraphs(submission.message)}</div>
      </div>
    `,
    signature: settings.contactAutoReplySignature,
  })

  return {
    html,
    subject: settings.contactAutoReplySubject,
    text: stripHtml(html),
  }
}

export function buildTwoFactorEmailHtml({
  code,
  settings,
}: {
  code: string
  settings: EffectiveEmailSettings
}): string {
  const intro = 'You requested a two-factor authentication code to sign in to your Kebun Kumara account.'
  const body = `
    <p style="margin: 0 0 18px;">Enter this verification code to complete your sign-in:</p>
    <div style="background: #F7F5EF; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;">
      <span style="font-family: monospace; font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #2D3A26;">${code}</span>
    </div>
    <p style="margin: 0 0 18px; color: #5B6356; font-size: 14px;">This code will expire in 10 minutes.</p>
    <p style="margin: 0;">If you did not request this code, please ignore this email or contact support if you believe your account may be compromised.</p>
  `

  return renderShell({
    title: 'Your Two-Factor Authentication Code',
    intro,
    body,
    signature: settings.forgotPasswordSignature,
  })
}
