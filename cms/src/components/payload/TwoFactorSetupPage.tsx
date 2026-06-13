'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@payloadcms/ui'

const TWO_FA_SESSION_KEY = '2fa-session-expires'
const SESSION_DURATION_MS = 24 * 60 * 60 * 1000

type Step = 'choose-method' | 'authenticator-qr' | 'email-sent' | 'verify' | 'backup-codes' | 'done'
type Method = 'email' | 'authenticator'

export function TwoFactorSetupPage() {
  const { token } = useAuth()
  const [step, setStep] = useState<Step>('choose-method')
  const [method, setMethod] = useState<Method>('authenticator')
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [secret, setSecret] = useState<string | null>(null)
  const [backupCodes, setBackupCodes] = useState<string[]>([])
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleSetup = async (selectedMethod: Method) => {
    if (!token) return
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/auth/2fa/setup', {
        method: 'POST',
        headers: { Authorization: `JWT ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ method: selectedMethod }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Setup failed')
      setMethod(selectedMethod)
      if (selectedMethod === 'authenticator') {
        setQrCode(data.qrCode)
        setSecret(data.secret)
        setBackupCodes(data.backupCodes || [])
        setStep('authenticator-qr')
      } else {
        setStep('email-sent')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Setup failed')
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) return
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/auth/2fa/verify', {
        method: 'POST',
        headers: { Authorization: `JWT ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, method, isSetup: true }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Verification failed')
      localStorage.setItem(TWO_FA_SESSION_KEY, String(Date.now() + SESSION_DURATION_MS))
      setStep(method === 'authenticator' ? 'backup-codes' : 'done')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed')
    } finally {
      setIsLoading(false)
    }
  }

  const copySecret = () => {
    if (secret) {
      navigator.clipboard.writeText(secret)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  /* ── choose method ─────────────────────────────────── */
  if (step === 'choose-method') {
    return (
      <div className="tfa-page">
        <div className="tfa-card">
          <h1 className="tfa-title">Set Up Two-Factor Authentication</h1>
          <p className="tfa-desc">Choose how you&apos;d like to receive verification codes</p>
          {error && <div className="tfa-error">{error}</div>}

          <button onClick={() => handleSetup('authenticator')} disabled={isLoading} className="tfa-method-btn">
            <span className="tfa-method-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="5" y="2" width="14" height="20" rx="2" />
                <line x1="12" y1="18" x2="12" y2="18" strokeLinecap="round" strokeWidth="2" />
              </svg>
            </span>
            <div>
              <div className="tfa-method-label">Authenticator App</div>
              <div className="tfa-method-sublabel">Google Authenticator, Authy, or similar</div>
            </div>
          </button>

          <button onClick={() => handleSetup('email')} disabled={isLoading} className="tfa-method-btn">
            <span className="tfa-method-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </span>
            <div>
              <div className="tfa-method-label">Email</div>
              <div className="tfa-method-sublabel">Receive codes via email</div>
            </div>
          </button>
        </div>

        <style>{tfaStyles}</style>
      </div>
    )
  }

  /* ── authenticator QR ──────────────────────────────── */
  if (step === 'authenticator-qr') {
    return (
      <div className="tfa-page">
        <div className="tfa-card">
          <h1 className="tfa-title">Scan QR Code</h1>
          <p className="tfa-desc">Open your authenticator app and scan this code</p>

          {qrCode && (
            <div className="tfa-qr-wrap">
              <img src={qrCode} alt="2FA QR Code" className="tfa-qr" />
            </div>
          )}

          {secret && (
            <>
              <p className="tfa-hint">Can&apos;t scan? Enter this code manually:</p>
              <div className="tfa-secret-row">
                <code className="tfa-secret">{secret}</code>
                <button onClick={copySecret} className="tfa-btn tfa-btn--secondary tfa-btn--small">
                  {copied ? '✓ Copied' : 'Copy'}
                </button>
              </div>
            </>
          )}

          <button onClick={() => setStep('verify')} className="tfa-btn tfa-btn--primary">
            I&apos;ve scanned the code →
          </button>
          <button onClick={() => setStep('choose-method')} className="tfa-btn tfa-btn--link">← Back</button>
        </div>
        <style>{tfaStyles}</style>
      </div>
    )
  }

  /* ── email sent ────────────────────────────────────── */
  if (step === 'email-sent') {
    return (
      <div className="tfa-page">
        <div className="tfa-card">
          <h1 className="tfa-title">Check Your Email</h1>
          <p className="tfa-desc">A 6-digit verification code has been sent to your email address</p>

          <button onClick={() => setStep('verify')} className="tfa-btn tfa-btn--primary">Enter Code →</button>

          <button
            onClick={async () => {
              setError(null)
              setIsLoading(true)
              try {
                const res = await fetch('/api/auth/2fa/send-email-code', {
                  method: 'POST',
                  headers: { Authorization: `JWT ${token}`, 'Content-Type': 'application/json' },
                })
                if (!res.ok) {
                  const data = await res.json()
                  throw new Error(data.error || 'Failed to resend')
                }
              } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to resend code')
              } finally {
                setIsLoading(false)
              }
            }}
            disabled={isLoading}
            className="tfa-btn tfa-btn--link"
          >
            {isLoading ? 'Sending…' : 'Resend code'}
          </button>

          <button onClick={() => setStep('choose-method')} className="tfa-btn tfa-btn--link">← Back</button>
          {error && <div className="tfa-error">{error}</div>}
        </div>
        <style>{tfaStyles}</style>
      </div>
    )
  }

  /* ── verify code ───────────────────────────────────── */
  if (step === 'verify') {
    return (
      <div className="tfa-page">
        <div className="tfa-card">
          <h1 className="tfa-title">Verify Your Code</h1>
          <p className="tfa-desc">
            {method === 'authenticator'
              ? 'Enter the 6-digit code from your authenticator app'
              : 'Enter the 6-digit code sent to your email'}
          </p>

          <form onSubmit={handleVerify}>
            <input
              type="text"
              inputMode="numeric"
              value={code}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setCode(e.target.value.replace(/\D/g, '').slice(0, 6))
              }
              placeholder="000000"
              maxLength={6}
              autoFocus
              autoComplete="one-time-code"
              className="tfa-code-input"
            />
            {error && <div className="tfa-error">{error}</div>}
            <button
              type="submit"
              disabled={isLoading || code.length < 6}
              className="tfa-btn tfa-btn--primary"
            >
              {isLoading ? 'Verifying…' : 'Verify & Enable 2FA'}
            </button>
          </form>

          <button onClick={() => setStep(method === 'authenticator' ? 'authenticator-qr' : 'email-sent')} className="tfa-btn tfa-btn--link">
            ← Back
          </button>
        </div>
        <style>{tfaStyles}</style>
      </div>
    )
  }

  /* ── backup codes ──────────────────────────────────── */
  if (step === 'backup-codes') {
    return (
      <div className="tfa-page">
        <div className="tfa-card">
          <h1 className="tfa-title">Save Your Backup Codes</h1>
          <p className="tfa-desc">
            Store these codes somewhere safe. Each can only be used once if you lose access to your authenticator app.
          </p>
          <div className="tfa-backup-grid">
            {backupCodes.map((bc: string) => (
              <code key={bc} className="tfa-backup-code">{bc}</code>
            ))}
          </div>
          <button onClick={() => setStep('done')} className="tfa-btn tfa-btn--primary">
            I&apos;ve saved my codes →
          </button>
        </div>
        <style>{tfaStyles}</style>
      </div>
    )
  }

  /* ── done ───────────────────────────────────────────── */
  return (
    <div className="tfa-page">
      <div className="tfa-card" style={{ textAlign: 'center' }}>
        <div className="tfa-success-icon">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h1 className="tfa-title">Two-Factor Authentication Enabled</h1>
        <p className="tfa-desc">Your account is now protected with an additional layer of security.</p>
        <Link href="/admin" className="tfa-btn tfa-btn--primary" style={{ display: 'block', textDecoration: 'none' }}>
          Continue to Dashboard
        </Link>
      </div>
      <style>{tfaStyles}</style>
    </div>
  )
}

