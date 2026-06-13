import type { GlobalConfig } from 'payload'
import { authenticated } from '../access/authenticated'

export const EmailSettings: GlobalConfig = {
  slug: 'emailSettings',
  label: 'Email Settings',
  access: {
    read: authenticated,
    update: authenticated,
  },
  admin: {
    description:
      'Configure business email settings for Resend-powered auth and contact emails. API keys stay in environment variables.',
  },
  hooks: {
    beforeValidate: [
      ({ data }) => {
        if (!data?.enabled) {
          return data
        }

        const fromName = typeof data.fromName === 'string' ? data.fromName.trim() : ''
        const fromEmail = typeof data.fromEmail === 'string' ? data.fromEmail.trim() : ''

        if (!fromName) {
          throw new Error('From Name is required when email delivery is enabled.')
        }

        if (!fromEmail) {
          throw new Error('From Email is required when email delivery is enabled.')
        }

        return data
      },
    ],
  },
  fields: [
    {
      name: 'enabled',
      label: 'Enable Email Delivery',
      type: 'checkbox',
      defaultValue: false,
    },
    {
      type: 'row',
      fields: [
        {
          name: 'fromName',
          label: 'From Name',
          type: 'text',
          defaultValue: 'Northvale Studio',
          admin: {
            description: 'Used as the sender name in outgoing emails.',
          },
        },
        {
          name: 'fromEmail',
          label: 'From Email',
          type: 'email',
          admin: {
            description:
              'Use a sender address from a domain already verified in Resend. Required when email delivery is enabled.',
          },
        },
        {
          name: 'replyToEmail',
          label: 'Reply-To Email',
          type: 'email',
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'sendContactAdminNotification',
          label: 'Send Contact Admin Notification',
          type: 'checkbox',
          defaultValue: true,
        },
        {
          name: 'sendContactAutoReply',
          label: 'Send Contact Auto Reply',
          type: 'checkbox',
          defaultValue: true,
        },
      ],
    },
    {
      name: 'adminRecipients',
      label: 'Admin Recipients',
      type: 'array',
      labels: {
        singular: 'Recipient',
        plural: 'Recipients',
      },
      admin: {
        description: 'Who should receive contact form notifications.',
      },
      fields: [
        {
          name: 'email',
          label: 'Recipient Email',
          type: 'email',
          required: true,
        },
      ],
    },
    {
      name: 'contactAdminSubjectPrefix',
      label: 'Contact Admin Subject Prefix',
      type: 'text',
      defaultValue: '[Northvale Studio Contact]',
    },
    {
      name: 'contactAutoReplySubject',
      label: 'Contact Auto Reply Subject',
      type: 'text',
      defaultValue: 'We received your message',
    },
    {
      name: 'contactAutoReplyIntro',
      label: 'Contact Auto Reply Intro',
      type: 'textarea',
      defaultValue:
        'Thank you for reaching out. Our team has received your message and will respond within one business day.',
    },
    {
      name: 'contactAutoReplySignature',
      label: 'Contact Auto Reply Signature',
      type: 'textarea',
      defaultValue: 'Best regards,\nThe Northvale Studio team',
    },
    {
      name: 'forgotPasswordSubject',
      label: 'Forgot Password Subject',
      type: 'text',
      defaultValue: 'Reset your Northvale Studio password',
    },
    {
      name: 'forgotPasswordIntro',
      label: 'Forgot Password Intro',
      type: 'textarea',
      defaultValue:
        'We received a request to reset your Northvale Studio account password. Use the secure link below to set a new password.',
    },
    {
      name: 'forgotPasswordSignature',
      label: 'Forgot Password Signature',
      type: 'textarea',
      defaultValue: 'Best regards,\nThe Northvale Studio team',
    },
  ],
}
