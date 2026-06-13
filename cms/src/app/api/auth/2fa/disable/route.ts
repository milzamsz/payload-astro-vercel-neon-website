import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

/**
 * POST /api/auth/2fa/disable
 * Disable 2FA for the current user
 * Body: { password: string } - requires password confirmation
 */
export async function POST(request: NextRequest) {
  try {
    const payload = await getPayload({ config })
    const body = await request.json()
    const { password }: { password: string } = body

    if (!password) {
      return NextResponse.json(
        { error: 'Password confirmation is required' },
        { status: 400 }
      )
    }

    // Get current user from token
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('JWT ')) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    let userId: string | number
    let userEmail: string

    try {
      const verified = await payload.auth({ headers: request.headers })
      if (!verified.user) {
        return NextResponse.json(
          { error: 'Invalid authentication' },
          { status: 401 }
        )
      }
      userId = verified.user.id
      userEmail = verified.user.email
    } catch {
      return NextResponse.json(
        { error: 'Invalid authentication' },
        { status: 401 }
      )
    }

    // Verify password using Payload's login method
    try {
      await payload.login({
        collection: 'users',
        data: {
          email: userEmail,
          password,
        },
      })
    } catch {
      return NextResponse.json(
        { error: 'Invalid password' },
        { status: 400 }
      )
    }

    // Disable 2FA and clear all 2FA data
    await payload.update({
      collection: 'users',
      id: userId,
      data: {
        twoFactorEnabled: false,
        twoFactorMethod: null,
        twoFactorSecret: null,
        twoFactorBackupCodes: [],
        twoFactorEmailCode: null,
        twoFactorEmailCodeExpiresAt: null,
      },
      overrideAccess: true,
      context: { skipTwoFactorReset: true },
    })

    return NextResponse.json({
      success: true,
      message: 'Two-factor authentication disabled successfully',
    })
  } catch (error) {
    console.error('[2FA Disable] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
