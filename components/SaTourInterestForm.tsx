'use client'

import { useState } from 'react'

export function SaTourInterestForm() {
  const [name, setName]       = useState('')
  const [email, setEmail]     = useState('')
  const [adults, setAdults]   = useState('2')
  const [kids, setKids]       = useState('0')
  const [hp, setHp]           = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError]     = useState('')
  const [ref, setRef]         = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) { setError('Please enter your full name.'); return }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setError('Please enter a valid email address.'); return }
    setError('')
    setSending(true)
    try {
      const res = await fetch('/api/sa-tour/interest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, adults, kids, company: hp }),
      })
      const body = await res.json()
      if (!res.ok) throw new Error(body.error ?? 'Something went wrong — please try again.')
      setRef(body.ref)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong — please try again.')
    } finally {
      setSending(false)
    }
  }

  if (ref) {
    const firstName = name.trim().split(' ')[0]
    return (
      <div className="sa-register-card">
        <div className="sa-register-success">
          <span className="sa-success-badge"><span className="sa-pulse-dot" aria-hidden="true" />You&apos;re on the list</span>
          <h4>See you in Durban{firstName ? `, ${firstName}` : ''}.</h4>
          <p>We&apos;ll be in touch with ground-package pricing and flight windows. Tell the rest of the family to pack for the bush.</p>
          <span className="sa-ref">REF {ref}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="sa-register-card">
      <form onSubmit={handleSubmit} noValidate>
        <h4>SA Tour 2028 — Interest list</h4>
        <p className="sa-card-sub">No payment now. We&apos;ll come back with ground-package pricing once flight options firm up.</p>

        {error && (
          <div className="auth-error" role="alert" style={{ marginBottom: '0.875rem' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            {error}
          </div>
        )}

        {/* Honeypot: hidden from users, attractive to bots. */}
        <input
          type="text" name="company" value={hp} onChange={e => setHp(e.target.value)}
          tabIndex={-1} autoComplete="off" aria-hidden="true"
          style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, opacity: 0 }}
        />

        <div className="cu-field">
          <label htmlFor="sa-name" className="cu-label">Full name</label>
          <input id="sa-name" type="text" className="cu-input" required
            value={name} onChange={e => setName(e.target.value)} autoComplete="name" />
        </div>
        <div className="cu-field">
          <label htmlFor="sa-email" className="cu-label">Email</label>
          <input id="sa-email" type="email" className="cu-input" required
            value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" />
        </div>
        <div className="sa-row-2">
          <div className="cu-field">
            <label htmlFor="sa-adults" className="cu-label">Adults</label>
            <select id="sa-adults" className="cu-input" value={adults} onChange={e => setAdults(e.target.value)}>
              {['1','2','3','4','5','6'].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <div className="cu-field">
            <label htmlFor="sa-kids" className="cu-label">Kids</label>
            <select id="sa-kids" className="cu-input" value={kids} onChange={e => setKids(e.target.value)}>
              {['0','1','2','3','4'].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
        </div>
        <button className="btn btn-accent sa-submit" type="submit" disabled={sending}>
          {sending ? 'Sending…' : 'Register interest'}
        </button>
        <p className="sa-fine">We&apos;ll only use this to talk to you about the tour. Family rooms and three-bed units throughout — kids very welcome.</p>
      </form>
    </div>
  )
}
