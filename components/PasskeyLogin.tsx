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
    <div>
      <button
        className={`btn passkey-btn${className ? ` ${className}` : ''}`}
        onClick={handleLogin}
        disabled={status === 'loading'}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          aria-hidden="true"
        >
          <path d="M12 11c0-1.1.9-2 2-2s2 .9 2 2v1" />
          <path d="M5 12a7 7 0 1 1 14 0c0 4-2 6-2 6H7s-2-2-2-6Z" />
          <path d="M9 21h6" />
          <path d="M10 17v4" />
          <path d="M14 17v4" />
        </svg>
        {status === 'loading' ? 'Authenticating…' : 'Sign in with Face ID / Touch ID'}
      </button>
      {status === 'error' && errorMsg && (
        <div role="alert" className="passkey-error">
          <p className="passkey-error-msg">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            {errorMsg}
          </p>
          <p className="passkey-error-hint">Use the email option below to sign in instead.</p>
        </div>
      )}
    </div>
  )
}
