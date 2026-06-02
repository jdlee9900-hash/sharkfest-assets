'use client'

import { useState } from 'react'
import { startAuthentication } from '@simplewebauthn/browser'

interface Props {
  className?: string
}

export function PasskeyLogin({ className }: Props) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const handleLogin = async () => {
    setStatus('loading')
    setErrorMsg('')

    try {
      const optRes = await fetch('/api/auth/webauthn/login-options', { method: 'POST' })
      if (!optRes.ok) {
        const d = await optRes.json().catch(() => ({}))
        throw new Error(d.error ?? 'Failed to get authentication options')
      }
      const options = await optRes.json()

      let credential
      try {
        credential = await startAuthentication({ optionsJSON: options })
      } catch (err) {
        if (err instanceof Error && err.name === 'NotAllowedError') {
          setStatus('idle')
          return
        }
        throw err
      }

      const verRes = await fetch('/api/auth/webauthn/login-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credential),
      })
      if (!verRes.ok) {
        const d = await verRes.json().catch(() => ({}))
        throw new Error(d.error ?? 'Authentication failed')
      }

      const data = await verRes.json()
      window.location.href = data.redirect
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong')
      setStatus('error')
    }
  }

  return (
    <div className={`passkey-login-wrap${className ? ` ${className}` : ''}`}>
      <button
        className="passkey-login-btn"
        onClick={handleLogin}
        disabled={status === 'loading'}
        aria-label="Sign in with biometrics"
      >
        <span className="passkey-login-icon" aria-hidden="true">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
            <path d="M12 10a2 2 0 0 1 2 2v1"/>
            <path d="M5 12a7 7 0 1 1 14 0c0 4-2 6-2 6H7s-2-2-2-6Z"/>
            <path d="M9 21h6"/><path d="M10 17v4"/><path d="M14 17v4"/>
          </svg>
        </span>
        <span className="passkey-login-text">
          <span className="passkey-login-title">
            {status === 'loading' ? 'Authenticating…' : 'Sign in with Face ID / Touch ID'}
          </span>
          <span className="passkey-login-sub">Use your device biometrics — no email needed</span>
        </span>
      </button>
      {status === 'error' && errorMsg && (
        <p role="alert" className="passkey-login-error">{errorMsg}</p>
      )}
    </div>
  )
}

