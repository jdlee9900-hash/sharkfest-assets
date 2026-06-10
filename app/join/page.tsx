import Image from 'next/image'
import Link from 'next/link'
import type { Metadata } from 'next'
import { Suspense } from 'react'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'
import { getActiveMembership, memberPriceId, memberDiscountPercent } from '@/lib/membership'
import { formatAmount, MEMBERSHIP_TIERS, type MemberPlan } from '@/lib/types'
import { LoginForm } from '@/components/LoginForm'
import { MembershipPlans } from '@/components/MembershipPlans'
import { SignOutButton } from '@/components/SignOutButton'

export const metadata: Metadata = {
  title: 'Become a member · SharkFest',
}

// Look up the real recurring prices so the page shows accurate amounts.
async function fetchPrices(): Promise<{ individual: number | null; family: number | null }> {
  const key = process.env.STRIPE_SECRET_KEY
  const individualId = memberPriceId('individual')
  const familyId = memberPriceId('family')
  if (!key || (!individualId && !familyId)) return { individual: null, family: null }
  const stripe = new Stripe(key)
  const get = async (id: string | null) => {
    if (!id) return null
    try {
      const price = await stripe.prices.retrieve(id)
      return price.unit_amount ?? null
    } catch {
      return null
    }
  }
  const [individual, family] = await Promise.all([get(individualId), get(familyId)])
  return { individual, family }
}

const BENEFITS = [
  { icon: '🎟️', title: 'Members-only festival', body: 'SharkFest 2027 is exclusive to members — your membership unlocks registration, with a discount applied automatically to your booking.' },
  { icon: '⚡', title: 'First access to 2027', body: 'Members get first access when signups open for our 25th anniversary festival.' },
  { icon: '📸', title: 'Exclusive content', body: 'Behind-the-scenes stories, photos and updates between festivals.' },
  { icon: '💳', title: 'Digital membership card', body: 'Your own branded membership pass, ready on your phone.' },
  { icon: '🎉', title: 'Members events', body: 'Invitations to socials and gatherings through the year.' },
  { icon: '🦈', title: 'Back the club', body: 'Your membership directly supports Torbay Sharks RFC and keeps SharkFest going.' },
]

const STEPS = [
  { num: '1', title: 'Confirm your email', body: 'New or returning, just enter your email — we send you a secure link. No password needed.' },
  { num: '2', title: 'Choose your plan', body: 'Pick Individual/Couple, Family, or join free as a Community Member. Paid plans check out securely via Stripe.' },
  { num: '3', title: "You're in", body: 'Your members area unlocks straight away — and with a paid plan, so does SharkFest 2027 registration.' },
]

function isPlan(value: string | undefined): value is MemberPlan {
  return value === 'individual' || value === 'family' || value === 'community'
}