/* ── Payload-themed styles ─────────────────────────────────────────────────── */
const tfaStyles = `
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

  .tfa-hint {
    font-size: 0.8125rem;
    color: var(--theme-elevation-500);
    margin: 0 0 0.5rem;
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

  /* ── Method selection buttons ────────── */
  .tfa-method-btn {
    display: flex;
    align-items: center;
    gap: 1rem;
    width: 100%;
    padding: 1rem 1.25rem;
    background: transparent;
    border: 1px solid var(--theme-elevation-150);
    border-radius: 4px;
    color: var(--theme-text);
    cursor: pointer;
    font-size: 0.875rem;
    margin-bottom: 0.75rem;
    text-align: left;
    transition: border-color 0.15s, background 0.15s;
    font-family: inherit;
  }

  .tfa-method-btn:hover:not(:disabled) {
    border-color: var(--theme-elevation-250);
    background: var(--theme-elevation-50);
  }

  .tfa-method-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .tfa-method-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border-radius: 4px;
    background: var(--theme-elevation-100);
    color: var(--theme-elevation-500);
    flex-shrink: 0;
  }

  .tfa-method-label {
    font-weight: 600;
    font-size: 0.9375rem;
    color: var(--theme-text);
  }

  .tfa-method-sublabel {
    font-size: 0.8125rem;
    color: var(--theme-elevation-450);
    margin-top: 2px;
  }

  /* ── Buttons ────────────────────────── */
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
    margin-top: 1rem;
  }

  .tfa-btn--primary:hover {
    opacity: 0.9;
  }

  .tfa-btn--primary:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .tfa-btn--secondary {
    background: var(--theme-elevation-150);
    color: var(--theme-text);
  }

  .tfa-btn--secondary:hover {
    background: var(--theme-elevation-200);
  }

  .tfa-btn--small {
    width: auto;
    padding: 0.375rem 0.75rem;
    font-size: 0.8125rem;
    border-radius: 4px;
    white-space: nowrap;
  }

  .tfa-btn--link {
    background: none;
    color: var(--theme-elevation-450);
    padding: 0.625rem;
    margin-top: 0.25rem;
    font-size: 0.8125rem;
  }

  .tfa-btn--link:hover {
    color: var(--theme-text);
  }

  /* ── Code input ─────────────────────── */
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

  /* ── QR code ────────────────────────── */
  .tfa-qr-wrap {
    text-align: center;
    margin: 1.5rem 0;
  }

  .tfa-qr {
    display: block;
    margin: 0 auto;
    width: 200px;
    height: 200px;
    border-radius: 4px;
    border: 1px solid var(--theme-elevation-150);
  }

  /* ── Secret key ─────────────────────── */
  .tfa-secret-row {
    display: flex;
    gap: 0.5rem;
    align-items: center;
    margin-bottom: 1.5rem;
  }

  .tfa-secret {
    flex: 1;
    padding: 0.625rem;
    background: var(--theme-elevation-100);
    border-radius: 4px;
    font-size: 0.75rem;
    letter-spacing: 0.1em;
    word-break: break-all;
    font-family: var(--font-mono, monospace);
    color: var(--theme-text);
  }

  /* ── Backup codes grid ──────────────── */
  .tfa-backup-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.5rem;
    margin: 1.5rem 0;
    padding: 1rem;
    background: var(--theme-elevation-50);
    border: 1px solid var(--theme-elevation-150);
    border-radius: 4px;
  }

  .tfa-backup-code {
    font-size: 0.875rem;
    letter-spacing: 0.1em;
    font-family: var(--font-mono, monospace);
    color: var(--theme-text);
    padding: 0.25rem 0;
  }

  /* ── Success icon ───────────────────── */
  .tfa-success-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 56px;
    height: 56px;
    border-radius: 50%;
    background: var(--theme-elevation-100);
    color: var(--theme-text);
    margin-bottom: 1.25rem;
  }
`
