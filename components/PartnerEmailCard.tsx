'use client'

import { useState } from 'react'

interface Props {
  initial: string | null
  /** Visual variant — "card" wraps in .mb-card, "inline" renders bare for embedding */
  variant?: 'card' | 'inline'
}

export function PartnerEmailCard({ initial, variant = 'card' }: Props) {
  const [email, setEmail]   = useState(initial ?? '')
  const [saved, setSaved]   = useState(initial ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')
  const [done, setDone]     = useState(false)

  const dirty = email.trim().toLowerCase() !== saved.trim().toLowerCase()

  const handleSave = async () => {
    setSaving(true); setError(''); setDone(false)
    try {
      const res = await fetch('/api/my-booking/partner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ partner_email: email.trim() }),
      })
      const body = await res.json()
      if (!res.ok) throw new Error(body.error ?? 'Could not save')
      const next = body.partner_email ?? ''
      setEmail(next); setSaved(next); setDone(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  const handleClear = async () => {
    setSaving(true); setError(''); setDone(false)
    try {
      const res = await fetch('/api/my-booking/partner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ partner_email: '' }),
      })
      const body = await res.json()
      if (!res.ok) throw new Error(body.error ?? 'Could not remove')
      setEmail(''); setSaved(''); setDone(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  const inner = (
    <>
      <h2 className="mb-card-title">Shared booking access</h2>
      <p className="mb-camp-intro">
        Add a second email to share this booking and the members area. They&apos;ll
        receive an invite and can log in via magic link — perfect for a partner or
        another member of your party.
      </p>

      <div className="mb-partner-row">
        <div style={{ flex: 1 }}>
          <input
            type="email"
            className="cu-input"
            placeholder="partner@example.com"
            value={email}
            onChange={e => { setEmail(e.target.value); setDone(false) }}
          />
        </div>
        <button
          className="btn btn-accent mb-pay-btn"
          onClick={handleSave}
          disabled={saving || !dirty || !email.trim()}
        >
          {saving ? 'Saving…' : saved ? 'Update & re-invite' : 'Invite'}
        </button>
        {saved && (
          <button
            className="btn btn-dark mb-pay-btn"
            onClick={handleClear}
            disabled={saving}
          >
            Remove
          </button>
        )}
      </div>

      {error && (
        <div className="auth-error" role="alert" style={{ marginTop: '0.75rem' }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          {error}
        </div>
      )}

      {done && !dirty && (
        <div className="mb-camp-saved" style={{ marginTop: '0.75rem' }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6 9 17l-5-5"/></svg>
          {saved ? `Invite sent to ${saved}` : 'Partner access removed'}
        </div>
      )}

      {saved && !done && (
        <p className="mb-partner-hint">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          {saved} has shared access to this booking.
        </p>
      )}
    </>
  )

  if (variant === 'inline') return <div>{inner}</div>
  return <div className="mb-card">{inner}</div>
}
