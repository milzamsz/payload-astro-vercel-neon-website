import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import crypto from 'crypto'
import { isEmailCodeExpired, verifyBackupCode, verifyTOTPToken } from '@/utilities/twoFactorAuth'

const TWO_FA_SESSION_DURATION_MS = 24 * 60 * 60 * 1000 // 24 hours

/**
 * POST /api/auth/2fa/validate
 * Verify a 2FA code for an already-authenticated user (admin session gating).
 * Called by TwoFactorAdminPage after Payload's own login completes.
 * On success, stamps twoFactorSessionExpires in the user record.
 *
 * Body: { code: string, useBackupCode?: boolean }
 */
export async function POST(request: NextRequest) {
  try {
    const payload = await getPayload({ config })
    const body = await request.json()
    const { code, useBackupCode = false }: { code: string; useBackupCode?: boolean } = body

    if (!code || typeof code !== 'string') {
      return NextResponse.json({ error: 'Verification code is required' }, { status: 400 })
    }

    // Authenticate via JWT header (user is already logged into Payload)
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('JWT ')) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    let userId: string | number
    try {
      const verified = await payload.auth({ headers: request.headers })
      if (!verified.user) {
        return NextResponse.json({ error: 'Invalid authentication' }, { status: 401 })
      }
      userId = verified.user.id
    } catch {
      return NextResponse.json({ error: 'Invalid authentication' }, { status: 401 })
    }

    // Fetch user with sensitive 2FA fields (context.internal bypasses field hooks)
    const user = await payload.findByID({
      collection: 'users',
      id: userId,
      overrideAccess: true,
      context: { internal: true },
    }) as unknown as {
      id: string | number
      twoFactorEnabled?: boolean
      twoFactorMethod?: 'email' | 'authenticator'
      twoFactorSecret?: string | null
      twoFactorBackupCodes?: { hash: string }[] | null
      twoFactorEmailCode?: string | null
      twoFactorEmailCodeExpiresAt?: string | null
    }

    if (!user.twoFactorEnabled) {
      return NextResponse.json({ error: '2FA is not enabled for this account' }, { status: 400 })
    }

    let isValid = false

    if (useBackupCode) {
      const hashes = user.twoFactorBackupCodes?.map((bc) => bc.hash) || []
      isValid = verifyBackupCode(code, hashes)

      if (isValid) {
        // Remove the used backup code
        const normalizedCode = code.toUpperCase().replace(/\s/g, '')
        const usedHash = crypto.createHash('sha256').update(normalizedCode).digest('hex')
        const remaining = user.twoFactorBackupCodes?.filter((bc) => bc.hash !== usedHash) || []
        await payload.update({
          collection: 'users',
          id: userId,
          data: { twoFactorBackupCodes: remaining },
          overrideAccess: true,
        })
      }
    } else if (user.twoFactorMethod === 'authenticator') {
      if (!user.twoFactorSecret) {
        return NextResponse.json({ error: '2FA not properly configured' }, { status: 400 })
      }
      isValid = verifyTOTPToken(code, user.twoFactorSecret)
    } else if (user.twoFactorMethod === 'email') {
      if (isEmailCodeExpired(user.twoFactorEmailCodeExpiresAt)) {
        return NextResponse.json(
          { error: 'Code has expired. Please request a new code.' },
          { status: 400 },
        )
      }
      isValid = code === user.twoFactorEmailCode

      if (isValid) {
        await payload.update({
          collection: 'users',
          id: userId,
          data: { twoFactorEmailCode: null, twoFactorEmailCodeExpiresAt: null },
          overrideAccess: true,
        })
      }
    } else {
      return NextResponse.json({ error: '2FA method not configured' }, { status: 400 })
    }

    if (!isValid) {
      return NextResponse.json({ error: 'Invalid verification code' }, { status: 400 })
    }

    // Stamp the session expiry in the DB (audit trail)
    await payload.update({
      collection: 'users',
      id: userId,
      data: { twoFactorSessionExpires: Date.now() + TWO_FA_SESSION_DURATION_MS },
      overrideAccess: true,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[2FA Validate] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
