import type { PayloadRequest } from 'payload'

import { buildForgotPasswordEmailHtml } from './emailTemplates'
import { getDefaultEmailSettings, getEffectiveEmailSettings } from './emailSettings'

type AuthEmailUser = {
  email?: string | null
  fullName?: string | null
}

function getUserLabel(user?: AuthEmailUser | null): string {
  const fullName = user?.fullName?.trim()

  if (fullName) {
    return fullName
  }

  return user?.email?.trim() || 'there'
}

function buildForgotPasswordUrl(req: PayloadRequest, token: string): string {
  const requestOrigin = (() => {
    if (!req.url) {
      return req.payload.config.serverURL
    }

    try {
      return new URL(req.url).origin
    } catch {
      return req.payload.config.serverURL
    }
  })()
  const adminRoute = req.payload.config.routes.admin || '/admin'
  const resetRoute = req.payload.config.admin.routes.reset || '/reset'
  const adminPath = adminRoute.startsWith('/') ? adminRoute : `/${adminRoute}`
  const resetPath = resetRoute.startsWith('/') ? resetRoute : `/${resetRoute}`

  return `${requestOrigin.replace(/\/$/, '')}${adminPath}${resetPath}/${token}`
}

export async function generateForgotPasswordEmailSubject(args?: {
  req?: PayloadRequest
  token?: string
  user?: AuthEmailUser
}) {
  if (!args?.req) {
    return getDefaultEmailSettings().forgotPasswordSubject
  }

  const settings = await getEffectiveEmailSettings({
    payload: args.req.payload,
    req: args.req,
  })

  return settings.forgotPasswordSubject
}

export async function generateForgotPasswordEmailHTML(args?: {
  req?: PayloadRequest
  token?: string
  user?: AuthEmailUser
}) {
  if (!args?.req || !args.token) {
    const settings = getDefaultEmailSettings()

    return buildForgotPasswordEmailHtml({
      resetUrl: '#',
      settings,
      userLabel: getUserLabel(args?.user),
    })
  }

  const settings = await getEffectiveEmailSettings({
    payload: args.req.payload,
    req: args.req,
  })

  return buildForgotPasswordEmailHtml({
    resetUrl: buildForgotPasswordUrl(args.req, args.token),
    settings,
    userLabel: getUserLabel(args.user),
  })
}
