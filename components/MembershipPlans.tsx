'use client'

import { useState } from 'react'
import { formatAmount, MEMBERSHIP_TIERS, type MemberPlan } from '@/lib/types'

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
  prices: { individual: number | null; family: number | null }
  discountPercent: number
}

export function MembershipPlans({ prices, discountPercent }: Props) {
  const [loading, setLoading] = useState<MemberPlan | null>(null)
  const [error, setError] = useState('')

  const handleJoin = async (plan: MemberPlan) => {
    setLoading(plan)
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
      setLoading(null)
    }
  }

  return (
    <div className="join-plans">
      {error && (
        <div className="auth-error" role="alert" style={{ marginBottom: '1rem' }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          {error}
        </div>
      )}

      <div className="join-tiers">
        {MEMBERSHIP_TIERS.map(tier => {
          const amount = prices[tier.id]
          return (
            <div className="join-plan-card join-tier-card" key={tier.id}>
              <p className="join-plan-name">{tier.label}</p>
              <p className="join-plan-price">
                {amount != null
                  ? <><span className="join-plan-amount">{formatAmount(amount)}</span><span className="join-plan-per">/month</span></>
                  : <span className="join-plan-amount">—</span>}
              </p>
              <p className="join-plan-note">{tier.tagline}</p>
              <button
                className="btn btn-accent join-cta"
                onClick={() => handleJoin(tier.id)}
                disabled={loading !== null}
              >
                {loading === tier.id ? 'Redirecting…' : 'Become a member'}
              </button>
            </div>
          )
        })}
      </div>

      <p className="join-plan-fineprint">
        Billed monthly · Secure payment via Stripe · Cancel any time · Members save {discountPercent}% on SharkFest 2027 tickets
      </p>
    </div>
  )
}
