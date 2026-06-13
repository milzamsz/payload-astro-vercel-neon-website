import type { Payload, PayloadRequest } from 'payload'
import crypto from 'crypto'
import * as QRCode from 'qrcode'

import { getEffectiveEmailSettings } from './emailSettings'
import { buildTwoFactorEmailHtml, stripHtml } from './emailTemplates'

// ── Base32 helpers (RFC 4648) ─────────────────────────────────────────────────
const BASE32_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'

function base32Encode(buffer: Buffer): string {
  let result = ''
  let bits = 0
  let current = 0
  for (const byte of buffer) {
    current = (current << 8) | byte
    bits += 8
    while (bits >= 5) {
      bits -= 5
      result += BASE32_CHARS[(current >>> bits) & 31]
    }
  }
  if (bits > 0) result += BASE32_CHARS[(current << (5 - bits)) & 31]
  return result
}

function base32Decode(str: string): Buffer {
  str = str.toUpperCase().replace(/[^A-Z2-7]/g, '')
  const result: number[] = []
  let bits = 0
  let current = 0
  for (const char of str) {
    const value = BASE32_CHARS.indexOf(char)
    if (value === -1) continue
    current = (current << 5) | value
    bits += 5
    while (bits >= 8) {
      bits -= 8
      result.push((current >>> bits) & 255)
    }
  }
  return Buffer.from(result)
}

// ── Types ─────────────────────────────────────────────────────────────────────
export type TwoFactorMethod = 'email' | 'authenticator' | null

// ── Constants ─────────────────────────────────────────────────────────────────
const EMAIL_CODE_EXPIRY_MINUTES = 10

// ── TOTP ──────────────────────────────────────────────────────────────────────

/**
 * Generate a TOTP secret for authenticator app setup (20 random bytes, base32-encoded)
 */
export function generateTOTPSecret(): string {
  return base32Encode(crypto.randomBytes(20))
}

/**
 * Generate the otpauth:// URL used for QR code scanning
 */
export function generateOTPAuthUrl({
  secret,
  email,
  issuer = 'Kebun Kumara',
}: {
  secret: string
  email: string
  issuer?: string
}): string {
  const encodedIssuer = encodeURIComponent(issuer)
  const encodedEmail = encodeURIComponent(email)
  return `otpauth://totp/${encodedIssuer}:${encodedEmail}?secret=${secret}&issuer=${encodedIssuer}&algorithm=SHA1&digits=6&period=30`
}

/**
 * Generate a QR code data URL from an otpauth:// URL
 */
export async function generateQRCodeDataUrl(otpAuthUrl: string): Promise<string> {
  return QRCode.toDataURL(otpAuthUrl)
}

/**
 * Verify a TOTP token per RFC 4226/6238 (SHA1, 6 digits, 30s window, ±1 drift).
 * Uses only Node.js built-in crypto — no external library.
 */
export function verifyTOTPToken(token: string, secret: string): boolean {
  try {
    const timeStep = Math.floor(Date.now() / 1000 / 30)
    const secretBuffer = base32Decode(secret)

    for (let offset = -1; offset <= 1; offset++) {
      const counter = timeStep + offset
      const counterBuffer = Buffer.alloc(8)
      counterBuffer.writeBigUInt64BE(BigInt(counter), 0)

      const hmac = crypto.createHmac('sha1', secretBuffer)
      hmac.update(counterBuffer)
      const hash = hmac.digest()

      // RFC 4226 dynamic truncation: 4 bytes starting at the dynamic offset
      const byteOffset = hash[hash.length - 1] & 0x0f
      const code = (
        ((hash[byteOffset] & 0x7f) << 24) |
        ((hash[byteOffset + 1] & 0xff) << 16) |
        ((hash[byteOffset + 2] & 0xff) << 8) |
        (hash[byteOffset + 3] & 0xff)
      ) % 1_000_000

      if (token === code.toString().padStart(6, '0')) return true
    }
    return false
  } catch {
    return false
  }
}

// ── Backup codes ──────────────────────────────────────────────────────────────

/**
 * Generate N backup codes in XXXX-XXXX format
 */
export function generateBackupCodes(count = 8): string[] {
  return Array.from({ length: count }, () => {
    const hex = crypto.randomBytes(4).toString('hex').toUpperCase()
    return `${hex.slice(0, 4)}-${hex.slice(4, 8)}`
  })
}

/**
 * Hash backup codes for storage — only hashes are ever persisted
 */
export function hashBackupCodes(codes: string[]): string[] {
  return codes.map((code) => crypto.createHash('sha256').update(code).digest('hex'))
}

/**
 * Verify a backup code against stored SHA-256 hashes
 */
export function verifyBackupCode(code: string, hashedCodes: string[]): boolean {
  const normalized = code.toUpperCase().replace(/\s/g, '')
  const hash = crypto.createHash('sha256').update(normalized).digest('hex')
  return hashedCodes.includes(hash)
}

// ── Email codes ───────────────────────────────────────────────────────────────

/**
 * Generate a 6-digit numeric email verification code
 */
export function generateEmailCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

/**
 * Return an ISO timestamp 10 minutes from now
 */
export function getEmailCodeExpiry(): string {
  return new Date(Date.now() + EMAIL_CODE_EXPIRY_MINUTES * 60 * 1000).toISOString()
}

/**
 * Return true if the email code expiry timestamp has passed
 */
export function isEmailCodeExpired(expiresAt: string | null | undefined): boolean {
  if (!expiresAt) return true
  return new Date(expiresAt).getTime() < Date.now()
}

/**
 * Send a 2FA email code via the configured Payload email adapter
 */
export async function sendTwoFactorEmailCode({
  payload,
  req,
  email,
  code,
}: {
  payload: Payload
  req?: PayloadRequest | null
  email: string
  code: string
}): Promise<boolean> {
  try {
    const settings = await getEffectiveEmailSettings({ payload, req })

    if (!settings.enabled || !settings.fromEmail) {
      payload.logger.warn('Email not configured, cannot send 2FA code')
      return false
    }

    const html = buildTwoFactorEmailHtml({ code, settings })

    await payload.sendEmail({
      from: `"${settings.fromName}" <${settings.fromEmail}>`,
      to: email,
      subject: 'Your Two-Factor Authentication Code - Kebun Kumara',
      html,
      text: stripHtml(html),
    })

    return true
  } catch (error) {
    payload.logger.error(`Failed to send 2FA email: ${String(error)}`)
    return false
  }
}
