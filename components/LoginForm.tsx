'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useSearchParams } from 'next/navigation'

export function LoginForm({ defaultNext = '/my-booking' }: { defaultNext?: string }) {
  const searchParams = useSearchParams()
  const next = searchParams.get('next') ?? defaultNext
  const hasError = searchParams.get('error') === 'auth'
  // Members-branded variant when signing in to join or enter the members club.
  const members = next.startsWith('/members') || next.startsWith('/join')

  const [email, setEmail]     = useState('')
  const [sent, setSent]       = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(hasError ? 'That link has expired — please request a new one.' : '')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    setLoading(true)
    setError('')

    const supabase = createClient()
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`
    const { error: sbErr } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: { emailRedirectTo: redirectTo },
    })

    if (sbErr) {
      setError(sbErr.message)
      setLoading(false)
    } else {
      setSent(true)
      setLoading(false)
    }
  }

  return (
    <div className={`auth-card${members ? ' auth-card--members' : ''}`}>
      {members && <p className="auth-members-tag">Torbay Sharks · Membership</p>}
      <div className="auth-icon" aria-hidden="true">
        {members ? (
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
            <path d="M12 2 4 5v6c0 5 3.4 8.5 8 10 4.6-1.5 8-5 8-10V5l-8-3Z"/>
            <path d="m9 12 2 2 4-4"/>
          </svg>
        ) : (
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
            <rect x="2" y="4" width="20" height="16" rx="2"/>
            <path d="m22 7-10 7L2 7"/>
          </svg>
        )}
      </div>

      {sent ? (
        <>
          <h1 className="auth-title">Check your inbox</h1>
          <p className="auth-sub">
            We sent a magic link to <strong>{email}</strong>.<br />
            Click it to sign in — no password needed.
          </p>
          <p className="auth-hint">
            Didn&apos;t receive it? Check your spam folder or{' '}
            <button className="auth-link-btn" onClick={() => setSent(false)}>try again</button>.
          </p>
        </>
      ) : (
        <>
          <h1 className="auth-title">{members ? 'Members sign in' : 'Sign in to SharkFest'}</h1>
          <p className="auth-sub">
            {members
              ? 'Sign in to access exclusive content, your digital membership card and member ticket prices.'
              : "Enter your email and we'll send you a magic link."}
          </p>

          {error && (
            <div className="auth-error" role="alert">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            <label htmlFor="auth-email" className="cu-label">Email address</label>
            <input
              id="auth-email"
              type="email"
              className="cu-input"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
              autoFocus
            />
            <button
              type="submit"
              className="btn btn-accent auth-submit"
              disabled={loading || !email.trim()}
            >
              {loading ? 'Sending…' : 'Send magic link'}
            </button>
          </form>
        </>
      )}
    </div>
  )
}
