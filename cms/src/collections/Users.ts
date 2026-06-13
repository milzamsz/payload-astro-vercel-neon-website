import type { CollectionConfig, CollectionBeforeChangeHook, FieldHook } from 'payload'
import { adminOnlyOrBootstrap, adminOrSelf, canManageUserRole } from '../access/users'
import { isAdmin, isAdminOrEditor } from '../access/isAdminOrEditor'
import {
  generateForgotPasswordEmailHTML,
  generateForgotPasswordEmailSubject,
} from '../utilities/authEmails'

// Field hook to prevent reading 2FA secret via external API
// Internal operations can bypass by passing context.internal = true
const preventSecretRead: FieldHook = ({ value, context }) => {
  if (context?.internal === true) return value
  return null
}

// Field hook to prevent reading backup codes via external API
// Internal operations can bypass by passing context.internal = true
const preventBackupCodesRead: FieldHook = ({ value, context }) => {
  if (context?.internal === true) return value
  return null
}

// Field hook to prevent reading email code via external API
// Internal operations can bypass by passing context.internal = true
const preventEmailCodeRead: FieldHook = ({ value, context }) => {
  if (context?.internal === true) return value
  return null
}

/**
 * When an admin enables the twoFactorEnabled checkbox via the admin panel,
 * clear all 2FA setup data so the user must go through the full setup flow
 * (choose method → verify) on their next login.
 *
 * Skip this reset when the 2FA API routes set twoFactorEnabled programmatically
 * (they pass context.skipTwoFactorReset = true).
 */
const resetTwoFactorOnEnable: CollectionBeforeChangeHook = async ({
  data,
  originalDoc,
  context,
}) => {
  // Skip if the 2FA API is doing programmatic updates
  if (context?.skipTwoFactorReset) return data

  const wasEnabled = originalDoc?.twoFactorEnabled === true
  const isNowEnabled = data?.twoFactorEnabled === true

  // When admin toggles 2FA on (or re-enables), clear all setup data
  // so the user is forced to pick a method on next login
  if (isNowEnabled && !wasEnabled) {
    return {
      ...data,
      twoFactorMethod: null,
      twoFactorSecret: null,
      twoFactorBackupCodes: [],
      twoFactorEmailCode: null,
      twoFactorEmailCodeExpiresAt: null,
      twoFactorSessionExpires: null,
    }
  }

  // When admin disables 2FA, also clear everything
  if (!isNowEnabled && wasEnabled) {
    return {
      ...data,
      twoFactorMethod: null,
      twoFactorSecret: null,
      twoFactorBackupCodes: [],
      twoFactorEmailCode: null,
      twoFactorEmailCodeExpiresAt: null,
      twoFactorSessionExpires: null,
    }
  }

  return data
}

export const Users: CollectionConfig = {
  slug: 'users',
  labels: {
    singular: 'User',
    plural: 'Users',
  },
  auth: {
    // API key lets the Astro web app fetch drafts for live preview.
    // Published content is publicly readable, so SSG builds need no key.
    useAPIKey: true,
    forgotPassword: {
      generateEmailHTML: generateForgotPasswordEmailHTML,
      generateEmailSubject: generateForgotPasswordEmailSubject,
    },
  },
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['email', 'fullName', 'role', 'twoFactorEnabled'],
  },
  hooks: {
    beforeChange: [resetTwoFactorOnEnable],
  },
  access: {
    admin: isAdminOrEditor,
    create: adminOnlyOrBootstrap,
    delete: isAdmin,
    read: adminOrSelf,
    update: adminOrSelf,
  },
  fields: [
    {
      name: 'fullName',
      label: 'Full Name',
      type: 'text',
      required: true,
    },
    {
      name: 'role',
      label: 'Role',
      type: 'select',
      required: true,
      defaultValue: 'editor',
      saveToJWT: true,
      access: {
        create: canManageUserRole,
        update: canManageUserRole,
      },
      options: [
        { label: 'Admin', value: 'admin' },
        { label: 'Editor', value: 'editor' },
      ],
    },
    {
      name: 'profilePicture',
      label: 'Profile Picture',
      type: 'upload',
      relationTo: 'media',
    },
    // Two-Factor Authentication Fields
    {
      name: 'twoFactorEnabled',
      label: 'Require 2FA',
      type: 'checkbox',
      defaultValue: false,
      saveToJWT: true,
      admin: {
        description: 'Enable to require two-factor authentication for this user. The user will choose their preferred method on next login.',
        components: {
          Cell: './components/payload/CheckboxCell#CheckboxCell',
        },
      },
    },
    {
      name: 'twoFactorMethod',
      label: '2FA Method',
      type: 'select',
      saveToJWT: true,
      admin: {
        condition: (data) => data.twoFactorEnabled,
        readOnly: true,
        description: 'Set automatically when the user completes 2FA setup',
      },
      options: [
        { label: 'Email Verification', value: 'email' },
        { label: 'Authenticator App', value: 'authenticator' },
      ],
    },
    {
      name: 'twoFactorSecret',
      label: '2FA Secret',
      type: 'text',
      admin: {
        hidden: true,
      },
      hooks: {
        afterRead: [preventSecretRead],
      },
    },
    {
      name: 'twoFactorBackupCodes',
      label: '2FA Backup Codes (Hashed)',
      type: 'array',
      admin: {
        hidden: true,
      },
      hooks: {
        afterRead: [preventBackupCodesRead],
      },
      fields: [
        {
          name: 'hash',
          type: 'text',
        },
      ],
    },
    {
      name: 'twoFactorEmailCode',
      label: '2FA Email Code',
      type: 'text',
      admin: {
        hidden: true,
      },
      hooks: {
        afterRead: [preventEmailCodeRead],
      },
    },
    {
      name: 'twoFactorEmailCodeExpiresAt',
      label: '2FA Email Code Expires At',
      type: 'date',
      admin: {
        hidden: true,
      },
    },
    {
      name: 'twoFactorSessionExpires',
      label: '2FA Session Expires',
      type: 'number',
      admin: {
        hidden: true,
        description: 'Unix timestamp when the current 2FA admin session expires',
      },
    },
  ],
}
