import Image from 'next/image'
import Link from 'next/link'
import type { Metadata } from 'next'
import { Suspense } from 'react'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'
import { getActiveMembership, memberPriceId, memberDiscountPercent } from '@/lib/membership'
import { MEMBERSHIP_TIERS, type MemberPlan } from '@/lib/types'
import { LoginForm } from '@/components/LoginForm'
import { MembershipPlans } from '@/components/MembershipPlans'
import { SignOutButton } from '@/components/SignOutButton'
import { OceanCanvas } from '@/components/OceanCanvas'
import { Marquee } from '@/components/Marquee'
import { ScrollReveal } from '@/components/ScrollReveal'
import { MembershipCard } from '@/components/MembershipCard'
import { PlanTicket, CommunityTicket } from '@/components/PlanTicket'

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

const PERKS_MARQUEE = [
  'Join the shiver',
  'Members-only festival',
  '25th anniversary · 2027',
  'First access to signups',
  'Digital membership card',
  'Member discount on tickets',
  'Events all year round',
  'Back the Sharks',
]

const BENEFITS = [
  {
    num: '01',
    title: 'The festival is yours',
    body: 'SharkFest 2027 registration is exclusive to members — and your discount is applied automatically when you book.',
  },
  {
    num: '02',
    title: 'First through the gates',
    body: 'Members get first access the moment signups open for our 25th anniversary festival.',
  },
  {
    num: '03',
    title: 'Card-carrying Shark',
    body: 'A digital membership pass on your phone — your name, your number, ready whenever you need it.',
  },
  {
    num: '04',
    title: 'Between the tides',
    body: 'Behind-the-scenes stories, photos, socials and member gatherings in the long months between festivals.',
  },
  {
    num: '05',
    title: 'Every penny backs the club',
    body: 'Membership directly supports Torbay Sharks RFC — the rugby, the juniors, and the festival itself.',
  },
]

