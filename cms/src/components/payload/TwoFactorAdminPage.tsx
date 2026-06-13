'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { useAuth } from '@payloadcms/ui'

const TWO_FA_SESSION_KEY = '2fa-session-expires'
const SESSION_DURATION_MS = 24 * 60 * 60 * 1000 // 24 hours

export function TwoFactorAdminPage() {
  const { user, token } = useAuth()
  const [code, setCode] = useState('')
  const [useBackupCode, setUseBackupCode] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSendingEmail, setIsSendingEmail] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [emailSent, setEmailSent] = useState(false)
  const autoEmailSendAttempted = useRef(false)

  const method = (user as Record<string, unknown> | null)?.twoFactorMethod as 'email' | 'authenticator' | undefined

  const sendEmailCode = useCallback(async () => {
    if (!token || isSendingEmail) return
    setIsSendingEmail(true)
    setError(null)
    try {
      const res = await fetch('/api/auth/2fa/send-email-code', {
        method: 'POST',
        headers: {
          Authorization: `JWT ${token}`,
          'Content-Type': 'application/json',
        },
      })
      if (res.ok) {
        setEmailSent(true)
      }
    } catch {
      // silently fail — user can use the resend button
    } finally {
      setIsSendingEmail(false)
    }
  }, [token, isSendingEmail])

  // Auto-send email code on page load for email method
  useEffect(() => {
    if (method === 'email' && token && !emailSent && !autoEmailSendAttempted.current) {
      autoEmailSendAttempted.current = true
      const timeoutId = window.setTimeout(() => {
        void sendEmailCode()
      }, 0)

      return () => window.clearTimeout(timeoutId)
    }
  }, [method, token, emailSent, sendEmailCode])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    if (useBackupCode) {
      const cleaned = value.toUpperCase().replace(/[^A-Z0-9]/g, '')
      if (cleaned.length <= 8) {
        setCode(cleaned.length > 4 ? `${cleaned.slice(0, 4)}-${cleaned.slice(4)}` : cleaned)
      }
    } else {
      setCode(value.replace(/\D/g, '').slice(0, 6))
    }
  }

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()

    const minLength = useBackupCode ? 8 : 6
    if (!code || code.replace('-', '').length < minLength) {
      setError(useBackupCode ? 'Please enter a valid backup code (XXXX-XXXX)' : 'Please enter a valid 6-digit code')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/auth/2fa/validate', {
        method: 'POST',
        headers: {
          Authorization: `JWT ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code, useBackupCode }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Verification failed')
      }

      // Mark 2FA session as verified in localStorage for the provider check
      localStorage.setItem(TWO_FA_SESSION_KEY, String(Date.now() + SESSION_DURATION_MS))
      window.location.href = '/admin'
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed')
    } finally {
      setIsLoading(false)
    }
  }

  const toggleBackupCode = () => {
    setUseBackupCode((prev) => !prev)
    setCode('')
    setError(null)
  }

  return (
    <div className="tfa-page">
      <div className="tfa-card">
        <h1 className="tfa-title">
          {useBackupCode ? 'Enter Backup Code' : 'Two-Factor Authentication'}
        </h1>
        <p className="tfa-desc">
          {useBackupCode
            ? 'Use one of your saved backup codes to access your account'
            : method === 'email'
              ? emailSent
                ? 'A 6-digit code has been sent to your email'
                : 'Sending verification code to your email…'
              : 'Enter the 6-digit code from your authenticator app'}
        </p>

        <form onSubmit={handleVerify}>
          <input
            type="text"
            inputMode={useBackupCode ? 'text' : 'numeric'}
            value={code}
            onChange={handleInputChange}
            placeholder={useBackupCode ? 'XXXX-XXXX' : '000000'}
            maxLength={useBackupCode ? 9 : 6}
            autoFocus
            autoComplete="one-time-code"
            className="tfa-code-input"
          />

          {error && <div className="tfa-error">{error}</div>}

          <button
            type="submit"
            disabled={isLoading || code.replace('-', '').length < (useBackupCode ? 8 : 6)}
            className="tfa-btn tfa-btn--primary"
          >
            {isLoading ? 'Verifying…' : 'Verify'}
          </button>
        </form>

        <div className="tfa-footer">
          <button type="button" onClick={toggleBackupCode} className="tfa-footer-link">
            {useBackupCode ? 'Use regular code' : 'Use backup code'}
          </button>

          {method === 'email' && !useBackupCode && (
            <button
              type="button"
              onClick={() => { setEmailSent(false); sendEmailCode() }}
              disabled={isSendingEmail}
              className="tfa-footer-link"
            >
              {isSendingEmail ? 'Sending…' : 'Resend code'}
            </button>
          )}
        </div>

        <div className="tfa-setup-link-wrap">
          <Link href="/admin/2fa-setup" className="tfa-footer-link">
            Need to set up 2FA first?
          </Link>
        </div>
      </div>

      <style>{tfaAdminStyles}</style>
    </div>
  )
}

const tfaAdminStyles = `
  .tfa-page {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem;
  }

  .tfa-card {
    width: 100%;
    max-width: 460px;
    text-align: center;
  }

  .tfa-title {
    font-size: 1.5rem;
    font-weight: 600;
    color: var(--theme-text);
    margin: 0 0 0.5rem;
    line-height: 1.3;
  }

  .tfa-desc {
    font-size: 0.875rem;
    color: var(--theme-elevation-500);
    margin: 0 0 1.5rem;
    line-height: 1.5;
  }

  .tfa-error {
    padding: 0.75rem 1rem;
    background: var(--theme-error-100, #2d1215);
    border: 1px solid var(--theme-error-500, #e25050);
    color: var(--theme-error-500, #e25050);
    border-radius: 4px;
    font-size: 0.8125rem;
    margin-bottom: 1rem;
    line-height: 1.4;
  }

  .tfa-code-input {
    width: 100%;
    padding: 0.875rem 1rem;
    font-size: 1.5rem;
    text-align: center;
    letter-spacing: 0.4em;
    border: 1px solid var(--theme-elevation-150);
    border-radius: 0;
    background: var(--theme-input-bg, transparent);
    color: var(--theme-text);
    outline: none;
    box-sizing: border-box;
    margin-bottom: 1rem;
    font-family: inherit;
    transition: border-color 0.15s;
  }

  .tfa-code-input:focus {
    border-color: var(--theme-text);
  }

  .tfa-code-input::placeholder {
    color: var(--theme-elevation-250);
  }

  .tfa-btn {
    display: block;
    width: 100%;
    padding: 0.875rem 1.25rem;
    border: none;
    border-radius: 0;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    text-align: center;
    transition: background 0.15s, opacity 0.15s;
    font-family: inherit;
    line-height: 1.4;
    box-sizing: border-box;
  }

  .tfa-btn--primary {
    background: var(--theme-text);
    color: var(--theme-bg);
  }

  .tfa-btn--primary:hover {
    opacity: 0.9;
  }

  .tfa-btn--primary:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .tfa-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 1px solid var(--theme-elevation-100);
  }

  .tfa-footer-link {
    background: none;
    border: none;
    color: var(--theme-elevation-450);
    font-size: 0.8125rem;
    cursor: pointer;
    padding: 0;
    font-family: inherit;
    text-decoration: none;
    transition: color 0.15s;
  }

  .tfa-footer-link:hover {
    color: var(--theme-text);
  }

  .tfa-footer-link:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .tfa-setup-link-wrap {
    text-align: center;
    margin-top: 0.75rem;
  }
`
