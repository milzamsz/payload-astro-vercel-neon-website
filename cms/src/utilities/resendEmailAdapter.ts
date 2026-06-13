import type { PayloadEmailAdapter, SendEmailOptions } from 'payload'
import { Resend } from 'resend'

import {
  formatSender,
  getEffectiveEmailSettings,
  isEmailDeliveryEnabled,
} from './emailSettings'

type AddressObject = {
  address?: string
  name?: string
}

type MessageAttachment = NonNullable<SendEmailOptions['attachments']>[number]
type NormalizedAttachment = {
  content?: string | Buffer
  content_id?: string
  content_type?: string
  filename?: string
  path?: string
}

function isNormalizedAttachment(
  attachment: NormalizedAttachment | null,
): attachment is NormalizedAttachment {
  return attachment !== null
}

function normalizeAddressValue(value: unknown): string | null {
  if (typeof value === 'string') {
    return value
  }

  if (value && typeof value === 'object' && 'address' in value) {
    const addressValue = value as AddressObject
    const address = typeof addressValue.address === 'string' ? addressValue.address : ''
    const name = typeof addressValue.name === 'string' ? addressValue.name.trim() : ''

    if (!address) {
      return null
    }

    return name ? `"${name.replace(/"/g, '\\"')}" <${address}>` : address
  }

  return null
}

function normalizeAddressInput(value: unknown): string | string[] | undefined {
  if (!value) {
    return undefined
  }

  if (Array.isArray(value)) {
    const list = value
      .map((entry) => normalizeAddressValue(entry))
      .filter((entry): entry is string => typeof entry === 'string' && entry.length > 0)

    if (list.length === 0) {
      return undefined
    }

    return list.length === 1 ? list[0] : list
  }

  return normalizeAddressValue(value) ?? undefined
}

function normalizeAttachments(message: SendEmailOptions) {
  if (!Array.isArray(message.attachments)) {
    return undefined
  }

  const attachments = message.attachments
    .map((attachment: MessageAttachment) => {
      if (!attachment) {
        return null
      }

      const filename = typeof attachment.filename === 'string' ? attachment.filename : undefined
      const path = typeof attachment.path === 'string' ? attachment.path : undefined
      const content =
        typeof attachment.content === 'string' || Buffer.isBuffer(attachment.content)
          ? attachment.content
          : undefined

      if (!filename && !path && !content) {
        return null
      }

      const normalizedAttachment: NormalizedAttachment = {
        content,
        content_id: typeof attachment.cid === 'string' ? attachment.cid : undefined,
        content_type: typeof attachment.contentType === 'string' ? attachment.contentType : undefined,
        filename,
        path,
      }

      return normalizedAttachment
    })
    .filter(
      (attachment: NormalizedAttachment | null): attachment is NormalizedAttachment =>
        isNormalizedAttachment(attachment),
    )

  return attachments.length > 0 ? attachments : undefined
}

export function createPayloadEmailAdapter(): PayloadEmailAdapter {
  const resendApiKey = process.env.RESEND_API_KEY

  return ({ payload }) => {
    const resend = resendApiKey ? new Resend(resendApiKey) : null

    if (process.env.NODE_ENV === 'production' && !resendApiKey) {
      payload.logger.warn(
        'RESEND_API_KEY is not configured. Production builds can continue, but email delivery will fail until the key is set.',
      )
    }

    return {
      defaultFromAddress: 'noreply@localhost',
      defaultFromName: 'Kebun Kumara',
      name: resend ? 'resend' : 'console',
      sendEmail: async (message) => {
        const settings = await getEffectiveEmailSettings({ payload })

        if (!isEmailDeliveryEnabled(settings)) {
          payload.logger.info('Skipping email delivery because email settings are disabled or incomplete.')
          return { skipped: true }
        }

        if (process.env.NODE_ENV === 'production' && !resend) {
          throw new Error(
            'RESEND_API_KEY is required to send emails in production. Add it to your environment variables and redeploy.',
          )
        }

        const replyTo =
          normalizeAddressInput(message.replyTo) ??
          (settings.replyToEmail || undefined)
        const outgoingMessage: SendEmailOptions = {
          ...message,
          from: formatSender(settings.fromName, settings.fromEmail),
          replyTo,
        }

        if (!resend) {
          payload.logger.info(
            JSON.stringify(
              {
                from: outgoingMessage.from,
                html: outgoingMessage.html,
                replyTo: outgoingMessage.replyTo,
                subject: outgoingMessage.subject,
                text: outgoingMessage.text,
                to: outgoingMessage.to,
              },
              null,
              2,
            ),
          )

          return { mode: 'console' }
        }

        return resend.emails.send({
          attachments: normalizeAttachments(outgoingMessage),
          bcc: normalizeAddressInput(outgoingMessage.bcc),
          cc: normalizeAddressInput(outgoingMessage.cc),
          from: normalizeAddressValue(outgoingMessage.from) ?? formatSender(settings.fromName, settings.fromEmail),
          headers:
            outgoingMessage.headers && typeof outgoingMessage.headers === 'object'
              ? Object.fromEntries(
                  Object.entries(outgoingMessage.headers).map(([key, value]) => [key, String(value)]),
                )
              : undefined,
          html: outgoingMessage.html ?? undefined,
          replyTo,
          subject: outgoingMessage.subject ?? '',
          text: outgoingMessage.text ?? undefined,
          to: normalizeAddressInput(outgoingMessage.to) ?? '',
        })
      },
    }
  }
}
