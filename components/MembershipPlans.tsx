'use client'

import { useState } from 'react'
import { formatAmount } from '@/lib/types'

// Only ever hand off to a genuine Stripe Checkout URL (mirrors MyBookingView).
function redirectToStripe(url: unknown) {
  if (typeof url !== 'string') throw new Error('Payment setup failed')
  const parsed = new URL(url)
  if (parsed.protocol !== 'https:' || !/(^|\.)stripe\.com$/.test(parsed.hostname)) {
    throw new Error('Payment setup failed')
  }
  window.location.href = url
}

interface Props {
  prices: { monthly: number | null; annual: number | null }
  discountPercent: number
}

export function MembershipPlans({ prices, discountPercent }: Props) {
  const [plan, setPlan] = useState<'monthly' | 'annual'>('annual')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleJoin = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/membership/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      })
      const body = await res.json()
      if (!res.ok) throw new Error(body.error ?? 'Could not start checkout')
      redirectToStripe(body.url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setLoading(false)
    }
  }

  const priceLabel = (p: number | null, suffix: string) =>
    p != null ? <><span className="join-plan-amount">{formatAmount(p)}</span><span className="join-plan-per">{suffix}</span></> : <span className="join-plan-amount">—</span>

  return (
    <div className="join-plans">
      <div className="join-toggle" role="tablist" aria-label="Billing period">
        <button
          role="tab"
          aria-selected={plan === 'monthly'}
          className={`join-toggle-btn ${plan === 'monthly' ? 'is-active' : ''}`}
          onClick={() => setPlan('monthly')}
        >
          Monthly
        </button>
        <button
          role="tab"
          aria-selected={plan === 'annual'}
          className={`join-toggle-btn ${plan === 'annual' ? 'is-active' : ''}`}
          onClick={() => setPlan('annual')}
        >
          Annual <span className="join-toggle-save">best value</span>
        </button>
      </div>

      <div className="join-plan-card">
        <p className="join-plan-name">{plan === 'annual' ? 'Annual membership' : 'Monthly membership'}</p>
        <p className="join-plan-price">
          {plan === 'annual' ? priceLabel(prices.annual, '/year') : priceLabel(prices.monthly, '/month')}
        </p>
        <p className="join-plan-note">
          {plan === 'annual'
            ? 'Billed once a year — the best value, and you stay a member straight through to SharkFest 2028.'
            : 'Billed monthly. Cancel any time from your members area.'}
        </p>

        {error && (
          <div className="auth-error" role="alert" style={{ marginTop: '0.25rem' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            {error}
          </div>
        )}

        <button className="btn btn-accent join-cta" onClick={handleJoin} disabled={loading}>
          {loading ? 'Redirecting…' : 'Become a member'}
        </button>
        <p className="join-plan-fineprint">
          Secure payment via Stripe · Cancel any time · Members save {discountPercent}% on SharkFest 2028 tickets
        </p>
      </div>
    </div>
  )
}
