import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import crypto from 'crypto'
import {
  verifyTOTPToken,
  isEmailCodeExpired,
  verifyBackupCode,
  generateEmailCode,
  getEmailCodeExpiry,
  sendTwoFactorEmailCode,
  type TwoFactorMethod,
} from '@/utilities/twoFactorAuth'

// Store pending 2FA sessions (in production, use Redis)
const pending2FASessions = new Map<string, {
  userId: string | number
  email: string
  method: TwoFactorMethod
  expiresAt: number
  payloadToken: string
}>()

// Cleanup expired sessions every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    for (const [token, session] of pending2FASessions.entries()) {
      if (now > session.expiresAt) {
        pending2FASessions.delete(token)
      }
    }
  }, 5 * 60 * 1000)
}

/**
 * POST /api/auth/2fa/login
 * Step 1: Authenticate with credentials and check if 2FA is required
 * Body: { email: string, password: string }
 * Returns: { requires2FA: boolean, pendingToken?: string, method?: TwoFactorMethod }
 */
export async function POST(request: NextRequest) {
  try {
    const payload = await getPayload({ config })
    const body = await request.json()
    const { email, password }: { email: string; password: string } = body

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Attempt login with Payload
    let loginResult
    try {
      loginResult = await payload.login({
        collection: 'users',
        data: { email, password },
      })
    } catch {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    if (!loginResult.user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    const user = loginResult.user as unknown as {
      id: string | number
      email: string
      twoFactorEnabled?: boolean
      twoFactorMethod?: TwoFactorMethod
      twoFactorSecret?: string | null
    }

    // Check if 2FA is enabled
    if (!user.twoFactorEnabled) {
      // No 2FA required, return the token directly
      return NextResponse.json({
        success: true,
        requires2FA: false,
        token: loginResult.token,
        user: {
          id: user.id,
          email: user.email,
        },
      })
    }

    // 2FA is required - create a pending session
    const pendingToken = crypto.randomBytes(32).toString('hex')
    const expiresAt = Date.now() + 10 * 60 * 1000 // 10 minutes

    pending2FASessions.set(pendingToken, {
      userId: user.id,
      email: user.email,
      method: user.twoFactorMethod || 'email',
      expiresAt,
      payloadToken: loginResult.token!,
    })

    // If email method, send the code now
    if (user.twoFactorMethod === 'email') {
      const emailCode = generateEmailCode()
      const codeExpiry = getEmailCodeExpiry()

      // Store the code in user record
      await payload.update({
        collection: 'users',
        id: user.id,
        data: {
          twoFactorEmailCode: emailCode,
          twoFactorEmailCodeExpiresAt: codeExpiry,
        },
        overrideAccess: true,
      })

      // Send email
      await sendTwoFactorEmailCode({
        payload,
        email: user.email,
        code: emailCode,
      })
    }

    return NextResponse.json({
      success: true,
      requires2FA: true,
      pendingToken,
      method: user.twoFactorMethod || 'email',
    })
  } catch (error) {
    console.error('[2FA Login] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/auth/2fa/login
 * Step 2: Verify 2FA code and complete login
 * Body: { pendingToken: string, code: string, useBackupCode?: boolean }
 * Returns: { success: boolean, token?: string }
 */
export async function PUT(request: NextRequest) {
  try {
    const payload = await getPayload({ config })
    const body = await request.json()
    const { pendingToken, code, useBackupCode = false }: {
      pendingToken: string
      code: string
      useBackupCode?: boolean
    } = body

    if (!pendingToken || !code) {
      return NextResponse.json(
        { error: 'Pending token and code are required' },
        { status: 400 }
      )
    }

    // Verify pending token
    const session = pending2FASessions.get(pendingToken)
    if (!session) {
      return NextResponse.json(
        { error: 'Session expired or invalid' },
        { status: 401 }
      )
    }

    if (Date.now() > session.expiresAt) {
      pending2FASessions.delete(pendingToken)
      return NextResponse.json(
        { error: 'Session expired' },
        { status: 401 }
      )
    }

    // Get user with 2FA details (context.internal bypasses field hooks that hide secrets)
    const user = await payload.findByID({
      collection: 'users',
      id: session.userId,
      overrideAccess: true,
      context: { internal: true },
    }) as unknown as {
      id: string | number
      email: string
      twoFactorSecret?: string | null
      twoFactorBackupCodes?: { hash: string }[] | null
      twoFactorEmailCode?: string | null
      twoFactorEmailCodeExpiresAt?: string | null
    }

    let isValid = false

    if (useBackupCode) {
      // Verify backup code
      const backupCodes = user.twoFactorBackupCodes?.map((bc) => bc.hash) || []
      isValid = verifyBackupCode(code, backupCodes)

      if (isValid) {
        // Remove used backup code
        const normalizedCode = code.toUpperCase().replace(/\s/g, '')
        const hashHex = crypto.createHash('sha256').update(normalizedCode).digest('hex')
        const remainingCodes = user.twoFactorBackupCodes?.filter((bc) => bc.hash !== hashHex) || []

        await payload.update({
          collection: 'users',
          id: session.userId,
          data: {
            twoFactorBackupCodes: remainingCodes,
          },
          overrideAccess: true,
        })
      }
    } else if (session.method === 'authenticator') {
      if (!user.twoFactorSecret) {
        return NextResponse.json(
          { error: '2FA not properly configured' },
          { status: 400 }
        )
      }
      isValid = verifyTOTPToken(code, user.twoFactorSecret)
    } else if (session.method === 'email') {
      if (isEmailCodeExpired(user.twoFactorEmailCodeExpiresAt)) {
        return NextResponse.json(
          { error: 'Code has expired. Please request a new code.' },
          { status: 400 }
        )
      }
      isValid = code === user.twoFactorEmailCode

      // Clear the used code
      if (isValid) {
        await payload.update({
          collection: 'users',
          id: session.userId,
          data: {
            twoFactorEmailCode: null,
            twoFactorEmailCodeExpiresAt: null,
          },
          overrideAccess: true,
        })
      }
    }

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid verification code' },
        { status: 400 }
      )
    }

    // 2FA verified - return the Payload token that was stored at initial login
    const payloadToken = session.payloadToken
    pending2FASessions.delete(pendingToken)

    return NextResponse.json({
      success: true,
      token: payloadToken,
    })
  } catch (error) {
    console.error('[2FA Login Verify] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/auth/2fa/login
 * Resend email code for pending session
 * Body: { pendingToken: string }
 */
export async function DELETE(request: NextRequest) {
  try {
    const payload = await getPayload({ config })
    const body = await request.json()
    const { pendingToken }: { pendingToken: string } = body

    const session = pending2FASessions.get(pendingToken)
    if (!session || Date.now() > session.expiresAt) {
      return NextResponse.json(
        { error: 'Session expired or invalid' },
        { status: 401 }
      )
    }

    if (session.method !== 'email') {
      return NextResponse.json(
        { error: 'Can only resend for email method' },
        { status: 400 }
      )
    }

    // Generate new code
    const emailCode = generateEmailCode()
    const codeExpiry = getEmailCodeExpiry()

    await payload.update({
      collection: 'users',
      id: session.userId,
      data: {
        twoFactorEmailCode: emailCode,
        twoFactorEmailCodeExpiresAt: codeExpiry,
      },
      overrideAccess: true,
    })

    await sendTwoFactorEmailCode({
      payload,
      email: session.email,
      code: emailCode,
    })

    return NextResponse.json({
      success: true,
      message: 'Code resent successfully',
    })
  } catch (error) {
    console.error('[2FA Resend] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
