import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import type { TwoFactorMethod } from '@/utilities/twoFactorAuth'

/**
 * GET /api/auth/2fa/status
 * Get 2FA status for the current user
 * Returns: { twoFactorEnabled: boolean, method?: TwoFactorMethod }
 */
export async function GET(request: NextRequest) {
  try {
    const payload = await getPayload({ config })

    // Get current user from token
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('JWT ')) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    let userId: string | number

    try {
      const verified = await payload.auth({ headers: request.headers })
      if (!verified.user) {
        return NextResponse.json(
          { error: 'Invalid authentication' },
          { status: 401 }
        )
      }
      userId = verified.user.id
    } catch {
      return NextResponse.json(
        { error: 'Invalid authentication' },
        { status: 401 }
      )
    }

    // Get user 2FA status
    const user = await payload.findByID({
      collection: 'users',
      id: userId,
      overrideAccess: true,
    }) as unknown as {
      twoFactorEnabled?: boolean
      twoFactorMethod?: TwoFactorMethod
    }

    return NextResponse.json({
      twoFactorEnabled: user.twoFactorEnabled || false,
      method: user.twoFactorMethod || null,
    })
  } catch (error) {
    console.error('[2FA Status] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