export default async function JoinPage({ searchParams }: { searchParams: Promise<{ plan?: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const isLoggedIn = !!user
  const membership = user ? await getActiveMembership(user.id) : null
  const prices = await fetchPrices()
  const discount = memberDiscountPercent()
  const { plan: planParam } = await searchParams
  const chosenPlan = isPlan(planParam) ? planParam : null

  const paidTiers = MEMBERSHIP_TIERS.filter(t => !t.free)
  const communityTier = MEMBERSHIP_TIERS.find(t => t.free)

  return (
    <>
      <header className="rc-header">
        <Link href="/" className="rc-header-logo" aria-label="Back to SharkFest">
          <Image src="/logo.png" alt="Torbay Sharks RFC" width={36} height={36} />
          <span>SharkFest</span>
        </Link>
        <nav className="rc-header-nav" aria-label="Site navigation">
          {membership ? (
            <>
              <Link href="/members" className="btn btn-accent" style={{ fontSize: '0.8125rem', height: '2.25rem', padding: '0 1.125rem' }}>Members area</Link>
              <SignOutButton className="rc-header-signout" />
            </>
          ) : isLoggedIn ? (
            <>
              <Link href="/my-booking" style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--grey-400)' }}>My booking</Link>
              <SignOutButton className="rc-header-signout" />
            </>
          ) : (
            <Link href="#signin" style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--grey-400)' }}>Sign in</Link>
          )}
        </nav>
      </header>

      <main className="join-wrap">
        <section className="join-hero">
          <p className="join-eyebrow">Torbay Sharks · Membership</p>
          <h1 className="join-title">Stay part of SharkFest, all year round</h1>
          <p className="join-lede">
            SharkFest 2026 is done and 2027 — our 25th anniversary — is confirmed. Membership
            is your way in: registration for the festival is exclusive to members, with the
            community kept alive all year round.
          </p>
        </section>

        <section className="join-benefits" aria-label="Membership benefits">
          {BENEFITS.map(b => (
            <div className="relive-card join-benefit" key={b.title}>
              <span className="join-benefit-icon" aria-hidden="true">{b.icon}</span>
              <p className="relive-card-title join-benefit-title">{b.title}</p>
              <p className="relive-card-body">{b.body}</p>
            </div>
          ))}
        </section>

        {membership && membership.plan !== 'community' ? (
          <section className="join-action">
            <div className="join-already">
              <p className="join-already-title">You&apos;re already a member 🦈</p>
              <p className="join-already-sub">Thanks for supporting the club.</p>
              <Link href="/members" className="btn btn-accent join-cta">Go to members area</Link>
            </div>
          </section>
        ) : user ? (
          <section className="join-action join-action--plans" id="plans">
            <h2 className="join-section-title">Choose your membership</h2>
            <MembershipPlans
              prices={prices}
              discountPercent={discount}
              isUpgrade={membership?.plan === 'community'}
              highlightPlan={chosenPlan}
            />
          </section>
        ) : (
          <>
            {/* Logged out: show every plan with real prices and full benefits
                up front — choosing one leads into the email sign-in step. */}
            <section className="join-action join-action--plans" id="plans">
              <h2 className="join-section-title">Choose your membership</h2>
              <div className="join-plans">
                <div className="join-tiers">
                  {paidTiers.map(tier => {
                    const amount = prices[tier.id as 'individual' | 'family']
                    return (
                      <div className="join-plan-card join-tier-card" key={tier.id}>
                        <p className="join-plan-name">{tier.label}</p>
                        <p className="join-plan-price">
                          {amount != null
                            ? <><span className="join-plan-amount">{formatAmount(amount)}</span><span className="join-plan-per">/month</span></>
                            : <span className="join-plan-amount">—</span>}
                        </p>
                        <p className="join-plan-note">{tier.tagline}</p>
                        <ul className="join-perks">
                          {tier.perks.map(p => <li key={p}>{p}</li>)}
                        </ul>
                        <Link href={`/join?plan=${tier.id}#signin`} className="btn btn-accent join-cta">
                          Join as {tier.label}
                        </Link>
                      </div>
                    )
                  })}
                </div>
                <p className="join-plan-fineprint">
                  Billed monthly · Secure payment via Stripe · Cancel any time · Members save {discount}% on SharkFest 2027 tickets
                </p>
                {communityTier && (
                  <div className="join-community-tier">
                    <div className="join-community-divider"><span>or</span></div>
                    <div className="join-plan-card join-community-card">
                      <div className="join-community-header">
                        <p className="join-plan-name">{communityTier.label}</p>
                        <span className="join-community-badge">Free</span>
                      </div>
                      <p className="join-plan-note" style={{ margin: '0 0 1rem' }}>{communityTier.tagline}</p>
                      <ul className="join-community-perks">
                        {communityTier.perks.map(p => <li key={p}>{p}</li>)}
                      </ul>
                      <p className="join-community-no-discount">Does not include the SharkFest festival discount — upgrade any time.</p>
                      <Link href={`/join?plan=community#signin`} className="btn join-community-btn" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        Join for free
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </section>

            <section className="join-steps-wrap" aria-label="How joining works">
              <h2 className="join-section-title">How it works</h2>
              <div className="join-steps">
                {STEPS.map(s => (
                  <div className="join-step" key={s.num}>
                    <span className="join-step-num" aria-hidden="true">{s.num}</span>
                    <p className="join-step-title">{s.title}</p>
                    <p className="join-step-body">{s.body}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="join-action" id="signin">
              <Suspense fallback={<div className="auth-card" style={{ minHeight: 260 }} />}>
                {/* Send them back to /join (with their chosen plan remembered) after
                    sign-in so they land on the plan picker to finish joining. */}
                <LoginForm defaultNext={chosenPlan ? `/join?plan=${chosenPlan}` : '/join'} />
              </Suspense>
            </section>
          </>
        )}
      </main>

      <footer className="footer" style={{ marginTop: '4rem' }}>
        <Image src="/logo.png" alt="Torbay Sharks RFC" width={44} height={44} className="footer-logo-img" />
        <p className="footer-wordmark">SHARKFEST</p>
        <p className="footer-sub">Torbay Sharks RFC · Devon Coast</p>
        <nav className="footer-links">
          <Link href="/">Home</Link>
          <Link href="/members">Members area</Link>
        </nav>
        <p className="footer-copy">© 2026 Torbay Sharks RFC. All rights reserved.</p>
      </footer>
    </>
  )
}
