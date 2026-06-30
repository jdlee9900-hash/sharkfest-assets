'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useSearchParams } from 'next/navigation'
import { PasskeyLogin } from '@/components/PasskeyLogin'

export function LoginForm({ defaultNext = '/my-booking' }: { defaultNext?: string }) {
  const searchParams = useSearchParams()
  const next = searchParams.get('next') ?? defaultNext
  const hasError = searchParams.get('error') === 'auth'
  // Members-branded variant when signing in to join or enter the members club.
  const joining = next.startsWith('/join')
  const members = next.startsWith('/members') || joining

  const [email, setEmail]       = useState('')
  const [sent, setSent]         = useState(false)
  const [code, setCode]         = useState('')
  const [verifying, setVerifying] = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState(hasError ? 'That link has expired — please request a new one.' : '')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    setLoading(true)
    setError('')

    const supabase = createClient()
    // Send a one-time code (not a clickable link). Email link scanners — most
    // notably Outlook / Microsoft Defender "Safe Links" — pre-fetch links and
    // burn the single-use token before the user clicks. A typed code can't be
    // consumed by a scanner, so it's reliable across all mail providers.
    const { error: sbErr } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
    })

    if (sbErr) {
      setError(sbErr.message)
      setLoading(false)
    } else {
      setSent(true)
      setLoading(false)
    }
  }

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    const token = code.trim()
    if (!token) return
    setVerifying(true)
    setError('')

    const supabase = createClient()
    const { error: sbErr } = await supabase.auth.verifyOtp({
      email: email.trim().toLowerCase(),
      token,
      type: 'email',
    })

    if (sbErr) {
      setError(sbErr.message)
      setVerifying(false)
      return
    }

    // Session cookies are now set — run the same account linking the magic-link
    // callback does, then continue to the destination.
    await fetch('/api/auth/post-otp', { method: 'POST' }).catch(() => {})
    window.location.href = next
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
          <h1 className="auth-title">Enter your code</h1>
          <p className="auth-sub">
            We sent a 6-digit code to <strong>{email}</strong>.<br />
            {joining
              ? 'Enter it below and you’ll come straight back here to choose your plan.'
              : 'Enter it below to sign in — no password needed.'}
          </p>

          {error && (
            <div className="auth-error" role="alert">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {error}
            </div>
          )}

          <form onSubmit={handleVerify} className="auth-form">
            <label htmlFor="auth-code" className="cu-label">6-digit code</label>
            <input
              id="auth-code"
              type="text"
              className="cu-input"
              placeholder="123456"
              value={code}
              onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              required
              autoFocus
              autoComplete="one-time-code"
              inputMode="numeric"
              maxLength={6}
            />
            <button
              type="submit"
              className="btn btn-accent auth-submit"
              disabled={verifying || code.trim().length < 6}
            >
              {verifying ? 'Verifying…' : 'Verify & sign in'}
            </button>
          </form>

          <p className="auth-hint">
            Didn&apos;t receive it? Check your spam folder or{' '}
            <button className="auth-link-btn" onClick={() => { setSent(false); setCode(''); setError('') }}>try again</button>.
          </p>
        </>
      ) : (
        <>
          <h1 className="auth-title">
            {joining ? 'Ready to join?' : members ? 'Members sign in' : 'Sign in to SharkFest'}
          </h1>
          <p className="auth-sub">
            {joining
              ? "New or returning — enter your email and we'll send you a secure link. No password, no forms. You'll pick your membership plan right after."
              : members
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

          {/* New joiners won't have a passkey yet — lead with email for them,
              and with the faster passkey path for returning members. */}
          {!joining && (
            <>
              <PasskeyLogin />
              <div className="passkey-divider"><span>or</span></div>
            </>
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
              // On /join the form sits at the bottom of a long page — autofocus
              // would scroll past all the membership info on load.
              autoFocus={!joining}
            />
            <button
              type="submit"
              className="btn btn-accent auth-submit"
              disabled={loading || !email.trim()}
            >
              {loading ? 'Sending…' : 'Send magic link'}
            </button>
          </form>

          {joining && (
            <>
              <div className="passkey-divider"><span>returning member?</span></div>
              <PasskeyLogin />
            </>
          )}
        </>
      )}
    </div>
  )
}
