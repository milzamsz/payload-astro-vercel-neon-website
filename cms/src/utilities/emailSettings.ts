import type { Payload, PayloadRequest } from 'payload'

const EMAIL_SETTINGS_CACHE_KEY = '__emailSettingsCache'

export type EmailRecipientRecord = {
  email?: string | null
}

export type EmailSettingsRecord = {
  enabled?: boolean | null
  fromName?: string | null
  fromEmail?: string | null
  replyToEmail?: string | null
  adminRecipients?: EmailRecipientRecord[] | null
  sendContactAdminNotification?: boolean | null
  sendContactAutoReply?: boolean | null
  contactAdminSubjectPrefix?: string | null
  contactAutoReplySubject?: string | null
  contactAutoReplyIntro?: string | null
  contactAutoReplySignature?: string | null
  forgotPasswordSubject?: string | null
  forgotPasswordIntro?: string | null
  forgotPasswordSignature?: string | null
}

export type EffectiveEmailSettings = {
  enabled: boolean
  fromName: string
  fromEmail: string
  replyToEmail: string
  adminRecipients: string[]
  sendContactAdminNotification: boolean
  sendContactAutoReply: boolean
  contactAdminSubjectPrefix: string
  contactAutoReplySubject: string
  contactAutoReplyIntro: string
  contactAutoReplySignature: string
  forgotPasswordSubject: string
  forgotPasswordIntro: string
  forgotPasswordSignature: string
}

type CacheContext = PayloadRequest['context'] & {
  [EMAIL_SETTINGS_CACHE_KEY]?: Promise<EmailSettingsRecord> | EmailSettingsRecord
}

const DEFAULT_EMAIL_SETTINGS: EffectiveEmailSettings = {
  enabled: false,
  fromName: 'Northvale Studio',
  fromEmail: '',
  replyToEmail: '',
  adminRecipients: [],
  sendContactAdminNotification: true,
  sendContactAutoReply: true,
  contactAdminSubjectPrefix: '[Northvale Studio Contact]',
  contactAutoReplySubject: 'We received your message',
  contactAutoReplyIntro:
    'Thank you for reaching out to Northvale Studio. Our team has received your message and will get back to you soon.',
  contactAutoReplySignature: 'Warm regards,\nNorthvale Studio',
  forgotPasswordSubject: 'Reset your Northvale Studio password',
  forgotPasswordIntro:
    'We received a request to reset your Northvale Studio account password. Use the secure link below to set a new password.',
  forgotPasswordSignature: 'Warm regards,\nNorthvale Studio',
}

function normalizeString(value: string | null | undefined): string {
  return typeof value === 'string' ? value.trim() : ''
}

function normalizeRecipients(
  recipients: EmailRecipientRecord[] | null | undefined,
): string[] {
  return (recipients ?? [])
    .map((recipient) => normalizeString(recipient?.email))
    .filter((email, index, list) => email.length > 0 && list.indexOf(email) === index)
}

export async function getEmailSettings({
  payload,
  req,
}: {
  payload: Payload
  req?: PayloadRequest | null
}): Promise<EmailSettingsRecord> {
  const context = req?.context as CacheContext | undefined
  const cached = context?.[EMAIL_SETTINGS_CACHE_KEY]

  if (cached) {
    return await cached
  }

  const promise = payload
    .findGlobal({
      slug: 'emailSettings' as never,
      depth: 0,
      overrideAccess: true,
    })
    .then((doc) => doc as EmailSettingsRecord)
    .catch((error) => {
      payload.logger.warn(`Failed to load email settings: ${String(error)}`)
      return {}
    })

  if (context) {
    context[EMAIL_SETTINGS_CACHE_KEY] = promise
  }

  const resolved = await promise

  if (context) {
    context[EMAIL_SETTINGS_CACHE_KEY] = resolved
  }

  return resolved
}

export async function getEffectiveEmailSettings({
  payload,
  req,
}: {
  payload: Payload
  req?: PayloadRequest | null
}): Promise<EffectiveEmailSettings> {
  const settings = await getEmailSettings({ payload, req })

  return {
    enabled: Boolean(settings.enabled),
    fromName: normalizeString(settings.fromName) || DEFAULT_EMAIL_SETTINGS.fromName,
    fromEmail: normalizeString(settings.fromEmail),
    replyToEmail: normalizeString(settings.replyToEmail),
    adminRecipients: normalizeRecipients(settings.adminRecipients),
    sendContactAdminNotification:
      settings.sendContactAdminNotification ?? DEFAULT_EMAIL_SETTINGS.sendContactAdminNotification,
    sendContactAutoReply:
      settings.sendContactAutoReply ?? DEFAULT_EMAIL_SETTINGS.sendContactAutoReply,
    contactAdminSubjectPrefix:
      normalizeString(settings.contactAdminSubjectPrefix) ||
      DEFAULT_EMAIL_SETTINGS.contactAdminSubjectPrefix,
    contactAutoReplySubject:
      normalizeString(settings.contactAutoReplySubject) ||
      DEFAULT_EMAIL_SETTINGS.contactAutoReplySubject,
    contactAutoReplyIntro:
      normalizeString(settings.contactAutoReplyIntro) ||
      DEFAULT_EMAIL_SETTINGS.contactAutoReplyIntro,
    contactAutoReplySignature:
      normalizeString(settings.contactAutoReplySignature) ||
      DEFAULT_EMAIL_SETTINGS.contactAutoReplySignature,
    forgotPasswordSubject:
      normalizeString(settings.forgotPasswordSubject) ||
      DEFAULT_EMAIL_SETTINGS.forgotPasswordSubject,
    forgotPasswordIntro:
      normalizeString(settings.forgotPasswordIntro) ||
      DEFAULT_EMAIL_SETTINGS.forgotPasswordIntro,
    forgotPasswordSignature:
      normalizeString(settings.forgotPasswordSignature) ||
      DEFAULT_EMAIL_SETTINGS.forgotPasswordSignature,
  }
}

export function getDefaultEmailSettings(): EffectiveEmailSettings {
  return DEFAULT_EMAIL_SETTINGS
}

export function isEmailDeliveryEnabled(settings: EffectiveEmailSettings): boolean {
  return settings.enabled && settings.fromEmail.length > 0
}

export function formatSender(fromName: string, fromEmail: string): string {
  const safeName = fromName.replace(/"/g, '\\"').trim()

  return safeName.length > 0 ? `"${safeName}" <${fromEmail}>` : fromEmail
}
