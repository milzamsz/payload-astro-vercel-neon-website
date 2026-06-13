import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import {
  verifyTOTPToken,
  isEmailCodeExpired,
  verifyBackupCode,
  type TwoFactorMethod,
} from '@/utilities/twoFactorAuth'

/**
 * POST /api/auth/2fa/verify
 * Verify 2FA code during setup or login
 * Body: { code: string, method?: 'email' | 'authenticator', isSetup?: boolean }
 */
export async function POST(request: NextRequest) {
  try {
    const payload = await getPayload({ config })
    const body = await request.json()
    const { code, method, isSetup = false, useBackupCode = false }: {
      code: string
      method?: TwoFactorMethod
      isSetup?: boolean
      useBackupCode?: boolean
    } = body

    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        { error: 'Verification code is required' },
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

    // Get user with 2FA fields (context.internal bypasses field hooks that hide secrets)
    const user = await payload.findByID({
      collection: 'users',
      id: userId,
      overrideAccess: true,
      context: { internal: true },
    }) as unknown as {
      id: string | number
      email: string
      twoFactorEnabled?: boolean
      twoFactorMethod?: TwoFactorMethod
      twoFactorSecret?: string | null
      twoFactorBackupCodes?: { hash: string }[] | null
      twoFactorEmailCode?: string | null
      twoFactorEmailCodeExpiresAt?: string | null
    }

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const twoFactorMethod = method || user.twoFactorMethod

    // Handle backup code verification
    if (useBackupCode) {
      const backupCodes = user.twoFactorBackupCodes?.map((bc) => bc.hash) || []
      if (!verifyBackupCode(code, backupCodes)) {
        return NextResponse.json(
          { error: 'Invalid backup code' },
          { status: 400 }
        )
      }

      // Remove used backup code
      const remainingCodes = backupCodes.filter(
        (hash) => !verifyBackupCode(code, [hash])
      )

      await payload.update({
        collection: 'users',
        id: userId,
        data: {
          twoFactorBackupCodes: remainingCodes.map((hash) => ({ hash })),
        },
        overrideAccess: true,
      })

      return NextResponse.json({
        success: true,
        message: 'Backup code accepted',
        remainingBackupCodes: remainingCodes.length,
      })
    }

    // Verify based on method
    let isValid = false

    if (twoFactorMethod === 'authenticator') {
      if (!user.twoFactorSecret) {
        return NextResponse.json(
          { error: '2FA not properly configured' },
          { status: 400 }
        )
      }
      isValid = verifyTOTPToken(code, user.twoFactorSecret)
    } else if (twoFactorMethod === 'email') {
      if (isEmailCodeExpired(user.twoFactorEmailCodeExpiresAt)) {
        return NextResponse.json(
          { error: 'Code has expired. Please request a new code.' },
          { status: 400 }
        )
      }
      isValid = code === user.twoFactorEmailCode
    } else {
      return NextResponse.json(
        { error: 'Invalid 2FA method' },
        { status: 400 }
      )
    }

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid verification code' },
        { status: 400 }
      )
    }

    // If this is setup verification, enable 2FA
    if (isSetup) {
      await payload.update({
        collection: 'users',
        id: userId,
        data: {
          twoFactorEnabled: true,
          twoFactorEmailCode: null,
          twoFactorEmailCodeExpiresAt: null,
        },
        overrideAccess: true,
        context: { skipTwoFactorReset: true },
      })

      return NextResponse.json({
        success: true,
        message: 'Two-factor authentication enabled successfully',
        twoFactorEnabled: true,
      })
    }

    // Regular login verification
    return NextResponse.json({
      success: true,
      message: 'Verification successful',
    })
  } catch (error) {
    console.error('[2FA Verify] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
