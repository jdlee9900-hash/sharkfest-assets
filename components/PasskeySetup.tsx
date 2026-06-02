'use client'

import { useState } from 'react'
import { startRegistration } from '@simplewebauthn/browser'

interface Props {
  hasPasskey: boolean
}

export function PasskeySetup({ hasPasskey }: Props) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const handleSetup = async () => {
    setStatus('loading')
    setErrorMsg('')

    try {
      const optRes = await fetch('/api/auth/webauthn/register-options', { method: 'POST' })
      if (!optRes.ok) {
        const d = await optRes.json().catch(() => ({}))
        throw new Error(d.error ?? 'Failed to get registration options')
      }
      const options = await optRes.json()

      let credential
      try {
        credential = await startRegistration({ optionsJSON: options })
      } catch (err) {
        if (err instanceof Error && err.name === 'NotAllowedError') {
          setStatus('idle')
          return
        }
        throw err
      }

      const verRes = await fetch('/api/auth/webauthn/register-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credential),
      })
      if (!verRes.ok) {
        const d = await verRes.json().catch(() => ({}))
        throw new Error(d.error ?? 'Verification failed')
      }

      setStatus('done')
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong')
      setStatus('error')
    }
  }

  return (
    <div className="passkey-setup">
      {status === 'done' ? (
        <p className="passkey-done">
          Biometric login is set up — use it next time you sign in.
        </p>
      ) : (
        <>
          <button
            className="btn passkey-btn"
            onClick={handleSetup}
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
            {status === 'loading'
              ? 'Setting up…'
              : hasPasskey
              ? 'Manage biometric login'
              : 'Set up Face ID / Touch ID login'}
          </button>
          {status === 'error' && errorMsg && (
            <p className="passkey-error" role="alert" style={{ fontSize: '0.8125rem', color: 'var(--red-500)', margin: '0.4rem 0 0' }}>
              {errorMsg}
            </p>
          )}
        </>
      )}
    </div>
  )
}
