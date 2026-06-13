import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import {
  generateEmailCode,
  getEmailCodeExpiry,
  sendTwoFactorEmailCode,
} from '@/utilities/twoFactorAuth'

/**
 * POST /api/auth/2fa/send-email-code
 * Send (or resend) a 2FA email code to the authenticated user.
 * Called by TwoFactorAdminPage on mount and on "Resend code" click.
 *
 * Requires: Authorization: JWT <token>
 */
export async function POST(request: NextRequest) {
  try {
    const payload = await getPayload({ config })

    // Authenticate via JWT header
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('JWT ')) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    let userId: string | number
    let userEmail: string
    try {
      const verified = await payload.auth({ headers: request.headers })
      if (!verified.user) {
        return NextResponse.json({ error: 'Invalid authentication' }, { status: 401 })
      }
      userId = verified.user.id
      userEmail = verified.user.email
    } catch {
      return NextResponse.json({ error: 'Invalid authentication' }, { status: 401 })
    }

    // Confirm user has email-based 2FA enabled
    const user = await payload.findByID({
      collection: 'users',
      id: userId,
      overrideAccess: true,
    }) as unknown as {
      twoFactorEnabled?: boolean
      twoFactorMethod?: string
    }

    if (user.twoFactorMethod !== 'email') {
      return NextResponse.json({ error: 'Email 2FA is not configured' }, { status: 400 })
    }

    // Generate and store new code
    const emailCode = generateEmailCode()
    const codeExpiry = getEmailCodeExpiry()

    await payload.update({
      collection: 'users',
      id: userId,
      data: {
        twoFactorEmailCode: emailCode,
        twoFactorEmailCodeExpiresAt: codeExpiry,
      },
      overrideAccess: true,
    })

    // Send email
    const sent = await sendTwoFactorEmailCode({
      payload,
      email: userEmail,
      code: emailCode,
    })

    if (!sent) {
      return NextResponse.json({ error: 'Failed to send email. Please check email settings.' }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Verification code sent' })
  } catch (error) {
    console.error('[2FA Send Email Code] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
