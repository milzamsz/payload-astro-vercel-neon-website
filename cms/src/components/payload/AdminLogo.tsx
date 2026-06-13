'use client'

import { branding } from '@/lib/site'

type AdminLogoProps = {
  className?: string
}

export function AdminLogo({ className }: AdminLogoProps) {
  return (
    <div
      className={className}
      style={{
        alignItems: 'center',
        display: 'flex',
        gap: '10px',
        justifyContent: 'center',
        width: '100%',
      }}
    >
      <span
        style={{
          alignItems: 'center',
          background: 'var(--theme-elevation-1000, #111)',
          borderRadius: '8px',
          color: 'var(--theme-elevation-0, #fff)',
          display: 'inline-flex',
          height: '40px',
          justifyContent: 'center',
          width: '40px',
        }}
        aria-hidden
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ height: '22px', width: '22px' }}
        >
          <polygon points="12 2 15 8 22 9 17 14 18 21 12 17.8 6 21 7 14 2 9 9 8 12 2" />
        </svg>
      </span>
      <span
        style={{
          fontFamily: 'serif',
          fontSize: '1.15rem',
          fontWeight: 500,
          letterSpacing: '-0.01em',
          lineHeight: 1,
        }}
      >
        {branding.siteName}
      </span>
    </div>
  )
}
