'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { MemberPlan } from '@/lib/types'

export function AdminCompMembership() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [plan, setPlan] = useState<MemberPlan>('annual')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')

  const submit = async (action: 'grant' | 'revoke') => {
    if (!email.trim()) return
    setBusy(true); setError(''); setMsg('')
    try {
      const res = await fetch('/api/admin/comp-membership', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, email: email.trim(), plan }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Something went wrong')
      setMsg(action === 'grant' ? `Comp membership granted to ${email.trim()}.` : `Comp membership revoked for ${email.trim()}.`)
      if (action === 'revoke') setEmail('')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className="mb-card" onSubmit={e => { e.preventDefault(); submit('grant') }} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
      <h2 className="mb-card-title">Comp a membership</h2>
      <p style={{ color: 'var(--grey-400)', fontSize: '0.875rem', margin: 0 }}>
        Grant a free membership without Stripe — for committee, staff or giveaways. The
        person must have logged in at least once so an account exists.
      </p>

      <div>
        <label htmlFor="comp-email" className="cu-label">Member email</label>
        <input id="comp-email" type="email" className="cu-input" value={email} onChange={e => setEmail(e.target.value)} placeholder="name@example.com" required />
      </div>

      <div className="join-toggle" role="tablist" aria-label="Plan" style={{ alignSelf: 'flex-start' }}>
        <button type="button" role="tab" aria-selected={plan === 'annual'} className={`join-toggle-btn ${plan === 'annual' ? 'is-active' : ''}`} onClick={() => setPlan('annual')}>Annual</button>
        <button type="button" role="tab" aria-selected={plan === 'monthly'} className={`join-toggle-btn ${plan === 'monthly' ? 'is-active' : ''}`} onClick={() => setPlan('monthly')}>Monthly</button>
      </div>

      {error && <div className="auth-error" role="alert">{error}</div>}
      {msg && <p style={{ color: '#16a34a', fontSize: '0.875rem', margin: 0 }}>{msg}</p>}

      <div style={{ display: 'flex', gap: '0.625rem', flexWrap: 'wrap' }}>
        <button type="submit" className="btn btn-accent" disabled={busy || !email.trim()}>
          {busy ? 'Working…' : 'Grant membership'}
        </button>
        <button type="button" className="btn" disabled={busy || !email.trim()} onClick={() => submit('revoke')} style={{ border: '1px solid var(--grey-300, #cbd5e1)', color: 'var(--grey-500, #475569)', background: 'transparent' }}>
          Revoke comp
        </button>
      </div>
    </form>
  )
}
