import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import {
  generateTOTPSecret,
  generateOTPAuthUrl,
  generateQRCodeDataUrl,
  generateBackupCodes,
  hashBackupCodes,
  generateEmailCode,
  getEmailCodeExpiry,
  sendTwoFactorEmailCode,
  type TwoFactorMethod,
} from '@/utilities/twoFactorAuth'

/**
 * POST /api/auth/2fa/setup
 * Initialize 2FA setup for a user
 * Body: { method: 'email' | 'authenticator' }
 * Returns: Setup data (QR code for authenticator, or confirmation for email)
 */
export async function POST(request: NextRequest) {
  try {
    const payload = await getPayload({ config })
    const body = await request.json()
    const { method }: { method: TwoFactorMethod } = body

    if (!method || (method !== 'email' && method !== 'authenticator')) {
      return NextResponse.json(
        { error: 'Invalid 2FA method. Must be "email" or "authenticator"' },
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

    const token = authHeader.slice(4)
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

    // Get user details
    const user = await payload.findByID({
      collection: 'users',
      id: userId,
      overrideAccess: true,
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    if (method === 'authenticator') {
      // Generate TOTP secret and QR code
      const secret = generateTOTPSecret()
      const otpAuthUrl = generateOTPAuthUrl({
        secret,
        email: user.email,
        issuer: 'Northstar IT Services',
      })
      const qrCodeDataUrl = await generateQRCodeDataUrl(otpAuthUrl)

      // Generate backup codes
      const backupCodes = generateBackupCodes(8)
      const hashedBackupCodes = hashBackupCodes(backupCodes)

      // Store setup data temporarily (not enabled yet - needs verification)
      await payload.update({
        collection: 'users',
        id: userId,
        data: {
          twoFactorSecret: secret,
          twoFactorMethod: 'authenticator',
          twoFactorEnabled: false, // Not enabled until verified
          twoFactorBackupCodes: hashedBackupCodes.map((hash) => ({ hash })),
        },
        overrideAccess: true,
        context: { skipTwoFactorReset: true },
      })

      return NextResponse.json({
        success: true,
        method: 'authenticator',
        qrCode: qrCodeDataUrl,
        secret, // Show secret for manual entry
        backupCodes, // Only shown once during setup
      })
    } else {
      // Email-based 2FA
      const emailCode = generateEmailCode()
      const codeExpiry = getEmailCodeExpiry()

      // Store setup data
      await payload.update({
        collection: 'users',
        id: userId,
        data: {
          twoFactorMethod: 'email',
          twoFactorEnabled: false, // Not enabled until verified
          twoFactorEmailCode: emailCode,
          twoFactorEmailCodeExpiresAt: codeExpiry,
        },
        overrideAccess: true,
        context: { skipTwoFactorReset: true },
      })

      // Send verification email
      const emailSent = await sendTwoFactorEmailCode({
        payload,
        email: user.email,
        code: emailCode,
      })

      if (!emailSent) {
        return NextResponse.json(
          { error: 'Failed to send verification email' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        method: 'email',
        message: 'Verification code sent to your email',
      })
    }
  } catch (error) {
    console.error('[2FA Setup] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
