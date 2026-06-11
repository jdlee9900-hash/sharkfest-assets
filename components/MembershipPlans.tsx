'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MEMBERSHIP_TIERS, type MemberPlan } from '@/lib/types'
import { PlanTicket, CommunityTicket } from '@/components/PlanTicket'

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
  isUpgrade?: boolean
  /** Plan the visitor picked before signing in — visually highlighted. */
  highlightPlan?: MemberPlan | null
}

export function MembershipPlans({ prices, discountPercent, isUpgrade = false, highlightPlan = null }: Props) {
  const router = useRouter()
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

  const handleCommunity = async () => {
    setLoading('community')
    setError('')
    try {
      const res = await fetch('/api/membership/community', { method: 'POST' })
      const body = await res.json()
      if (!res.ok) throw new Error(body.error ?? 'Could not sign up')
      router.push('/members?welcome=1')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setLoading(null)
    }
  }

  const paidTiers = MEMBERSHIP_TIERS.filter(t => !t.free)
  const communityTier = MEMBERSHIP_TIERS.find(t => t.free)

  return (
    <div className="join-plans">
      {isUpgrade && (
        <div className="join-upgrade-banner">
          <p className="join-upgrade-title">Upgrade your membership</p>
          <p className="join-upgrade-sub">You&apos;re currently a Community Member. Choose a paid plan to unlock the SharkFest festival discount and full member benefits.</p>
        </div>
      )}
      {error && (
        <div className="auth-error" role="alert" style={{ marginBottom: '1rem' }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          {error}
        </div>
      )}

      {/* Paid tiers */}
      <div className="tix-grid">
        {paidTiers.map(tier => {
          const amount = prices[tier.id as 'individual' | 'family']
          const highlighted = highlightPlan === tier.id
          return (
            <PlanTicket
              key={tier.id}
              tier={tier}
              amount={amount}
              highlighted={highlighted}
              savePercent={discountPercent}
            >
              <button
                className="btn btn-accent join-cta"
                onClick={() => handleJoin(tier.id)}
                disabled={loading !== null}
              >
                {loading === tier.id ? 'Redirecting…' : highlighted ? 'Continue — secure checkout' : 'Become a member'}
              </button>
            </PlanTicket>
          )
        })}
      </div>

      <p className="tix-fineprint">
        Billed monthly · Secure payment via Stripe · Cancel any time · Members save {discountPercent}% on SharkFest 2027 tickets
      </p>

      {/* Community (free) tier — only shown when not already a community member */}
      {communityTier && !isUpgrade && (
        <div className="tix-community-wrap">
          <div className="tix-divider">
            <span>or</span>
          </div>
          <CommunityTicket tier={communityTier} highlighted={highlightPlan === 'community'}>
            <button
              className="btn join-community-btn"
              onClick={handleCommunity}
              disabled={loading !== null}
            >
              {loading === 'community' ? 'Joining…' : 'Join for free'}
            </button>
          </CommunityTicket>
        </div>
      )}
    </div>
  )
}