const STEPS = [
  { num: '1', title: 'Pick your pass', body: 'Individual/Couple or Family — or join free as a Community Member.' },
  { num: '2', title: 'Confirm your email', body: 'New or returning, we send you a secure link. No password, no forms.' },
  { num: '3', title: "You're in", body: 'Paid plans check out securely via Stripe — your members area unlocks straight away.' },
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
  const isPaidMember = !!membership && membership.plan !== 'community'

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

      <main>
        {/* ── Hero: into the ocean ─────────────────────────────── */}
        <section className="jn-hero">
          <OceanCanvas />
          <div className="hero-overlay" aria-hidden="true" />

          <div className="jn-hero-inner">
            <p className="hero-eyebrow">Torbay Sharks RFC · Membership</p>
            <h1 className="jn-hero-title">Join the shiver</h1>
            <p className="jn-hero-kicker">A group of sharks is called a shiver. Ours meets on the Devon coast.</p>
            <p className="jn-hero-lede">
              SharkFest 2026 is in the books — and 2027 is our 25th anniversary.
              The festival is members-only, so membership is your way in.
              The rest of the year? You&apos;re one of us.
            </p>

            <div className="hero-stats">
              <div className="stat-pill"><span className="stat-pill-val">25</span><span className="stat-pill-lbl">years of SharkFest in 2027</span></div>
              <div className="stat-pill"><span className="stat-pill-val">2027</span><span className="stat-pill-lbl">members-only festival</span></div>
              <div className="stat-pill"><span className="stat-pill-val">365</span><span className="stat-pill-lbl">days a Shark</span></div>
            </div>

            <div className="hero-cta" style={{ marginTop: '1.5rem' }}>
              {isPaidMember ? (
                <Link href="/members" className="btn btn-accent">
                  Go to members area
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </Link>
              ) : (
                <a href="#plans" className="btn btn-accent">
                  Pick your pass
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true"><path d="M12 5v14M5 12l7 7 7-7"/></svg>
                </a>
              )}
            </div>
            {!isLoggedIn && (
              <p className="hero-signin">Already a member? <a href="#signin">Sign in</a></p>
            )}
          </div>

          <div className="hero-wave" aria-hidden="true">
            <svg viewBox="0 0 1440 56" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
              <path d="M0,28 C240,56 480,0 720,28 C960,56 1200,0 1440,28 L1440,56 L0,56 Z" fill="#fbbf24"/>
            </svg>
          </div>
        </section>

        {/* Doubled so each marquee half is wide enough to loop without a gap. */}
        <Marquee items={[...PERKS_MARQUEE, ...PERKS_MARQUEE]} />

        {/* ── The deep: what membership gets you ───────────────── */}
        <section className="jn-deep" aria-label="Membership benefits">
          <div className="jn-deep-grid">
            <ScrollReveal className="jn-card-col">
              <div className="jn-card-stage" aria-hidden="true">
                <MembershipCard
                  name="Sam Shark"
                  membershipNumber="TS-0025"
                  plan="individual"
                  status="active"
                  memberSince="2026-06-01"
                  qrDataUrl={null}
                />
              </div>
              <p className="jn-card-caption">Your digital membership card — yours from day one.</p>
            </ScrollReveal>

            <div>
              <ScrollReveal>
                <p className="section-label jn-deep-label"><span className="section-label-line" />Membership</p>
                <h2 className="jn-deep-title">More than a ticket</h2>
              </ScrollReveal>
              <div>
                {BENEFITS.map((b, i) => (
                  <ScrollReveal key={b.num} delay={i * 80}>
                    <div className="jn-benefit">
                      <span className="jn-benefit-num" aria-hidden="true">{b.num}</span>
                      <div>
                        <p className="jn-benefit-title">{b.title}</p>
                        <p className="jn-benefit-body">{b.body}</p>
                      </div>
                    </div>
                  </ScrollReveal>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* wave transition: deep navy → off-white passes section */}
        <div className="jn-wave" aria-hidden="true">
          <svg viewBox="0 0 1440 60" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
            <path d="M0,30 C360,60 720,0 1080,30 C1260,45 1380,15 1440,30 L1440,60 L0,60 Z" fill="#fafaf9"/>
          </svg>
        </div>

        {/* ── Passes ───────────────────────────────────────────── */}
        {isPaidMember ? (
          <section className="jn-passes" id="plans">
            <div className="jn-already">
              <p className="jn-already-eyebrow">Torbay Sharks · Membership</p>
              <p className="jn-already-title">You&apos;re already one of the shiver</p>
              <p className="jn-already-sub">Thanks for backing the club — your members area is waiting.</p>
              <Link href="/members" className="btn btn-accent join-cta">Go to members area</Link>
            </div>
          </section>
        ) : user ? (
          <section className="jn-passes" id="plans">
            <p className="jn-passes-eyebrow">Membership</p>
            <h2 className="jn-passes-title">Pick your pass</h2>
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
            <section className="jn-passes" id="plans">
              <p className="jn-passes-eyebrow">Membership</p>
              <h2 className="jn-passes-title">Pick your pass</h2>
              <div className="join-plans">
                <div className="tix-grid">
                  {paidTiers.map(tier => (
                    <PlanTicket
                      key={tier.id}
                      tier={tier}
                      amount={prices[tier.id as 'individual' | 'family']}
                      savePercent={discount}
                    >
                      <Link href={`/join?plan=${tier.id}#signin`} className="btn btn-accent join-cta">
                        Join as {tier.label}
                      </Link>
                    </PlanTicket>
                  ))}
                </div>
                <p className="tix-fineprint">
                  Billed monthly · Secure payment via Stripe · Cancel any time · Members save {discount}% on SharkFest 2027 tickets
                </p>
                {communityTier && (
                  <div className="tix-community-wrap">
                    <div className="tix-divider"><span>or</span></div>
                    <CommunityTicket tier={communityTier}>
                      <Link href={`/join?plan=community#signin`} className="btn join-community-btn" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        Join for free
                      </Link>
                    </CommunityTicket>
                  </div>
                )}
              </div>
            </section>

            <section className="jn-steps-wrap" aria-label="How joining works">
              <h2 className="jn-steps-title">In the door in two minutes</h2>
              <div className="jn-steps">
                {STEPS.map(s => (
                  <div className="jn-step" key={s.num}>
                    <span className="jn-step-num" aria-hidden="true">{s.num}</span>
                    <p className="jn-step-title">{s.title}</p>
                    <p className="jn-step-body">{s.body}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* wave transition: off-white → navy sign-in band */}
            <div className="relive-wave" aria-hidden="true">
              <svg viewBox="0 0 1440 60" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
                <path d="M0,30 C360,60 720,0 1080,30 C1260,45 1380,15 1440,30 L1440,60 L0,60 Z" fill="#0f172a"/>
              </svg>
            </div>

            <section className="jn-signin" id="signin">
              <div className="jn-signin-inner">
                <Suspense fallback={<div className="auth-card" style={{ minHeight: 260 }} />}>
                  {/* Send them back to /join (with their chosen plan remembered) after
                      sign-in so they land on the plan picker to finish joining. */}
                  <LoginForm defaultNext={chosenPlan ? `/join?plan=${chosenPlan}` : '/join'} />
                </Suspense>
              </div>
            </section>
          </>
        )}
      </main>

      <footer className="footer" style={isLoggedIn ? { marginTop: '4rem' } : undefined}>
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
