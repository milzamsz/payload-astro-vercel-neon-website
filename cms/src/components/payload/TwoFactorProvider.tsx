'use client'

import React, { useEffect, useSyncExternalStore } from 'react'
import { useAuth } from '@payloadcms/ui'

// localStorage key for client-side 2FA session tracking
const TWO_FA_SESSION_KEY = '2fa-session-expires'

type GateState = {
  canRender: boolean
  redirectTo?: string
}

const subscribeToClientReady = () => () => {}
const getClientReadySnapshot = () => true
const getServerReadySnapshot = () => false

function getTwoFactorGateState(user: unknown): GateState {
  if (!user) {
    return { canRender: true }
  }

  const u = user as Record<string, unknown>
  const twoFactorEnabled = u.twoFactorEnabled as boolean | undefined

  if (!twoFactorEnabled) {
    return { canRender: true }
  }

  // Already on a 2FA page, so allow the setup/verification UI to render.
  if (window.location.pathname.startsWith('/admin/2fa')) {
    return { canRender: true }
  }

  const twoFactorMethod = u.twoFactorMethod as string | null | undefined

  // If setup was reset by an admin, ignore stale localStorage sessions.
  if (!twoFactorMethod) {
    return { canRender: false, redirectTo: '/admin/2fa-setup' }
  }

  const storedExpiry = Number.parseInt(localStorage.getItem(TWO_FA_SESSION_KEY) || '0', 10)
  const isVerified = storedExpiry > Date.now()

  if (!isVerified) {
    return { canRender: false, redirectTo: '/admin/2fa' }
  }

  return { canRender: true }
}

export function TwoFactorProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const isClient = useSyncExternalStore(
    subscribeToClientReady,
    getClientReadySnapshot,
    getServerReadySnapshot,
  )
  const gateState = isClient ? getTwoFactorGateState(user) : { canRender: false }

  useEffect(() => {
    if (gateState.redirectTo && window.location.pathname !== gateState.redirectTo) {
      window.location.href = gateState.redirectTo
    }
  }, [gateState.redirectTo])

  // Block rendering until we've confirmed the user doesn't need 2FA.
  if (!gateState.canRender) {
    return null
  }

  return <>{children}</>
}
